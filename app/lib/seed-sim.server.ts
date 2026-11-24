/**
 * Seed simulation: gives the seed personas natural, bounded activity so the
 * community feels alive. EACH account has its own independent random cadence
 * (5m-4h) in users.sim_next_at; new users are minted on their own gate and
 * immediately get their own cycle. Also mints works with LLM SVG covers.
 * LLM-generated SVG covers stored as local media blobs. No hardcoded fake text;
 * all pages read D1.
 */
import type { AppLoadContext } from "react-router";
import type { Env } from "../../workers/env";
import { many, one, stmt } from "./db.server";
import { insertPost } from "./queries.server";
import { extractTags } from "./tags";
import { utc8DayKey, slugify } from "./format";
import { webContext } from "./web-search.server";

type SeedUser = { id: string; handle: string; display_name: string; avatar_url: string | null; sim_next_at: number | null };
type Persona = {
  id: string; handle: string; lang: "zh" | "en" | "ja" | "ko" | "zh-en";
  field: string; tone: string;
};
type Action = { kind: string; actor: string; detail: string };

const PERSONAS: Persona[] = [
  { id: "seed_user_kwu", handle: "kwu", lang: "zh", field: "制造/物流系统集成、ERP + OCR", tone: "简短、带现场细节，不写漂亮话" },
  { id: "seed_user_ming", handle: "mchen", lang: "zh-en", field: "Voice AI、电话线路、WebRTC/SIP", tone: "工程口语，爱吐槽真实线路的坑" },
  { id: "seed_user_siyu", handle: "siyu_z", lang: "zh", field: "企业文档检索、内网 RAG、评测", tone: "克制、直接说问题和做法" },
  { id: "seed_user_laok", handle: "laok", lang: "zh", field: "私有化交付、离线机房、显存", tone: "老工程师口吻，短句" },
  { id: "seed_user_fieldcraft", handle: "fieldcraft", lang: "zh", field: "3 人小团队、客服工单与运维自动化", tone: "团队视角，务实" },
  { id: "seed_user_linyu", handle: "linyu", lang: "zh-en", field: "Browser automation、跨境物流 ERP", tone: "中英混说，贴实操" },
  { id: "seed_user_kenji", handle: "ksato_fde", lang: "ja", field: "工場・物流のエッジ推論と画像検査", tone: "日本語、簡潔、現場寄り" },
  { id: "seed_user_minji", handle: "minji_ops", lang: "ko", field: "Voice Agent、사내 RAG、콜 로그 eval", tone: "한국어, 짧고 실무적으로" },
  { id: "seed_user_elena", handle: "erostova", lang: "en", field: "legacy SAP/SharePoint → auditable RAG", tone: "dry, specific, no marketing" },
  { id: "seed_user_devon", handle: "dbrooks", lang: "en", field: "healthcare claims agents, eval harnesses", tone: "plain, candid, engineering shorthand" },
];

const CAPS = { posts: 4, comments: 8, profile: 2 };
const MIN_INTERVAL_MS = 5 * 60 * 1000;
const MAX_INTERVAL_MS = 4 * 60 * 60 * 1000;
const MAX_SIM_USERS = 30;
const LLM_TIMEOUT = 90000;
const BANNED = ["赋能", "闭环", "重塑", "一站式", "打造", "革命性", "值得关注"];

