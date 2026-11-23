/**
 * Hourly radar: the only channel allowed to reach the outside world and use AI.
 * Everything here is bounded (timeouts + request counts), writes only D1, and
 * never throws to the scheduler — a failed run simply leaves yesterday's data.
 *
 * Frontend pages never call this; they read radar_items from D1 like any other
 * table. Candidate links are recorded as external facts, never verified claims.
 */
import type { AppLoadContext } from "react-router";
import type { Env } from "../../workers/env";
import { many, stmt, batch } from "./db.server";

type Kind = "opportunity" | "tool";

interface Candidate {
  source_url: string;
  source: string;
  title: string;
  raw: string;        // raw text handed to the refiner
  tag: string;
  meta: string | null;
  published_at: number;
}

interface Refined {
  source_url: string;
  title: string;
  summary: string;
  tag: string;
}

const FETCH_TIMEOUT = 8000;
// The OpenAI-compatible endpoint used in production reasons before answering
// and regularly takes 45-70s. Give it room; the 8s timeout is for raw fetches.
const LLM_TIMEOUT = 90000;
const PER_KIND_NEW = 6;      // at most 6 new items refined per kind per run
const KEEP_PER_KIND = 40;    // trim older rows beyond this per kind

/** db.server helpers read context.cloudflare.env.DB; the scheduled job has no request context. */
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

