/**
 * Hourly radar v2: job (招聘) and gig (接单) intelligence, domestic + overseas.
 * The only channel allowed outside the platform and to use AI; writes D1 only.
 *
 * Strict: no fallback/placeholder text. If a source is unreachable or the AI
 * does not return a valid structured item, nothing is written for it.
 */
import type { AppLoadContext } from "react-router";
import type { Env } from "../../workers/env";
import { many, stmt, batch } from "./db.server";
import { webContext } from "./web-search.server";

type Kind = "job" | "gig";
type Region = "domestic" | "overseas";

interface Candidate {
  source_url: string;
  source: string;
  region: Region;
  kind: Kind;
  title: string;   // raw title from the source
  raw: string;     // raw text handed to the model
  published_at: number;
}

interface Intel {
  source_url: string;
  title: string;
  company: string | null;
  location: string | null;
  budget: string | null;
  summary: string;
  detail_md: string;
  tag: string;
  meta: string | null;
}

const FETCH_TIMEOUT = 8000;
const LLM_TIMEOUT = 180000;
const PER_KIND_NEW = 4;
const KEEP_PER_KIND = 60;
const TAGS = ["FDE", "Agent", "RAG", "语音交互", "OCR", "私有部署", "MCP"];

function ctx(env: Env): AppLoadContext {
  return { cloudflare: { env, ctx: {} as ExecutionContext } } as AppLoadContext;
}

async function getJson(url: string, headers: Record<string, string> = {}): Promise<any | null> {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function clean(s: unknown, max = 300): string {
  return String(s ?? "")
    .replace(/<[^>]*>/g, " ").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().slice(0, max);
}

function guessTag(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("mcp")) return "MCP";
  if (t.includes("语音") || t.includes("voice")) return "语音交互";
  if (t.includes("ocr") || t.includes("单据")) return "OCR";
  if (t.includes("rag") || t.includes("检索")) return "RAG";
  if (t.includes("私有") || t.includes("内网") || t.includes("驻场")) return "私有部署";
  if (t.includes("agent")) return "Agent";
  return "FDE";
}

const JOB_RE = /forward deployed|solutions? engineer|field engineer|deployment|ai engineer|implementation|solutions? architect/i;
const GIG_RE = /freelanc|forhire|bounty|paid|grant|外包|接单|项目合作|兼职/i;
const AI_RE = /agent|rag|ocr|vllm|mcp|llm|大模型|语音|自动化|检索|私有化|fde|AI/i;

