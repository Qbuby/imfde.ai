/**
 * Seed simulation: gives the ten locked seed personas natural, bounded
 * activity so the community feels alive. Only ever writes seed_user_* rows,
 * respects strict daily caps, and never falls back to hardcoded fake text.
 * The only external/AI channel besides the hourly radar; all pages read D1.
 */
import type { AppLoadContext } from "react-router";
import type { Env } from "../../workers/env";
import { many, one, stmt } from "./db.server";
import { insertPost } from "./queries.server";
import { extractTags } from "./tags";
import { utc8DayKey } from "./format";

type SeedUser = { id: string; handle: string; display_name: string; avatar_url: string | null };
type Persona = {
  id: string; handle: string; lang: "zh" | "en" | "ja" | "ko" | "zh-en";
  field: string; tone: string;
};

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
const LLM_TIMEOUT = 30000;
const BANNED = ["赋能", "闭环", "重塑", "一站式", "打造", "革命性", "值得关注"];
type Action = { kind: string; actor: string; detail: string };

function ctx(env: Env): AppLoadContext {
  return { cloudflare: { env, ctx: {} as ExecutionContext } } as AppLoadContext;
}
function pick<T>(arr: T[]): T | null {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
}
function clean(s: unknown, max = 400): string {
  return String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

async function callLLM(env: Env, system: string, user: string): Promise<string | null> {
  let text: string | null = null;
  if (env.LLM_API_KEY) {
    const base = env.LLM_BASE_URL || "https://api.openai.com/v1";
    const model = env.LLM_MODEL || "gpt-4o-mini";
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.LLM_API_KEY}` },
        body: JSON.stringify({ model, temperature: 0.8, max_tokens: 600, messages: [
          { role: "system", content: system }, { role: "user", content: user },
        ] }),
        signal: AbortSignal.timeout(LLM_TIMEOUT),
      });
      if (res.ok) {
        const j: any = await res.json();
        text = j?.choices?.[0]?.message?.content ?? null;
      }
    } catch { /* try AI binding */ }
  }
  if (!text && env.AI) {
    for (const model of ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-3.1-8b-instruct"]) {
      try {
        const out: any = await (env.AI as any).run(model, {
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
          temperature: 0.8, max_tokens: 600,
        });
        text = typeof out?.response === "string" ? out.response : (out?.result ?? null);
        if (text) break;
      } catch { /* next model */ }
    }
  }
  if (!text) return null;
  const t = text.trim().replace(/^["'「]|["'」]$/g, "");
  if (BANNED.some((w) => t.includes(w))) return null; // no hardcoded fallback: skip
  return t;
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
    `SELECT u.id, u.handle, p.display_name, p.avatar_url
       FROM users u JOIN profiles p ON p.user_id = u.id
      WHERE u.id LIKE 'seed_user_%' AND u.status = 'active'`);
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

export async function runSeedSimulation(env: Env, opts?: { force?: boolean }): Promise<{ actions: Action[]; llmMode: string; skipped?: string }> {
  const actions: Action[] = [];
  if (env.SEED_SIM_ENABLED === "0") return { actions, llmMode: "disabled", skipped: "SEED_SIM_ENABLED=0" };
  const c = ctx(env);
  try {
    const force = Boolean(opts?.force);
    if (!force && Math.random() < 0.35) return { actions, llmMode: env.LLM_API_KEY ? "llm" : (env.AI ? "ai" : "none"), skipped: "natural idle" };
    const users = await seedUsers(c);
    if (!users.length) return { actions, llmMode: "none", skipped: "no seed users" };
    const used = await usage(c);
    const n = force ? 5 : (Math.random() < 0.5 ? 1 : 2);
    const kinds = ["comment", "comment", "comment", "post", "social", "social", "ack", "profile", "avatar"];

    for (let step = 0; step < n; step++) {
      const kind = force ? ["social", "ack", "avatar", "comment", "post"][step % 5] : (pick(kinds) ?? "social");
      const u = pick(users)!;
      const persona = PERSONAS.find((p) => p.id === u.id) ?? PERSONAS[0];

      if (kind === "comment" && used.comments < CAPS.comments) {
        const target = await one<{ id: string; body: string; author_id: string; comments: number }>(c,
          `SELECT po.id, po.body, po.author_id,
                  (SELECT COUNT(*) FROM comments cm WHERE cm.post_id=po.id AND cm.deleted_at IS NULL) AS comments
             FROM posts po JOIN users au ON au.id=po.author_id
            WHERE po.visibility='public' AND po.deleted_at IS NULL AND po.created_at >= ?1
              AND po.author_id <> ?2
            ORDER BY comments ASC, po.created_at DESC LIMIT 40`, Date.now() - 7 * 86400000, u.id);
        if (target) {
          const text = await callLLM(env, systemFor(persona), `Reply to this post:\n${clean(target.body, 600)}`);
          if (text && text.length >= 15 && text.length <= 300) {
            await stmt(c,
              `INSERT INTO comments (id, post_id, author_id, parent_id, body, created_at) VALUES (?1,?2,?3,NULL,?4,?5)`,
              crypto.randomUUID(), target.id, u.id, text, Date.now()).run();
            await stmt(c,
              `INSERT INTO notifications (id, recipient_id, actor_id, type, target_type, target_id, created_at)
               VALUES (?1,?2,?3,'comment','post',?4,?5)`,
              crypto.randomUUID(), target.author_id, u.id, target.id, Date.now()).run();
            used.comments++;
            actions.push({ kind: "comment", actor: u.handle, detail: `${text.slice(0, 80)} → @${target.author_id.slice(0, 8)}` });
          } else actions.push({ kind: "comment", actor: u.handle, detail: "skipped: no valid LLM output" });
        }
      } else if (kind === "post" && used.posts < CAPS.posts) {
        let spark = "";
        if (Math.random() < 0.4) {
          const r = await one<{ title: string; summary: string }>(c,
            `SELECT title, summary FROM intel_items ORDER BY fetched_at DESC LIMIT 1`);
          if (r) spark = `Loose inspiration (do not copy): ${r.title} — ${r.summary}`;
        }
        const text = await callLLM(env, systemFor(persona), `Write one new short post about your work. ${spark}`);
        if (text && text.length >= 20 && text.length <= 400) {
          const kind2 = pick(["build", "thought", "discussion", "show"]) ?? "thought";
          await insertPost(c, { authorId: u.id, kind: kind2, body: text, tags: extractTags(text) });
          used.posts++;
          actions.push({ kind: "post", actor: u.handle, detail: `${kind2}: ${text.slice(0, 80)}` });
        } else actions.push({ kind: "post", actor: u.handle, detail: "skipped: no valid LLM output" });
      } else if (kind === "social") {
        const post = await one<{ id: string; author_id: string }>(c,
          `SELECT id, author_id FROM posts WHERE visibility='public' AND deleted_at IS NULL AND author_id <> ?1
            ORDER BY created_at DESC LIMIT 30`, u.id);
        if (post) {
          const liked = await one<{ n: number }>(c,
            `SELECT COUNT(*) AS n FROM reactions WHERE user_id=?1 AND target_type='post' AND target_id=?2`, u.id, post.id);
          if (!liked?.n) {
            await stmt(c, `INSERT OR IGNORE INTO reactions (user_id,target_type,target_id,type,created_at) VALUES (?1,'post',?2,'like',?3)`, u.id, post.id, Date.now()).run();
            actions.push({ kind: "like", actor: u.handle, detail: `post ${post.id.slice(0, 8)}` });
          } else {
            const f = await one<{ followed_id: string }>(c,
              `SELECT followed_id FROM follows WHERE follower_id=?1 AND followed_id=?2`, u.id, post.author_id);
            if (!f) {
              await stmt(c, `INSERT OR IGNORE INTO follows (follower_id,followed_id,created_at) VALUES (?1,?2,?3)`, u.id, post.author_id, Date.now()).run();
              actions.push({ kind: "follow", actor: u.handle, detail: `FDE ${post.author_id.slice(0, 8)}` });
            } else actions.push({ kind: "social", actor: u.handle, detail: "nothing new to react to" });
          }
        }
      } else if (kind === "ack") {
        const dayKey = utc8DayKey();
        const usedAcks = await one<{ n: number }>(c,
          `SELECT (SELECT COUNT(*) FROM acks WHERE user_id=?1 AND day_key=?2)
                 + (SELECT COUNT(*) FROM comment_acks WHERE user_id=?1 AND day_key=?2) AS n`, u.id, dayKey);
        if ((usedAcks?.n ?? 0) < 2) {
          const target = await one<{ id: string; author_id: string }>(c,
            `SELECT id, author_id FROM posts WHERE visibility='public' AND deleted_at IS NULL AND author_id <> ?1
              ORDER BY created_at DESC LIMIT 20`, u.id);
          if (target) {
            await stmt(c, `INSERT INTO acks (id,user_id,post_id,day_key,created_at) VALUES (?1,?2,?3,?4,?5)`,
              crypto.randomUUID(), u.id, target.id, dayKey, Date.now()).run();
            actions.push({ kind: "ack", actor: u.handle, detail: `post ${target.id.slice(0, 8)}` });
          }
        } else actions.push({ kind: "ack", actor: u.handle, detail: "daily quota full" });
      } else if (kind === "profile" && used.profile < CAPS.profile) {
        const text = await callLLM(env, systemFor(persona), "Write a new one-line headline for your profile (max 60 chars), same language.");
        if (text && text.length <= 100) {
          await stmt(c, `UPDATE profiles SET headline=?1, updated_at=?2 WHERE user_id=?3`, text, Date.now(), u.id).run();
          used.profile++;
          actions.push({ kind: "headline", actor: u.handle, detail: text });
        } else actions.push({ kind: "headline", actor: u.handle, detail: "skipped: no valid LLM output" });
      } else if (kind === "avatar" && used.profile < CAPS.profile) {
        const n = 1 + Math.floor(Math.random() * 16);
        const path = `/avatars/avatar-${String(n).padStart(2, "0")}.svg`;
        if (u.avatar_url !== path) {
          await stmt(c, `UPDATE profiles SET avatar_url=?1, updated_at=?2 WHERE user_id=?3`, path, Date.now(), u.id).run();
          used.profile++;
          actions.push({ kind: "avatar", actor: u.handle, detail: path });
        } else actions.push({ kind: "avatar", actor: u.handle, detail: "already using this avatar" });
      }
    }
  } catch { /* never break the scheduled task */ }
  const llmMode = env.LLM_API_KEY ? "llm" : (env.AI ? "ai" : "none");
  return { actions, llmMode };
}