function cleanText(s: unknown, max = 240): string {
  return String(s ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function guessTag(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("mcp")) return "MCP";
  if (t.includes("eval") || t.includes("benchmark")) return "Eval";
  if (t.includes("voice") || t.includes("sip") || t.includes("tts")) return "语音交互";
  if (t.includes("ocr") || t.includes("document") || t.includes("pdf")) return "OCR";
  if (t.includes("rag") || t.includes("retriev")) return "RAG";
  if (t.includes("air-gapped") || t.includes("offline") || t.includes("vllm")) return "私有部署";
  return "Agent";
}

const HN_TERMS = ["forward deployed", "ai agent", "enterprise rag", "voice agent", "ocr", "air-gapped"];
const TOOL_TERMS = ["mcp", "rag", "ocr", "vllm", "voice-agent", "browser-use", "eval", "agent"];

/** HN: opportunities by date + Show HN engineering tools. */
async function fetchHN(): Promise<{ opportunities: Candidate[]; tools: Candidate[] }> {
  const now = Math.floor(Date.now() / 1000);
  const since = now - 72 * 3600;
  const opportunities: Candidate[] = [];
  const tools: Candidate[] = [];
  const seen = new Set<string>();

  const base = "https://hn.algolia.com/api/v1/search_by_date";
  // Two bounded requests: FDE opportunities, and Show HN engineering tools.
  const [oppJson, showJson] = await Promise.all([
    getJson(`${base}?query=${encodeURIComponent("AI agent")}&tags=story&numericFilters=created_at_i>${since}&hitsPerPage=50`),
    getJson(`${base}?tags=show_hn&numericFilters=created_at_i>${since - 30 * 86400}&hitsPerPage=50`),
  ]);

  const take = (hits: any[] | undefined, as: Kind) => {
    for (const h of hits ?? []) {
      const title = cleanText(h.title ?? h.story_title, 180);
      const url = (h.url || (h.objectID ? `https://news.ycombinator.com/item?id=${h.objectID}` : "")) as string;
      const text = `${title} ${cleanText(h.story_text, 220)}`;
      const points = Number(h.points ?? 0);
      const comments = Number(h.num_comments ?? 0);
      if (!title || !url.startsWith("http") || seen.has(url)) continue;
      const toolish = /show hn/i.test(title) || TOOL_TERMS.some((t) => text.toLowerCase().includes(t));
      if (as === "opportunity") {
        const hit = HN_TERMS.some((t) => text.toLowerCase().includes(t));
        if (!hit || (points < 10 && comments < 5)) continue;
      } else if (!toolish || (points < 5 && comments < 2)) continue;
      seen.add(url);
      const c: Candidate = {
        source_url: url,
        source: "HN",
        title,
        raw: text,
        tag: guessTag(text),
        meta: `HN · ${comments} 评`,
        published_at: Number(h.created_at_i ?? since) * 1000,
      };
      (as === "opportunity" ? opportunities : tools).push(c);
    }
  };

  take(oppJson?.hits, "opportunity");
  take(showJson?.hits, "tool");
  return {
    opportunities: opportunities.sort((a, b) => b.published_at - a.published_at).slice(0, 12),
    tools: tools.sort((a, b) => b.published_at - a.published_at).slice(0, 12),
  };
}

/** GitHub: recently created or trending open tools, one bounded request. */
async function fetchGitHubTools(token?: string): Promise<Candidate[]> {
  const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString().slice(0, 10);
  // GitHub Search needs `in:` for a keyword group; without it the query is rejected.
  const q = `created:>${since} stars:>40 (mcp OR rag OR ocr OR vllm OR voice-agent OR browser-use OR eval OR agent) in:name,description`;
  const headers: Record<string, string> = { "User-Agent": "imfde-radar", Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const json = await getJson(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=12`,
    headers,
  );
  const out: Candidate[] = [];
  for (const r of json?.items ?? []) {
    const url = String(r.html_url ?? "");
    const title = cleanText(r.full_name ?? r.name, 120);
    const desc = cleanText(r.description, 220);
    if (!url.startsWith("https://github.com/")) continue;
    out.push({
      source_url: url,
      source: "GitHub",
      title,
      raw: `${title} ${desc}`,
      tag: guessTag(`${title} ${desc}`),
      meta: `GitHub · ${Number(r.stargazers_count ?? 0)} ★`,
      published_at: Date.parse(r.created_at ?? "") || Date.now(),
    });
  }
  return out.slice(0, 12);
}

const SYSTEM_PROMPT = `你在整理给驻场部署工程师（FDE）看的外部线索。只保留真正对现场部署、集成、交付有价值的机会或工具；筛掉营销水贴、招聘泛帖、纯新闻。对每条输入输出一行 JSON 对象，字段 source_url（原样回填）、title（12 字以内的中文短语）、summary（1-2 句平实中文，直说具体痛点、需求或工具在现场能解决什么问题）、tag（从 Agent/RAG/OCR/语音交互/私有部署/MCP/Eval 里选一个）。只输出 JSON 数组，不要其它文字。严禁使用这些词：赋能、闭环、重塑、一站式、革命性、值得关注、打造、生态、抓手。不要写空泛形容词。`;

function fallbackRefine(items: Candidate[]): Refined[] {
  return items.map((c) => {
    let title = c.title.replace(/^Show HN:\s*/i, "").trim();
    if (title.length > 28) title = title.slice(0, 27) + "…";
    const body = cleanText(c.raw.replace(c.title, ""), 110) || "外部来源收录，点开看原文。";
    return { source_url: c.source_url, title, summary: body, tag: c.tag };
  });
}

function parseRefined(text: string | null, items: Candidate[]): Refined[] {
  if (!text) return [];
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr)) return [];
    const allowed = new Set(items.map((i) => i.source_url));
    const tagSet = new Set(["Agent", "RAG", "OCR", "语音交互", "私有部署", "MCP", "Eval"]);
    return arr
      .filter((x: any) => x && allowed.has(x.source_url))
      .map((x: any) => ({
        source_url: String(x.source_url),
        title: cleanText(x.title, 60),
        summary: cleanText(x.summary, 300),
        tag: tagSet.has(x.tag) ? x.tag : guessTag(String(x.summary ?? "")),
      }))
      .filter((x: Refined) => x.title && x.summary);
  } catch {
    return [];
  }
}

async function refine(items: Candidate[], env: Env): Promise<Refined[]> {
  if (!items.length) return [];
  const payload = items.map((c) => ({ source_url: c.source_url, title: c.title, text: c.raw, meta: c.meta }));
  let text: string | null = null;

  // 1) OpenAI-compatible endpoint, if configured.
  if (env.LLM_API_KEY) {
    const base = env.LLM_BASE_URL || "https://api.openai.com/v1";
    const model = env.LLM_MODEL || "gpt-4o-mini";
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.LLM_API_KEY}` },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: JSON.stringify(payload) },
          ],
        }),
        signal: AbortSignal.timeout(LLM_TIMEOUT),
      });
      if (res.ok) {
        const j: any = await res.json();
        text = j?.choices?.[0]?.message?.content ?? null;
      }
    } catch { /* fall through */ }
  }

  // 2) Cloudflare Workers AI binding.
  if (!text && env.AI) {
    try {
      const out: any = await (env.AI as any).run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(payload) },
        ],
        temperature: 0.2,
      });
      text = typeof out?.response === "string" ? out.response : (out?.result ?? null);
    } catch { /* fall through */ }
  }

  const parsed = parseRefined(text, items);
  return parsed.length ? parsed : fallbackRefine(items);
}