function ctx(env: Env): AppLoadContext {
  return { cloudflare: { env, ctx: {} as ExecutionContext } } as AppLoadContext;
}
function pick<T>(arr: T[]): T | null {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
}
function clean(s: unknown, max = 400): string {
  return String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

/** A model call grounded in live web facts when the prompt concerns current things. */
async function callLLM(env: Env, system: string, user: string, maxTokens = 600): Promise<string | null> {
  const timeSensitive = /发布|released|launch|news|今天|最新|now|current|Gemini|Neon|model|新模型/i.test(user) ||
                        /发布|released|launch|今天|最新|now|current/i.test(system);
  let groundedSystem = system;
  if (timeSensitive) {
    const query = user.replace(/[\n\r]+/g, " ").slice(0, 120);
    const ctx = await webContext(query, 4);
    groundedSystem = `${system}\n\n${ctx}\nBase any claim about releases/current events ONLY on the facts above. If the facts do not confirm a release, do not assert one.`;
  }
  const final = (raw: string | null): string | null => {
    if (!raw) return null;
    const t = String(raw).trim().replace(/^["'「]|["'」]$/g, "");
    return t && !BANNED.some((w) => t.includes(w)) ? t : null;
  };

  if (!env.LLM_API_KEY) {
    if (!env.AI) return null;
    for (const model of ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-3.1-8b-instruct"]) {
      try {
        const out: any = await (env.AI as any).run(model, {
          messages: [{ role: "system", content: groundedSystem }, { role: "user", content: user }],
          temperature: 0.8, max_tokens: maxTokens,
        });
        const r = final(typeof out?.response === "string" ? out.response : (out?.result ?? null));
        if (r) return r;
      } catch { /* next */ }
    }
    return null;
  }

  const base = env.LLM_BASE_URL || "https://api.openai.com/v1";
  const model = env.LLM_MODEL || "gpt-4o-mini";
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.LLM_API_KEY}` },
      body: JSON.stringify({ model, temperature: 0.8, max_tokens: maxTokens, messages: [
        { role: "system", content: groundedSystem }, { role: "user", content: user },
      ] }),
      signal: AbortSignal.timeout(LLM_TIMEOUT),
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    return final(j?.choices?.[0]?.message?.content ?? null);
  } catch { return null; }
}
const LANG_RULE: Record<Persona["lang"], string> = {
  zh: "write in natural mainland Chinese",
  "zh-en": "write in natural Chinese, mixing in English technical terms where real engineers do",
  en: "write in natural English, plain and specific",
  ja: "自然な日本語で書く",
  ko: "자연스러운 한국어로 작성",
};

function systemFor(persona: Persona): string {
  return `You are ${persona.handle}, an FDE with focus: ${persona.field}. Style: ${persona.tone}. ${LANG_RULE[persona.lang]}. ` +
    `Write one short authentic engineering post/comment like on X or 即刻: specific, uneven, no hashtags unless asked. ` +
    `Never use marketing words or empty praise. Output only the text, no quotes, no explanation.`;
}

/** Next-run gate backed by D1: genuinely random 5m-4h cadence. */
function nextDelay(): number {
  return MIN_INTERVAL_MS + Math.floor(Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS));
}

/** Per-account due check: each seed user has its own next-run timestamp. */
function userDue(u: SeedUser, force: boolean): boolean {
  if (force) return true;
  return Date.now() >= (u.sim_next_at ?? 0);
}

/** Schedule this account's next activity at a fresh random point. */
async function scheduleUser(c: AppLoadContext, id: string): Promise<void> {
  await stmt(c, `UPDATE users SET sim_next_at=?1 WHERE id=?2`, Date.now() + nextDelay(), id).run();
}

/** New accounts are minted on their own random cadence, separate from any user. */
async function newUserDue(c: AppLoadContext, force: boolean): Promise<boolean> {
  if (force) return true;
  const row = await one<{ value: number }>(c, `SELECT value FROM seed_sim_state WHERE key='next_new_user_at'`);
  if (Date.now() < (row?.value ?? 0)) return false;
  await stmt(c, `INSERT INTO seed_sim_state (key,value) VALUES ('next_new_user_at',?1)
                  ON CONFLICT(key) DO UPDATE SET value=excluded.value`, Date.now() + nextDelay()).run();
  return true;
}

async function usage(c: AppLoadContext): Promise<{ posts: number; comments: number; profile: number }> {
  const since = Date.now() - 86400000;
  const row = await one<{ posts: number; comments: number; profile: number }>(c,
    `SELECT
      (SELECT COUNT(*) FROM posts po JOIN users u ON u.id=po.author_id
        WHERE u.id LIKE 'seed_user_%' AND po.created_at >= ?1 AND po.repost_of_id IS NULL AND po.repost_comment_id IS NULL) AS posts,
      (SELECT COUNT(*) FROM comments cm JOIN users u ON u.id=cm.author_id
        WHERE u.id LIKE 'seed_user_%' AND cm.created_at >= ?1) AS comments,
      (SELECT COUNT(*) FROM profiles pr JOIN users u ON u.id=pr.user_id
        WHERE u.id LIKE 'seed_user_%' AND pr.updated_at >= ?1) AS profile`,
    since);
  return { posts: row?.posts ?? 0, comments: row?.comments ?? 0, profile: row?.profile ?? 0 };
}

async function seedUsers(c: AppLoadContext): Promise<SeedUser[]> {
  return many<SeedUser>(c,
    `SELECT u.id, u.handle, p.display_name, p.avatar_url, u.sim_next_at
       FROM users u JOIN profiles p ON p.user_id = u.id
      WHERE u.id LIKE 'seed_user_%' AND u.status = 'active'`);
}

/** Mint one brand-new simulated FDE (id prefix seed_user_sim_*). */
async function createSimUser(env: Env, c: AppLoadContext): Promise<{ user: SeedUser; persona: Persona } | null> {
  const count = await one<{ n: number }>(c, `SELECT COUNT(*) AS n FROM users WHERE id LIKE 'seed_user_sim_%'`);
  if ((count?.n ?? 0) >= MAX_SIM_USERS) return null;
  const base = pick(PERSONAS)!;
  const raw = await callLLM(env,
    `You invent a plausible FDE identity. ${LANG_RULE[base.lang]}. Output ONLY JSON: {"handle":"lowercase_2_20","display_name":"name","headline":"one short line","about":"two short sentences about on-site deployment"}. No explanation.`,
    `Field: ${base.field}. Make a distinct person, not a copy of an existing account.`);
  if (!raw) return null;
  let identity: any;
  try { identity = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? ""); } catch { return null; }
  const rawHandle = String(identity.handle ?? "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  if (rawHandle.length < 2) return null;
  const handle = `sim_${rawHandle}`;
  const dupe = await one<{ n: number }>(c, `SELECT COUNT(*) AS n FROM users WHERE handle=?1`, handle);
  if (dupe?.n) return null;
  const id = `seed_user_sim_${crypto.randomUUID().slice(0, 8)}`;
  const now = Date.now();
  const avatar = `/avatars/avatar-${String(1 + Math.floor(Math.random() * 16)).padStart(2, "0")}.svg`;
  await stmt(c,
    `INSERT INTO users (id,email,password_hash,handle,kind,status,created_at,sim_next_at) VALUES (?1,?2,'locked$seed_account_disabled',?3,'individual','active',?4,?5)`,
    id, `${handle}@seed.imfde.invalid`, handle, now, now + nextDelay()).run();
  await stmt(c,
    `INSERT INTO profiles (user_id,display_name,avatar_url,cover_url,headline,about,location,timezone,visibility,hide_follows,updated_at)
     VALUES (?1,?2,?3,NULL,?4,?5,?6,?7,'public',0,?8)`,
    id, clean(identity.display_name, 60) || handle, avatar,
    clean(identity.headline, 100), clean(identity.about, 300),
    base.lang === "ja" ? "東京" : base.lang === "ko" ? "首尔" : "远程", "UTC+8", now).run();
  for (const [i, sk] of ["RAG", "Agent", "Eval", "私有部署"].entries()) {
    await stmt(c, `INSERT OR IGNORE INTO profile_skills (user_id,skill_name,position) VALUES (?1,?2,?3)`, id, sk, i).run();
  }
  return {
    user: { id, handle, display_name: clean(identity.display_name, 60) || handle, avatar_url: avatar, sim_next_at: now + 60_000 },
    persona: { ...base, id, handle },
  };
}

/** Ask the LLM for a minimal self-contained SVG cover, stored as a local blob. */
async function generateCoverSvg(env: Env, title: string): Promise<string | null> {
  const raw = await callLLM(env,
    `Output ONLY raw SVG, no markdown/explanation. viewBox="0 0 1200 800", a muted background rect + 3 abstract bars. No text, no gradients, no external refs.`,
    `Minimal cover: ${title}.`, 900);
  if (!raw) return null;
  const svg = raw.trim().replace(/^```(?:svg)?\s*/, "").replace(/```$/, "").trim();
  if (!svg.startsWith("<svg") || !svg.includes("</svg>") || svg.length > 4000) return null;
  if (/<image|<script|@import|xlink:href|url\(/i.test(svg)) return null;
  return svg;
}

/** Create one simulated work with an LLM-generated SVG cover. */
async function createSimProject(env: Env, c: AppLoadContext, u: SeedUser, persona: Persona): Promise<string | null> {
  const raw = await callLLM(env, systemFor(persona),
    `Write JSON for one real-looking project you shipped: {"title":"short","summary":"one specific sentence, no marketing","kind":"agent|tool|project|automation|case|oss"}. Output only JSON.`);
  if (!raw) return null;
  let meta: any;
  try { meta = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? ""); } catch { return null; }
  const title = clean(meta.title, 80);
  const summary = clean(meta.summary, 240);
  if (!title || !summary || BANNED.some((w) => title.includes(w) || summary.includes(w))) return null;
  const cover = await generateCoverSvg(env, title);
  let coverUrl: string | null = null;
  if (cover) {
    const mid = crypto.randomUUID();
    const bytes = new Uint8Array(new TextEncoder().encode(cover));
    await stmt(c,
      `INSERT INTO media_blobs (id,owner_id,kind,content_type,size_bytes,data,created_at) VALUES (?1,?2,'project_cover','image/svg+xml',?3,?4,?5)`,
      mid, u.id, bytes.byteLength, bytes, Date.now()).run();
    coverUrl = `/media/${mid}`;
  }
  const k = ["agent", "tool", "project", "automation", "case", "oss"].includes(meta.kind) ? meta.kind : "project";
  const now = Date.now();
  await stmt(c,
    `INSERT INTO projects (id,owner_id,slug,kind,title,summary,description,cover_url,role,stage,visibility,featured,created_at,updated_at)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,'独立交付','已上线','public',0,?9,?9)`,
    crypto.randomUUID(), u.id, `${slugify(title)}-${crypto.randomUUID().slice(0, 4)}`,
    k, title, summary, summary, coverUrl, now).run();
  return title;
}

/** Execute one (weighted) action for a specific account. */
async function performAction(
  env: Env, c: AppLoadContext, u: SeedUser, persona: Persona,
  kind: string, used: { posts: number; comments: number; profile: number },
): Promise<Action> {
  if (kind === "project") {
    const title = await createSimProject(env, c, u, persona);
    return { kind: "project", actor: u.handle, detail: title ? `published work: ${title}` : "skipped: no valid LLM output" };
  }
  if (kind === "comment" && used.comments < CAPS.comments) {
    const target = await one<{ id: string; body: string; author_id: string; comments: number }>(c,
      `SELECT po.id, po.body, po.author_id,
              (SELECT COUNT(*) FROM comments cm WHERE cm.post_id=po.id AND cm.deleted_at IS NULL) AS comments
         FROM posts po JOIN users au ON au.id=po.author_id
        WHERE po.visibility='public' AND po.deleted_at IS NULL AND po.created_at >= ?1 AND po.author_id <> ?2
        ORDER BY comments ASC, po.created_at DESC LIMIT 40`, Date.now() - 7 * 86400000, u.id);
    if (target) {
      const text = await callLLM(env, systemFor(persona), `Reply to this post:\n${clean(target.body, 600)}`);
      if (text && text.length >= 15 && text.length <= 300) {
        await stmt(c, `INSERT INTO comments (id,post_id,author_id,parent_id,body,created_at) VALUES (?1,?2,?3,NULL,?4,?5)`,
          crypto.randomUUID(), target.id, u.id, text, Date.now()).run();
        await stmt(c,
          `INSERT INTO notifications (id,recipient_id,actor_id,type,target_type,target_id,created_at)
           VALUES (?1,?2,?3,'comment','post',?4,?5)`,
          crypto.randomUUID(), target.author_id, u.id, target.id, Date.now()).run();
        used.comments++;
        return { kind: "comment", actor: u.handle, detail: `${text.slice(0, 80)} → ${target.author_id.slice(0, 8)}` };
      }
      return { kind: "comment", actor: u.handle, detail: "skipped: no valid LLM output" };
    }
    return { kind: "comment", actor: u.handle, detail: "no target" };
  }
  if (kind === "post" && used.posts < CAPS.posts) {
    let spark = "";
    if (Math.random() < 0.4) {
      const r = await one<{ title: string; summary: string }>(c, `SELECT title, summary FROM intel_items ORDER BY fetched_at DESC LIMIT 1`);
      if (r) spark = `Loose inspiration (do not copy): ${r.title} — ${r.summary}`;
    }
    const text = await callLLM(env, systemFor(persona), `Write one new short post about your work. ${spark}`);
    if (text && text.length >= 20 && text.length <= 400) {
      const k2 = pick(["build", "thought", "discussion", "show"]) ?? "thought";
      await insertPost(c, { authorId: u.id, kind: k2, body: text, tags: extractTags(text) });
      used.posts++;
      return { kind: "post", actor: u.handle, detail: `${k2}: ${text.slice(0, 80)}` };
    }
    return { kind: "post", actor: u.handle, detail: "skipped: no valid LLM output" };
  }
  if (kind === "social") {
    const post = await one<{ id: string; author_id: string }>(c,
      `SELECT id, author_id FROM posts WHERE visibility='public' AND deleted_at IS NULL AND author_id <> ?1 ORDER BY created_at DESC LIMIT 30`, u.id);
    if (post) {
      const liked = await one<{ n: number }>(c,
        `SELECT COUNT(*) AS n FROM reactions WHERE user_id=?1 AND target_type='post' AND target_id=?2`, u.id, post.id);
      if (!liked?.n) {
        await stmt(c, `INSERT OR IGNORE INTO reactions (user_id,target_type,target_id,type,created_at) VALUES (?1,'post',?2,'like',?3)`, u.id, post.id, Date.now()).run();
        return { kind: "like", actor: u.handle, detail: `post ${post.id.slice(0, 8)}` };
      }
      const f = await one<{ n: number }>(c, `SELECT COUNT(*) AS n FROM follows WHERE follower_id=?1 AND followed_id=?2`, u.id, post.author_id);
      if (!f?.n) {
        await stmt(c, `INSERT OR IGNORE INTO follows (follower_id,followed_id,created_at) VALUES (?1,?2,?3)`, u.id, post.author_id, Date.now()).run();
        return { kind: "follow", actor: u.handle, detail: `FDE ${post.author_id.slice(0, 8)}` };
      }
      return { kind: "social", actor: u.handle, detail: "nothing new to react to" };
    }
    return { kind: "social", actor: u.handle, detail: "no target" };
  }
  if (kind === "ack") {
    const dayKey = utc8DayKey();
    const usedAcks = await one<{ n: number }>(c,
      `SELECT (SELECT COUNT(*) FROM acks WHERE user_id=?1 AND day_key=?2) + (SELECT COUNT(*) FROM comment_acks WHERE user_id=?1 AND day_key=?2) AS n`, u.id, dayKey);
    if ((usedAcks?.n ?? 0) < 2) {
      const target = await one<{ id: string }>(c,
        `SELECT id FROM posts WHERE visibility='public' AND deleted_at IS NULL AND author_id <> ?1 ORDER BY created_at DESC LIMIT 20`, u.id);
      if (target) {
        await stmt(c, `INSERT INTO acks (id,user_id,post_id,day_key,created_at) VALUES (?1,?2,?3,?4,?5)`,
          crypto.randomUUID(), u.id, target.id, dayKey, Date.now()).run();
        return { kind: "ack", actor: u.handle, detail: `post ${target.id.slice(0, 8)}` };
      }
    }
    return { kind: "ack", actor: u.handle, detail: "daily quota full" };
  }
  if (kind === "profile" && used.profile < CAPS.profile) {
    const text = await callLLM(env, systemFor(persona), "Write a new one-line headline for your profile (max 60 chars), same language.");
    if (text && text.length <= 100) {
      await stmt(c, `UPDATE profiles SET headline=?1, updated_at=?2 WHERE user_id=?3`, text, Date.now(), u.id).run();
      used.profile++;
      return { kind: "headline", actor: u.handle, detail: text };
    }
    return { kind: "headline", actor: u.handle, detail: "skipped: no valid LLM output" };
  }
  if (kind === "avatar" && used.profile < CAPS.profile) {
    const n = 1 + Math.floor(Math.random() * 16);
    const path = `/avatars/avatar-${String(n).padStart(2, "0")}.svg`;
    if (u.avatar_url !== path) {
      await stmt(c, `UPDATE profiles SET avatar_url=?1, updated_at=?2 WHERE user_id=?3`, path, Date.now(), u.id).run();
      used.profile++;
      return { kind: "avatar", actor: u.handle, detail: path };
    }
    return { kind: "avatar", actor: u.handle, detail: "already using this avatar" };
  }
  return { kind: "idle", actor: u.handle, detail: "capped" };
}

const ACTION_KINDS = ["comment", "comment", "comment", "post", "social", "social", "ack", "profile", "avatar", "project"];

export async function runSeedSimulation(env: Env, opts?: { force?: boolean }): Promise<{ actions: Action[]; llmMode: string; skipped?: string }> {
  const actions: Action[] = [];
  if (env.SEED_SIM_ENABLED === "0") return { actions, llmMode: "disabled", skipped: "SEED_SIM_ENABLED=0" };
  const llmMode = env.LLM_API_KEY ? "llm" : (env.AI ? "ai" : "none");
  const c = ctx(env);
  try {
    const force = Boolean(opts?.force);
    const users = await seedUsers(c);
    if (!users.length) return { actions, llmMode, skipped: "no seed users" };
    const used = await usage(c);

    // New accounts appear on their own independent random gate.
    if (force || await newUserDue(c, force)) {
      const made = await createSimUser(env, c);
      if (made) {
        users.push(made.user);
        actions.push({ kind: "new_user", actor: made.user.handle, detail: `new simulated FDE @${made.user.handle} (own cycle scheduled)` });
      }
    }

    if (force) {
      // Debug: exercise two accounts deterministically; each still rescheduled.
      const chosen = ["project", "social", "ack", "comment", "avatar"];
      for (let i = 0; i < Math.min(2, users.length); i++) {
        const u = users[i];
        const persona = PERSONAS.find((p) => p.id === u.id) ?? PERSONAS[0];
        actions.push(await performAction(env, c, u, persona, chosen[i % chosen.length], used));
        await scheduleUser(c, u.id);
      }
    } else {
      // Only accounts whose own sim_next_at has passed act this tick.
      const due = users.filter((u) => userDue(u, false));
      for (const u of due) {
        const persona = PERSONAS.find((p) => p.id === u.id) ?? PERSONAS[0];
        actions.push(await performAction(env, c, u, persona, pick(ACTION_KINDS) ?? "social", used));
        await scheduleUser(c, u.id);
      }
      if (!due.length) return { actions, llmMode, skipped: "no account due yet (per-account 5m-4h cadence)" };
    }
  } catch { /* never break the scheduled task */ }
  return { actions, llmMode };
}