/** Overseas jobs: Greenhouse + Ashby public boards, HN hiring, Remotive. */
async function fetchOverseasJobs(): Promise<Candidate[]> {
  const out: Candidate[] = [];
  const boards: Array<{ source: string; url: string; api: "gh" | "ashby" | "hn" | "remotive" }> = [
    { source: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/scaleai/jobs", api: "gh" },
    { source: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/databricks/jobs", api: "gh" },
    { source: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/anthropic/jobs", api: "gh" },
    { source: "Ashby", url: "https://api.ashbyhq.com/posting-api/job-board/langchain", api: "ashby" },
    { source: "Ashby", url: "https://api.ashbyhq.com/posting-api/job-board/perplexity", api: "ashby" },
    { source: "Ashby", url: "https://api.ashbyhq.com/posting-api/job-board/cohere", api: "ashby" },
    { source: "HN", url: "https://hn.algolia.com/api/v1/search_by_date?query=Who%20is%20hiring&tags=comment&hitsPerPage=30", api: "hn" },
    { source: "Remotive", url: "https://remotive.com/api/remote-jobs?category=software-dev&limit=50", api: "remotive" },
  ];
  const results = await Promise.all(boards.map((b) => getJson(b.url)));
  results.forEach((json, i) => {
    const b = boards[i];
    let rows: any[] = [];
    if (b.api === "gh") rows = json?.jobs ?? [];
    else if (b.api === "ashby") rows = json?.jobs ?? [];
    else if (b.api === "hn") rows = (json?.hits ?? []).filter((h: any) => JOB_RE.test(clean(h.comment_text, 400)) || AI_RE.test(clean(h.comment_text, 400)));
    else if (b.api === "remotive") rows = (json?.jobs ?? []).filter((j: any) => JOB_RE.test(clean(j.title)) || AI_RE.test(clean(j.title)));
    for (const j of rows) {
      const title = clean(j.title ?? (b.api === "hn" ? "Hiring" : ""), 160);
      const url = String(j.absolute_url || j.jobUrl || j.url || (j.objectID ? `https://news.ycombinator.com/item?id=${j.objectID}` : ""));
      const text = `${title} ${clean(j.comment_text ?? j.description ?? j.content ?? "", 400)}`;
      if (!url.startsWith("http") || !title) continue;
      if (b.api !== "hn" && b.api !== "remotive" && !JOB_RE.test(title)) continue;
      out.push({ source_url: url, source: b.source, region: "overseas", kind: "job", title, raw: text, published_at: Date.parse(j.created_at ?? j.updated_at ?? "") || Date.now() });
    }
  });
  return out.slice(0, 16);
}

/** Domestic jobs: V2EX jobs node + Eleduck (电鸭), Chinese keyword filter. */
async function fetchDomesticJobs(): Promise<Candidate[]> {
  const sources = [
    { source: "V2EX", url: "https://www.v2ex.com/api/topics/show.json?node_name=jobs" },
    { source: "电鸭", url: "https://eleduck.com/api/v1/posts?category=job" },
  ];
  const results = await Promise.all(sources.map((s) => getJson(s.url, { "User-Agent": "imfde-radar" })));
  const out: Candidate[] = [];
  results.forEach((json, i) => {
    const s = sources[i];
    const rows: any[] = Array.isArray(json) ? json : (json?.posts ?? json?.data ?? []);
    for (const j of rows) {
      const title = clean(j.title ?? j.name, 160);
      const url = String(j.url ?? j.link ?? (j.id ? `https://www.v2ex.com/t/${j.id}` : ""));
      const text = `${title} ${clean(j.content ?? j.content_rendered ?? j.summary ?? "", 400)}`;
      if (!url.startsWith("http") || !title) continue;
      if (!/AI|agent|大模型|rag|fde|解决方案|私有化|语音|ocr/i.test(text)) continue;
      out.push({ source_url: url, source: s.source, region: "domestic", kind: "job", title, raw: text, published_at: Number(j.created) ? Number(j.created) * 1000 : (Date.parse(j.created_at ?? "") || Date.now()) });
    }
  });
  return out.slice(0, 16);
}

/** Overseas gigs: HN Ask HN / freelancer, GitHub bounty issues, Reddit r/forhire. */
async function fetchOverseasGigs(token?: string): Promise<Candidate[]> {
  const ghHeaders: Record<string, string> = { "User-Agent": "imfde-radar", Accept: "application/vnd.github+json" };
  if (token) ghHeaders.Authorization = `Bearer ${token}`;
  const sources: Array<{ source: string; url: string; headers: Record<string, string> }> = [
    { source: "HN", url: "https://hn.algolia.com/api/v1/search_by_date?query=freelancer&tags=story,comment&hitsPerPage=30", headers: {} },
    { source: "GitHub Bounty", url: "https://api.github.com/search/issues?q=label%3Abounty+is%3Aissue+is%3Aopen+(mcp+OR+rag+OR+agent+OR+vllm+OR+ocr)&per_page=15", headers: ghHeaders },
    { source: "Reddit", url: "https://www.reddit.com/r/forhire/new.json?limit=25", headers: { "User-Agent": "imfde-radar" } },
  ];
  const results = await Promise.all(sources.map((s) => getJson(s.url, s.headers)));
  const out: Candidate[] = [];
  results.forEach((json, i) => {
    const s = sources[i];
    let rows: any[] = [];
    if (s.source === "HN") rows = (json?.hits ?? []).filter((h: any) => GIG_RE.test(clean(h.title, 200) + clean(h.comment_text, 200)) && AI_RE.test(clean(h.title, 200) + clean(h.comment_text, 200)));
    else if (s.source === "GitHub Bounty") rows = json?.items ?? [];
    else rows = (json?.data?.children ?? []).map((c: any) => c.data).filter((d: any) => /\[Hiring\]/i.test(d.title ?? "") && AI_RE.test(`${d.title} ${d.selftext}`));
    for (const j of rows) {
      const title = clean(j.title ?? j.story_title, 160);
      const url = String(j.html_url ?? j.url ?? (j.objectID ? `https://news.ycombinator.com/item?id=${j.objectID}` : ""));
      const text = `${title} ${clean(j.body ?? j.selftext ?? j.comment_text ?? "", 400)}`;
      if (!url.startsWith("http") || !title) continue;
      out.push({ source_url: url, source: s.source, region: "overseas", kind: "gig", title, raw: text, published_at: Date.parse(j.created_at ?? "") || Date.now() });
    }
  });
  return out.slice(0, 16);
}

/** Domestic gigs: Eleduck project board + V2EX freelance/help posts. */
async function fetchDomesticGigs(): Promise<Candidate[]> {
  const sources = [
    { source: "电鸭", url: "https://eleduck.com/api/v1/posts?category=project" },
    { source: "V2EX", url: "https://www.v2ex.com/api/topics/show.json?node_name=jobs" },
  ];
  const results = await Promise.all(sources.map((s) => getJson(s.url, { "User-Agent": "imfde-radar" })));
  const out: Candidate[] = [];
  results.forEach((json, i) => {
    const s = sources[i];
    const rows: any[] = Array.isArray(json) ? json : (json?.posts ?? json?.data ?? []);
    for (const j of rows) {
      const title = clean(j.title ?? j.name, 160);
      const url = String(j.url ?? j.link ?? (j.id ? `https://www.v2ex.com/t/${j.id}` : ""));
      const text = `${title} ${clean(j.content ?? j.content_rendered ?? j.summary ?? "", 400)}`;
      if (!url.startsWith("http") || !title) continue;
      if (!/外包|接单|项目合作|兼职|freelance/i.test(text)) continue;
      if (!AI_RE.test(text)) continue;
      out.push({ source_url: url, source: s.source, region: "domestic", kind: "gig", title, raw: text, published_at: Number(j.created) ? Number(j.created) * 1000 : (Date.parse(j.created_at ?? "") || Date.now()) });
    }
  });
  return out.slice(0, 16);
}

const SYSTEM_PROMPT = `你在整理给驻场部署工程师（FDE）看的招聘信息与接单机会。只保留真实、具体、对做现场交付/集成/AI 落地的人有价值的条目；筛掉营销水贴、无关新闻、纯工具介绍。每条输出一个 JSON 对象，字段：
source_url（原样回填）、title（不超过18字中文）、company（公司或发布方，无则空字符串）、location（如"上海 · 驻场"、"全球远程"，无则空字符串）、budget（薪资或预算，如"35-55k/月"、"$180k-$240k"、"预算5-8万"，无则空字符串）、summary（26-44字平实中文，说清具体在做什么）、detail_md（150-300字中文，分三段，段首分别用"需求/岗位背景：""核心要求：""方式与备注："，三段之间用换行分隔；讲背景、要求、投递或接单建议，写具体，不要空话）、tag（必须严格从 ${TAGS.join("/")} 里选一个，不要自造）、meta（一个简短字符串，如"全职"、"远程"、"$2,500 赏金"，不要数组，严禁包含来源名称）。
只输出 JSON 数组，数组里只放符合要求的条目，不要其它文字。严禁这些词：赋能、闭环、重塑、一站式、革命性、值得关注、打造、生态、抓手。不要写空泛形容词。`;

function parseIntel(text: string | null, items: Candidate[]): Intel[] {
  if (!text) return [];
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr)) return [];
    const allowed = new Set(items.map((i) => i.source_url));
    return arr
      .filter((x: any) => x && allowed.has(x.source_url))
      .map((x: any) => ({
        source_url: String(x.source_url),
        title: clean(x.title, 40),
        company: x.company ? clean(x.company, 80) : null,
        location: x.location ? clean(x.location, 80) : null,
        budget: x.budget ? clean(x.budget, 60) : null,
        summary: clean(x.summary, 120),
        detail_md: String(x.detail_md ?? "").trim(),
        tag: TAGS.includes(x.tag) ? x.tag : guessTag(`${x.title} ${x.summary} ${x.tag ?? ""}`),
        meta: Array.isArray(x.meta) ? x.meta.map((m: unknown) => clean(m, 24)).filter(Boolean).join(" · ")
              : (x.meta ? clean(x.meta, 40) : null),
      }))
      .filter((x: Intel) => x.title && x.summary && x.detail_md.length >= 60);
  } catch {
    return [];
  }
}