export async function runRadarJob(env: Env): Promise<{ insertedOpportunities: number; insertedTools: number }> {
  let insertedOpportunities = 0;
  let insertedTools = 0;
  try {
    const [hn, gh] = await Promise.all([fetchHN(), fetchGitHubTools(env.GITHUB_TOKEN)]);
    const grouped: Record<Kind, Candidate[]> = {
      opportunity: hn.opportunities,
      tool: [...hn.tools, ...gh]
        .filter((c, i, a) => a.findIndex((x) => x.source_url === c.source_url) === i)
        .slice(0, 12),
    };

    const c = ctx(env);
    // Pre-compute which kinds have fresh candidates, then refine both in
    // parallel: the slow reasoning model costs ~60s per call, not ~120s.
    const freshByKind: Record<Kind, Candidate[]> = { opportunity: [], tool: [] };
    for (const kind of ["opportunity", "tool"] as Kind[]) {
      const placeholders = grouped[kind].map(() => "?").join(",") || "''";
      const existing = await many<{ source_url: string }>(
        c,
        `SELECT source_url FROM radar_items WHERE source_url IN (${placeholders})`,
        ...grouped[kind].map((i) => i.source_url),
      );
      const known = new Set(existing.map((r) => r.source_url));
      freshByKind[kind] = grouped[kind].filter((i) => !known.has(i.source_url)).slice(0, PER_KIND_NEW);
    }
    const [refinedOpportunities, refinedTools] = await Promise.all([
      freshByKind.opportunity.length ? refine(freshByKind.opportunity, env) : Promise.resolve([]),
      freshByKind.tool.length ? refine(freshByKind.tool, env) : Promise.resolve([]),
    ]);
    const refinedByKind = { opportunity: refinedOpportunities, tool: refinedTools };

    for (const kind of ["opportunity", "tool"] as Kind[]) {
      const fresh = freshByKind[kind];
      if (!fresh.length) continue;
      const refined = refinedByKind[kind];
      const byUrl = new Map(refined.map((r) => [r.source_url, r]));
      const now = Date.now();
      const statements = fresh
        .map((item) => {
          const r = byUrl.get(item.source_url);
          if (!r) return null;
          return stmt(
            c,
            `INSERT OR IGNORE INTO radar_items
              (id, kind, source, source_url, title, summary, tag, meta, published_at, fetched_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
            crypto.randomUUID(), kind, item.source, item.source_url,
            r.title, r.summary, r.tag, item.meta, item.published_at, now,
          );
        })
        .filter((s): s is ReturnType<typeof stmt> => s !== null);
      const results = await batch(c, statements);
      const count = results.reduce((n, r) => n + (Number((r as any)?.meta?.changes ?? (r as any)?.changes ?? 0) || 0), 0);
      if (kind === "opportunity") insertedOpportunities = count; else insertedTools = count;

      // Keep the table light: drop rows beyond 40 per kind.
      await stmt(
        c,
        `DELETE FROM radar_items WHERE kind = ?1 AND id NOT IN (
           SELECT id FROM radar_items WHERE kind = ?1 ORDER BY fetched_at DESC, published_at DESC LIMIT ?2
         )`,
        kind, KEEP_PER_KIND,
      ).run();
    }
  } catch {
    // Never propagate: a scheduled failure must not break the worker.
  }
  return { insertedOpportunities, insertedTools };
}