async function refine(items: Candidate[], env: Env): Promise<Intel[]> {
  if (!items.length) return [];
  const payload = items.map((c) => ({ source_url: c.source_url, source: c.source, title: c.title, text: c.raw, region: c.region, kind: c.kind }));
  // Ground the model with live facts for the dominant topic of this batch.
  const topic = items[0]?.title ?? "AI";
  let groundedPrompt = SYSTEM_PROMPT;
  try { groundedPrompt = SYSTEM_PROMPT + "\n\n" + await webContext(topic, 3); } catch { /* no change */ }
  let text: string | null = null;

  if (env.LLM_API_KEY) {
    const base = env.LLM_BASE_URL || "https://api.openai.com/v1";
    const model = env.LLM_MODEL || "gpt-4o-mini";
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.LLM_API_KEY}` },
        body: JSON.stringify({
          model, temperature: 0.2, max_tokens: 2200,
          messages: [{ role: "system", content: groundedPrompt }, { role: "user", content: JSON.stringify(payload) }],
        }),
        signal: AbortSignal.timeout(LLM_TIMEOUT),
      });
      if (res.ok) {
        const j: any = await res.json();
        text = j?.choices?.[0]?.message?.content ?? null;
      }
    } catch { /* skip */ }
  }

  if (!text && env.AI) {
    try {
      const out: any = await (env.AI as any).run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [{ role: "system", content: groundedPrompt }, { role: "user", content: JSON.stringify(payload) }],
        temperature: 0.2, max_tokens: 2200,
      });
      text = typeof out?.response === "string" ? out.response : (out?.result ?? null);
    } catch { /* skip */ }
  }

  return parseIntel(text, items); // no fallback: garbage in, nothing out
}

export async function runRadarJob(env: Env): Promise<{ insertedJobs: number; insertedGigs: number }> {
  let insertedJobs = 0;
  let insertedGigs = 0;
  try {
    const [ovJobs, domJobs, ovGigs, domGigs] = await Promise.all([
      fetchOverseasJobs(), fetchDomesticJobs(), fetchOverseasGigs(env.GITHUB_TOKEN), fetchDomesticGigs(),
    ]);
    const all: Candidate[] = [...ovJobs, ...domJobs, ...ovGigs, ...domGigs]
      .filter((c, i, a) => a.findIndex((x) => x.source_url === c.source_url) === i);
    const c = ctx(env);

    const freshByKind: Record<Kind, Candidate[]> = { job: [], gig: [] };
    for (const kind of ["job", "gig"] as Kind[]) {
      const group = all.filter((x) => x.kind === kind);
      if (!group.length) continue;
      const ph = group.map(() => "?").join(",");
      const existing = await many<{ source_url: string }>(c,
        `SELECT source_url FROM intel_items WHERE source_url IN (${ph})`, ...group.map((x) => x.source_url));
      const known = new Set(existing.map((r) => r.source_url));
      freshByKind[kind] = group.filter((x) => !known.has(x.source_url)).slice(0, PER_KIND_NEW);
    }

    // Serialize the two AI calls: the reasoning endpoint slows sharply under
    // concurrency; one call at a time stays within the timeout.
    const jobs = freshByKind.job.length ? await refine(freshByKind.job, env) : [];
    const gigs = freshByKind.gig.length ? await refine(freshByKind.gig, env) : [];

    for (const kind of ["job", "gig"] as Kind[]) {
      const refined = kind === "job" ? jobs : gigs;
      const byUrl = new Map(refined.map((r) => [r.source_url, r]));
      const now = Date.now();
      const statements = freshByKind[kind]
        .map((item) => {
          const r = byUrl.get(item.source_url);
          if (!r) return null;
          return stmt(c,
            `INSERT OR IGNORE INTO intel_items
              (id, kind, region, source, source_url, title, company, location, budget, summary, detail_md, tag, meta, published_at, fetched_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)`,
            crypto.randomUUID(), kind, item.region, item.source, item.source_url,
            r.title, r.company, r.location, r.budget, r.summary, r.detail_md, r.tag, r.meta,
            item.published_at, now,
          );
        })
        .filter((x): x is ReturnType<typeof stmt> => x !== null);
      if (!statements.length) continue;
      const results = await batch(c, statements);
      const count = results.reduce((n, r) => n + (Number((r as any)?.meta?.changes ?? (r as any)?.changes ?? 0) || 0), 0);
      if (kind === "job") insertedJobs = count; else insertedGigs = count;

      await stmt(c,
        `DELETE FROM intel_items WHERE kind = ?1 AND id NOT IN (
           SELECT id FROM intel_items WHERE kind = ?1 ORDER BY fetched_at DESC, published_at DESC LIMIT ?2
         )`,
        kind, KEEP_PER_KIND,
      ).run();
    }
  } catch { /* never throw to the scheduler */ }
  return { insertedJobs, insertedGigs };
}
