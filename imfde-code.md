This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching these patterns are excluded: package-lock.json, public/**, LICENSE
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
````
app/
  components/
    app-shell.tsx
    cards.tsx
    media.tsx
    page-head.tsx
    panel.tsx
    post-body.tsx
  lib/
    auth.server.ts
    db.server.ts
    format.ts
    queries.server.ts
    session.server.ts
    tags.ts
    validate.ts
  routes/
    actions-bookmark.tsx
    actions-comment.tsx
    actions-follow.tsx
    actions-like.tsx
    actions-repost.tsx
    discover-projects.tsx
    discover.tsx
    feed.tsx
    home.tsx
    join.tsx
    login.tsx
    logout.tsx
    new-post.tsx
    new-project.tsx
    notifications.tsx
    post-edit.tsx
    post.tsx
    profile-projects.tsx
    profile.tsx
    project-edit.tsx
    project.tsx
    settings-accounts.tsx
    settings-privacy.tsx
    settings-profile.tsx
    shell.tsx
  app.css
  entry.client.tsx
  entry.server.tsx
  root.tsx
  routes.ts
docs/
  PRD.md
migrations/
  0001_init.sql
  0002_feed_and_repost.sql
workers/
  app.ts
  env.d.ts
.dev.vars.example
.gitignore
package.json
react-router.config.ts
README.md
tsconfig.json
vite.config.ts
wrangler.jsonc
````

# Files

## File: app/components/page-head.tsx
````typescript
/**
 * Page header used by every route inside the app shell.
 * Measured from Contra's workspace panel: 10px uppercase label, then a
 * 34px/600 headline with -0.02em tracking, 8px apart.
 */
export function PageHead({
  label,
  title,
  description,
  actions,
}: {
  label?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {label && (
          <p className="font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
            {label}
          </p>
        )}
        <h1 className="mt-1.5 text-[34px] font-semibold leading-tight tracking-[-0.02em]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-[560px] text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Section heading inside a page: 20px/600, optional right action. */
export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[20px] font-semibold tracking-[-0.01em]">{children}</h2>
      {action}
    </div>
  );
}
````

## File: app/components/panel.tsx
````typescript
/**
 * Route-local right column, mirroring Contra's panel structure:
 * the route owns its content; the shell only supplies the white card.
 */
export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

/** Section heading with an optional right-aligned action. */
export function SectionHead({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">
        {title}
      </h2>
      {action}
    </div>
  );
}

/** Uppercase micro-label used above lists, 10px / +1.2px — measured. */
export function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
      {children}
    </p>
  );
}
````

## File: app/components/post-body.tsx
````typescript
import { Link } from "react-router";
import { splitBody, tagHref } from "~/lib/tags";

/**
 * Post text with `#话题` turned into links. Line breaks are preserved, and
 * nothing is passed through as raw HTML.
 */
export function PostBody({
  body,
  className = "",
}: {
  body: string;
  className?: string;
}) {
  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {splitBody(body).map((part, i) =>
        part.type === "tag" ? (
          <Link
            key={i}
            to={tagHref(part.value)}
            className="underline decoration-[var(--color-line)] decoration-1 underline-offset-2 transition hover:decoration-[var(--color-ink)]"
          >
            #{part.value}
          </Link>
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </p>
  );
}

/** Compact tag chip row, used under a post and in the feed's filter bar. */
export function TagLinks({
  tags,
  className = "",
}: {
  tags: string[];
  className?: string;
}) {
  if (!tags.length) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {tags.map((tag) => (
        <Link
          key={tag}
          to={tagHref(tag)}
          className="chip transition hover:!bg-[var(--color-sunken-deep)]"
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
}
````

## File: app/lib/auth.server.ts
````typescript
import type { AppLoadContext } from "react-router";
import { secretKey } from "./db.server";

const COOKIE = "imfde_session";
const SESSION_DAYS = 30;

/* ── encoding helpers ─────────────────────────────────────────── */

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ── password hashing (PBKDF2-SHA256) ─────────────────────────── */

const PBKDF2_ITERATIONS = 100_000;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveBits(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64url(salt)}$${b64url(key)}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1000) return false;
  const salt = fromB64url(parts[2]);
  const expected = fromB64url(parts[3]);
  const actual = new Uint8Array(
    await deriveBits(password, salt, iterations),
  );
  if (actual.length !== expected.length) return false;
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

async function deriveBits(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<ArrayBuffer> {
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    material,
    256,
  );
}

/* ── signed session cookie ────────────────────────────────────── */

async function hmac(context: AppLoadContext, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secretKey(context)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(sig);
}

export async function createSessionCookie(
  context: AppLoadContext,
  userId: string,
): Promise<string> {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${expires}`;
  const sig = await hmac(context, payload);
  const value = `${payload}.${sig}`;
  return serializeCookie(COOKIE, value, expires);
}

export async function readSession(
  context: AppLoadContext,
  request: Request,
): Promise<string | null> {
  const raw = parseCookie(request.headers.get("Cookie") ?? "", COOKIE);
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresStr, sig] = parts;
  if (!userId || !expiresStr || !sig) return null;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || expires < Date.now()) return null;
  const expected = await hmac(context, `${userId}.${expiresStr}`);
  if (!timingSafeEqual(expected, sig)) return null;
  return userId;
}

export function clearSessionCookie(): string {
  return serializeCookie(COOKIE, "", 0);
}

function serializeCookie(name: string, value: string, expiresMs: number): string {
  const expires =
    expiresMs === 0 ? "Thu, 01 Jan 1970 00:00:00 GMT" : new Date(expiresMs).toUTCString();
  return [
    `${name}=${value}`,
    `Path=/`,
    `Expires=${expires}`,
    `Max-Age=${expiresMs === 0 ? 0 : Math.floor((expiresMs - Date.now()) / 1000)}`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Secure`,
  ].join("; ");
}

function parseCookie(header: string, name: string): string | null {
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
````

## File: app/lib/db.server.ts
````typescript
import type { AppLoadContext } from "react-router";

/**
 * D1 access. Every query in the app goes through here so the binding is
 * resolved in exactly one place and loaders stay readable.
 */
export function db(context: AppLoadContext): D1Database {
  return context.cloudflare.env.DB;
}

export function secretKey(context: AppLoadContext): string {
  return context.cloudflare.env.SECRET_KEY ?? "dev-only-insecure-secret-key";
}

export type Row = Record<string, unknown>;

export async function one<T = Row>(
  context: AppLoadContext,
  sql: string,
  ...params: unknown[]
): Promise<T | null> {
  return db(context)
    .prepare(sql)
    .bind(...params)
    .first<T>();
}

export async function many<T = Row>(
  context: AppLoadContext,
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const res = await db(context)
    .prepare(sql)
    .bind(...params)
    .all<T>();
  return res.results ?? [];
}

export async function run(
  context: AppLoadContext,
  sql: string,
  ...params: unknown[]
): Promise<D1Result> {
  return db(context)
    .prepare(sql)
    .bind(...params)
    .run();
}

/** Batch several writes atomically-ish in one round trip. */
export async function batch(
  context: AppLoadContext,
  statements: D1PreparedStatement[],
): Promise<D1Result[]> {
  if (!statements.length) return [];
  return db(context).batch(statements);
}

export function stmt(
  context: AppLoadContext,
  sql: string,
  ...params: unknown[]
): D1PreparedStatement {
  return db(context)
    .prepare(sql)
    .bind(...params);
}
````

## File: app/lib/session.server.ts
````typescript
import type { AppLoadContext } from "react-router";
import { redirect } from "react-router";
import { readSession } from "./auth.server";
import { one } from "./db.server";

export interface Me {
  id: string;
  handle: string;
  kind: "individual" | "team";
  display_name: string;
  avatar_url: string | null;
}

/** Current viewer, or null. Never throws. */
export async function getMe(
  context: AppLoadContext,
  request: Request,
): Promise<Me | null> {
  const userId = await readSession(context, request);
  if (!userId) return null;

  const row = await one<{
    id: string;
    handle: string;
    kind: "individual" | "team";
    display_name: string;
    avatar_url: string | null;
    status: string;
  }>(
    context,
    `SELECT u.id, u.handle, u.kind, u.status, p.display_name, p.avatar_url
       FROM users u JOIN profiles p ON p.user_id = u.id
      WHERE u.id = ?1`,
    userId,
  );

  if (!row || row.status === "banned") return null;
  return {
    id: row.id,
    handle: row.handle,
    kind: row.kind,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
  };
}

/** For routes that require a signed-in user. */
export async function requireMe(
  context: AppLoadContext,
  request: Request,
  redirectTo?: string,
): Promise<Me> {
  const me = await getMe(context, request);
  if (me) return me;
  const url = new URL(request.url);
  const next = redirectTo ?? url.pathname + url.search;
  throw redirect(`/login?next=${encodeURIComponent(next)}`);
}

export function safeNext(value: string | null): string {
  if (!value) return "/";
  // only allow same-origin absolute paths
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

/** Handle lookups: `/@name` maps to users.handle = 'name'. */
export function normalizeHandle(param: string): string | null {
  if (!param.startsWith("@")) return null;
  const handle = param.slice(1).toLowerCase();
  if (!/^[a-z0-9][a-z0-9_]{1,23}$/.test(handle)) return null;
  return handle;
}
````

## File: app/lib/tags.ts
````typescript
/**
 * Tags are typed inline (`#RAG`、`#客户成功`) rather than chosen from a list,
 * so the same parser has to run on the server (when writing post_tags) and in
 * the browser (when turning them into links). Keep it dependency-free.
 */

/** CJK, latin, digits and underscore — a tag cannot contain spaces. */
const TAG_RE = /#([\p{L}\p{N}_]{1,40})/gu;

export function extractTags(text: string, max = 8): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(TAG_RE)) {
    const tag = m[1]!.trim();
    if (!tag) continue;
    // dedupe case-insensitively, keep the first spelling the author used
    if (out.some((t) => t.toLowerCase() === tag.toLowerCase())) continue;
    out.push(tag);
    if (out.length >= max) break;
  }
  return out;
}

export type BodyPart =
  | { type: "text"; value: string }
  | { type: "tag"; value: string };

/** Split a body into literal text and `#tag` runs, preserving line breaks. */
export function splitBody(text: string): BodyPart[] {
  const parts: BodyPart[] = [];
  let last = 0;
  for (const m of text.matchAll(TAG_RE)) {
    const at = m.index ?? 0;
    if (at > last) parts.push({ type: "text", value: text.slice(last, at) });
    parts.push({ type: "tag", value: m[1]! });
    last = at + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

export function tagHref(tag: string): string {
  return `/feed?tag=${encodeURIComponent(tag)}`;
}
````

## File: app/lib/validate.ts
````typescript
/** Validation shared by the auth and editor forms. */

const RESERVED = new Set([
  "discover", "login", "join", "logout", "settings", "projects", "posts",
  "new", "actions", "notifications", "api", "about", "help", "admin", "imfde",
  "feed", "profile", "search", "terms", "privacy",
]);

export function checkEmail(v: string): string | null {
  const s = v.trim();
  if (!s) return "请填写邮箱";
  if (s.length > 254) return "邮箱太长了";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+\.[^@\s]+$/.test(s) && !/^[^@\s]+@[^@\s]+\.\w{2,}$/.test(s))
    return "邮箱格式不对";
  return null;
}

export function checkPassword(v: string): string | null {
  if (!v) return "请填写密码";
  if (v.length < 8) return "密码至少 8 位";
  if (v.length > 200) return "密码太长了";
  return null;
}

export function checkHandle(v: string): string | null {
  const s = v.trim().toLowerCase();
  if (!s) return "请填写 handle";
  if (!/^[a-z0-9][a-z0-9_]{1,23}$/.test(s))
    return "handle 只能用小写字母、数字和下划线，2–24 位，且以字母或数字开头";
  if (RESERVED.has(s)) return "这个 handle 被系统保留了，换一个";
  return null;
}

export function checkDisplayName(v: string): string | null {
  const s = v.trim();
  if (!s) return "请填写显示名称";
  if (s.length > 60) return "名称最多 60 个字符";
  return null;
}

export function cleanUrl(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  if (!/^(https?:)?\/\/[^\s]+$/.test(s) && !/^[\w.-]+\.[a-z]{2,}[/\-._~:?#@!$&'()*+,;=%]*$/i.test(s))
    return "链接格式不对";
  return s.startsWith("http") ? s : `https://${s.replace(/^\/\//, "")}`;
}

export function clamp(v: string, max: number): string {
  return v.trim().slice(0, max);
}
````

## File: app/routes/actions-bookmark.tsx
````typescript
import type { Route } from "./+types/actions-bookmark";
import { requireMe } from "~/lib/session.server";
import { one, run } from "~/lib/db.server";

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const targetType = String(form.get("target_type") ?? "");
  const targetId = String(form.get("target_id") ?? "");
  const intent = String(form.get("intent") ?? "bookmark");

  if (!["post", "project"].includes(targetType) || !targetId) {
    return Response.json({ ok: false }, { status: 400 });
  }

  // only things that actually exist can be saved
  const exists =
    targetType === "post"
      ? await one<{ n: number }>(
          context,
          `SELECT COUNT(*) AS n FROM posts
            WHERE id = ?1 AND deleted_at IS NULL AND visibility = 'public'`,
          targetId,
        )
      : await one<{ n: number }>(
          context,
          `SELECT COUNT(*) AS n FROM projects
            WHERE id = ?1 AND visibility <> 'private'`,
          targetId,
        );

  if (!exists?.n) return Response.json({ ok: false }, { status: 404 });

  if (intent === "unbookmark") {
    await run(
      context,
      `DELETE FROM bookmarks WHERE user_id = ?1 AND target_type = ?2 AND target_id = ?3`,
      me.id,
      targetType,
      targetId,
    );
    return Response.json({ ok: true, bookmarked: false });
  }

  await run(
    context,
    `INSERT OR IGNORE INTO bookmarks (user_id, target_type, target_id, created_at)
     VALUES (?1, ?2, ?3, ?4)`,
    me.id,
    targetType,
    targetId,
    Date.now(),
  );
  return Response.json({ ok: true, bookmarked: true });
}
````

## File: app/routes/actions-comment.tsx
````typescript
import type { Route } from "./+types/actions-comment";
import { redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { one, run } from "~/lib/db.server";

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const postId = String(form.get("post_id") ?? "");
  const body = String(form.get("body") ?? "").trim();
  const intent = String(form.get("intent") ?? "create");

  if (!postId) return Response.json({ ok: false }, { status: 400 });

  if (intent === "delete") {
    const commentId = String(form.get("comment_id") ?? "");
    await run(
      context,
      `UPDATE comments SET deleted_at = ?1
        WHERE id = ?2 AND author_id = ?3`,
      Date.now(),
      commentId,
      me.id,
    );
    return redirect(`/posts/${postId}`);
  }

  if (!body || body.length > 2000) {
    return redirect(`/posts/${postId}?error=comment`);
  }

  const post = await one<{ author_id: string }>(
    context,
    `SELECT author_id FROM posts WHERE id = ?1 AND deleted_at IS NULL`,
    postId,
  );
  if (!post) throw new Response("Not Found", { status: 404 });

  await run(
    context,
    `INSERT INTO comments (id, post_id, author_id, parent_id, body, created_at)
     VALUES (?1, ?2, ?3, NULL, ?4, ?5)`,
    crypto.randomUUID(),
    postId,
    me.id,
    body,
    Date.now(),
  );

  if (post.author_id !== me.id) {
    await run(
      context,
      `INSERT INTO notifications (id, recipient_id, actor_id, type, target_type, target_id, created_at)
       VALUES (?1, ?2, ?3, 'comment', 'post', ?4, ?5)`,
      crypto.randomUUID(),
      post.author_id,
      me.id,
      postId,
      Date.now(),
    );
  }

  return redirect(`/posts/${postId}#comments`);
}
````

## File: app/routes/actions-follow.tsx
````typescript
import type { Route } from "./+types/actions-follow";
import { requireMe } from "~/lib/session.server";
import { run } from "~/lib/db.server";

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const targetId = String(form.get("target_id") ?? "");
  const intent = String(form.get("intent") ?? "follow");

  if (!targetId || targetId === me.id) {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (intent === "unfollow") {
    await run(
      context,
      `DELETE FROM follows WHERE follower_id = ?1 AND followed_id = ?2`,
      me.id,
      targetId,
    );
    return Response.json({ ok: true, following: false });
  }

  await run(
    context,
    `INSERT OR IGNORE INTO follows (follower_id, followed_id, created_at)
     VALUES (?1, ?2, ?3)`,
    me.id,
    targetId,
    Date.now(),
  );

  await run(
    context,
    `INSERT OR IGNORE INTO notifications (id, recipient_id, actor_id, type, target_type, target_id, created_at)
     VALUES (?1, ?2, ?3, 'follow', 'user', ?3, ?4)`,
    crypto.randomUUID(),
    targetId,
    me.id,
    Date.now(),
  );

  return Response.json({ ok: true, following: true });
}
````

## File: app/routes/actions-like.tsx
````typescript
import type { Route } from "./+types/actions-like";
import { requireMe } from "~/lib/session.server";
import { one, run } from "~/lib/db.server";

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const targetType = String(form.get("target_type") ?? "");
  const targetId = String(form.get("target_id") ?? "");
  const intent = String(form.get("intent") ?? "like");

  if (
    !["post", "project"].includes(targetType) ||
    !targetId
  ) {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (intent === "unlike") {
    await run(
      context,
      `DELETE FROM reactions
        WHERE user_id = ?1 AND target_type = ?2 AND target_id = ?3 AND type = 'like'`,
      me.id,
      targetType,
      targetId,
    );
    return Response.json({ ok: true, liked: false });
  }

  await run(
    context,
    `INSERT OR IGNORE INTO reactions (user_id, target_type, target_id, type, created_at)
     VALUES (?1, ?2, ?3, 'like', ?4)`,
    me.id,
    targetType,
    targetId,
    Date.now(),
  );

  // notify the owner, never yourself
  const owner =
    targetType === "post"
      ? await one<{ author_id: string }>(
          context,
          `SELECT author_id FROM posts WHERE id = ?1`,
          targetId,
        )
      : await one<{ author_id: string }>(
          context,
          `SELECT owner_id AS author_id FROM projects WHERE id = ?1`,
          targetId,
        );

  if (owner && owner.author_id !== me.id) {
    await run(
      context,
      `INSERT INTO notifications (id, recipient_id, actor_id, type, target_type, target_id, created_at)
       VALUES (?1, ?2, ?3, 'like', ?4, ?5, ?6)`,
      crypto.randomUUID(),
      owner.author_id,
      me.id,
      targetType,
      targetId,
      Date.now(),
    );
  }

  return Response.json({ ok: true, liked: true });
}
````

## File: app/routes/actions-repost.tsx
````typescript
import type { Route } from "./+types/actions-repost";
import { requireMe } from "~/lib/session.server";
import { one, run } from "~/lib/db.server";
import { insertPost } from "~/lib/queries.server";
import { extractTags } from "~/lib/tags";

const KINDS = ["show", "build", "thought", "discussion"];

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const postId = String(form.get("post_id") ?? "");
  const body = String(form.get("body") ?? "").trim().slice(0, 2000);

  const original = await one<{
    id: string;
    author_id: string;
    kind: string;
    visibility: string;
    deleted_at: number | null;
    author_visibility: string;
  }>(
    context,
    `SELECT po.id, po.author_id, po.kind, po.visibility, po.deleted_at,
            p.visibility AS author_visibility
       FROM posts po
       JOIN profiles p ON p.user_id = po.author_id
      WHERE po.id = ?1`,
    postId,
  );

  // nothing to quote: gone, private, or the author keeps a private profile
  if (
    !original ||
    original.deleted_at !== null ||
    original.visibility === "private" ||
    (original.author_visibility === "private" && original.author_id !== me.id)
  ) {
    return Response.json({ ok: false }, { status: 404 });
  }

  // a bare repost keeps the original's kind so the chip still reads correctly
  const kind = KINDS.includes(original.kind) ? original.kind : "thought";

  const id = await insertPost(context, {
    authorId: me.id,
    kind,
    body,
    repostOfId: original.id,
    tags: extractTags(body),
  });

  // never notify yourself
  if (original.author_id !== me.id) {
    await run(
      context,
      `INSERT INTO notifications
         (id, recipient_id, actor_id, type, target_type, target_id, created_at)
       VALUES (?1, ?2, ?3, 'repost', 'post', ?4, ?5)`,
      crypto.randomUUID(),
      original.author_id,
      me.id,
      original.id,
      Date.now(),
    );
  }

  return Response.json({ ok: true, id });
}
````

## File: app/routes/feed.tsx
````typescript
import type { Route } from "./+types/feed";
import { Form, Link, redirect, useSearchParams } from "react-router";
import { getMe, requireMe } from "~/lib/session.server";
import {
  feedPosts,
  hotTags,
  insertPost,
  projectsForComposer,
} from "~/lib/queries.server";
import { PageHead } from "~/components/page-head";
import { FeedCard } from "~/components/cards";
import { Avatar } from "~/components/media";
import { extractTags } from "~/lib/tags";

const KINDS = [
  { v: "all", t: "全部" },
  { v: "show", t: "Show Work" },
  { v: "build", t: "Build in Public" },
  { v: "thought", t: "Thoughts" },
  { v: "discussion", t: "Discussion" },
];

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await getMe(context, request);
  const url = new URL(request.url);

  const tab = url.searchParams.get("tab") === "following" && me ? "following" : "all";
  const kindParam = url.searchParams.get("kind") ?? "all";
  const kind = KINDS.some((k) => k.v === kindParam) ? kindParam : "all";
  const tag = url.searchParams.get("tag")?.trim() || "";

  const [posts, tags, myProjects] = await Promise.all([
    feedPosts(context, {
      viewerId: me?.id ?? null,
      scope: tab,
      kind,
      tag,
      limit: 30,
    }),
    hotTags(context, 8),
    me ? projectsForComposer(context, me.id) : Promise.resolve([]),
  ]);

  return { me, tab, kind, tag, posts, hotTags: tags, myProjects };
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();

  const kind = String(form.get("kind") ?? "show");
  const body = String(form.get("body") ?? "").trim();
  const projectId = String(form.get("project_id") ?? "");

  if (!body || body.length > 4000) {
    return Response.json({ ok: false }, { status: 400 });
  }

  // only your own, non-private work can be attached
  let attachable: string | null = null;
  if (projectId) {
    const ok = await projectsForComposer(context, me.id, 50);
    attachable = ok.some((p) => p.id === projectId) ? projectId : null;
  }

  await insertPost(context, {
    authorId: me.id,
    kind: ["show", "build", "thought", "discussion"].includes(kind) ? kind : "show",
    body,
    projectId: attachable,
    tags: extractTags(body),
  });

  throw redirect("/feed");
}

export default function Feed({ loaderData }: Route.ComponentProps) {
  const { me, tab, kind, tag, posts, hotTags: tags, myProjects } = loaderData;
  const [params] = useSearchParams();

  const withParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    // changing a filter always drops the other tab's scope
    const s = next.toString();
    return `/feed${s ? `?${s}` : ""}`;
  };

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_248px]">
      <div className="min-w-0">
        <PageHead
          label="Square"
          title="FDE 广场"
          description="正在发生的事、刚跑通的东西、还卡着的问题。按 #话题 归类，任何人都能读。"
        />

        {/* tabs */}
        <div className="mt-5 flex items-center gap-1">
          <TabLink to="/feed" active={tab === "all"}>
            全站最新
          </TabLink>
          {me && (
            <TabLink to="/feed?tab=following" active={tab === "following"}>
              关注
            </TabLink>
          )}
        </div>

        {/* composer */}
        {me ? (
          <Form
            method="post"
            className="mt-5 rounded-[12px] border border-[var(--color-line)] bg-white"
          >
            <div className="flex items-start gap-3 px-4 pt-3.5">
              <Avatar name={me.display_name} src={me.avatar_url} size={34} />
              <textarea
                name="body"
                required
                maxLength={4000}
                rows={2}
                placeholder="分享你现在在做的事。用 #话题 归类，别人才能顺着标签找到你。"
                className="min-h-[52px] w-full resize-y border-0 bg-transparent pt-1 text-[15px] leading-[1.55] outline-none placeholder:text-[var(--color-faint)]"
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-[var(--color-line-soft)] px-4 py-2.5">
              <select
                name="kind"
                aria-label="动态类型"
                className="field !h-[32px] !w-auto !px-2 !text-[12.5px]"
              >
                {KINDS.filter((k) => k.v !== "all").map((k) => (
                  <option key={k.v} value={k.v}>
                    {k.t}
                  </option>
                ))}
              </select>
              <select
                name="project_id"
                aria-label="关联作品"
                className="field !h-[32px] !w-auto !max-w-[190px] !px-2 !text-[12.5px]"
              >
                <option value="">不关联作品</option>
                {myProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <span className="hidden text-[11.5px] text-[var(--color-faint)] sm:inline">
                #标签会自动识别
              </span>
              <button className="btn btn-primary btn-sm !h-[32px] ml-auto">发布</button>
            </div>
          </Form>
        ) : (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-[12px] border border-[var(--color-line-soft)] bg-[var(--color-paper)] px-4 py-3">
            <p className="text-[13.5px] text-[var(--color-ink-soft)]">
              登录后可以发帖、点赞和转发。
            </p>
            <Link to="/login?next=%2Ffeed" className="btn btn-primary btn-sm">
              登录
            </Link>
          </div>
        )}

        {/* filters */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          {KINDS.map((k) => (
            <Link
              key={k.v}
              to={withParam("kind", k.v === "all" ? "" : k.v)}
              preventScrollReset
              className={`chip transition ${
                kind === k.v
                  ? "!bg-[var(--color-ink)] !text-white"
                  : "hover:!bg-[var(--color-sunken-deep)]"
              }`}
            >
              {k.t}
            </Link>
          ))}
          {tag && (
            <span className="ml-1 flex items-center gap-2 text-[12.5px] text-[var(--color-ink-soft)]">
              话题：
              <span className="chip chip-teal">#{tag}</span>
              <Link
                to={withParam("tag", "")}
                preventScrollReset
                className="text-[var(--color-faint)] hover:text-[var(--color-ink)]"
              >
                清除
              </Link>
            </span>
          )}
        </div>

        {/* list */}
        <div className="mt-6 border-t border-[var(--color-line-soft)]">
          {posts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[16px] font-semibold">
                {tag ? `还没有 #${tag} 的动态` : "广场还很安静"}
              </p>
              <p className="mt-1.5 text-[13.5px] text-[var(--color-ink-soft)]">
                {tab === "following"
                  ? "去发现页关注几位正在做事的人，他们的更新会出现在这里。"
                  : "第一条公开动态会出现在这里。"}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <Link to="/discover" className="btn btn-ghost btn-sm">
                  去发现 FDE
                </Link>
                {me && (
                  <Link to="/feed" className="btn btn-primary btn-sm">
                    发第一条
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line-soft)]">
              {posts.map((post) => (
                <FeedCard key={post.id} post={post} signedIn={Boolean(me)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* hot tags rail */}
      <aside className="hidden xl:block">
        <div className="sticky top-6 space-y-6">
          <div>
            <p className="mb-2.5 flex items-center gap-2 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
              热门话题
              <span className="h-px flex-1 bg-[var(--color-line-soft)]" />
            </p>
            {tags.length === 0 ? (
              <p className="text-[12.5px] text-[var(--color-faint)]">
                还没有标签。发帖时写 #话题 就会出现在这里。
              </p>
            ) : (
              <div className="space-y-1">
                {tags.map((t) => (
                  <Link
                    key={t.tag}
                    to={`/feed?tag=${encodeURIComponent(t.tag)}`}
                    className="flex items-baseline gap-2 py-1 text-[14px] transition hover:opacity-70"
                  >
                    <span className="font-medium">#{t.tag}</span>
                    <span className="ml-auto font-mono text-[11px] text-[var(--color-faint)]">
                      {t.n}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {kind !== "all" && (
            <Link
              to="/feed"
              className="text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              清除筛选，看全部 →
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}

function TabLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      preventScrollReset
      className={`rounded-full px-3.5 py-1.5 text-[14px] font-medium transition ${
        active
          ? "bg-[var(--color-ink-2)] text-white"
          : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      }`}
    >
      {children}
    </Link>
  );
}
````

## File: app/routes/logout.tsx
````typescript
import type { Route } from "./+types/logout";
import { redirect } from "react-router";
import { clearSessionCookie } from "~/lib/auth.server";
import { safeNext } from "~/lib/session.server";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData().catch(() => null);
  const next = safeNext(String(form?.get("next") ?? "/"));
  throw redirect(next, { headers: { "Set-Cookie": clearSessionCookie() } });
}

export async function loader() {
  throw redirect("/");
}
````

## File: app/routes/post-edit.tsx
````typescript
import type { Route } from "./+types/post-edit";
import { Form, Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { many, one, run } from "~/lib/db.server";
import { PageHead } from "~/components/page-head";

const KINDS = [
  { v: "show", t: "Show Work", d: "展示一个作品或阶段成果" },
  { v: "build", t: "Build in Public", d: "分享正在构建的过程" },
  { v: "thought", t: "Thoughts", d: "一个专业判断或观察" },
  { v: "discussion", t: "Discussion", d: "抛一个问题出来" },
];

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const me = await requireMe(context, request);
  const post = await one<{
    id: string;
    kind: string;
    body: string;
    project_id: string | null;
    created_at: number;
  }>(
    context,
    `SELECT id, kind, body, project_id, created_at
       FROM posts
      WHERE id = ?1 AND author_id = ?2 AND deleted_at IS NULL`,
    params.id,
    me.id,
  );

  // not yours (or already deleted) is indistinguishable from never existed
  if (!post) throw new Response("Not Found", { status: 404 });

  const projects = await many<{ id: string; title: string }>(
    context,
    `SELECT id, title FROM projects
      WHERE owner_id = ?1 AND visibility <> 'private'
      ORDER BY created_at DESC LIMIT 20`,
    me.id,
  );

  return { me, post, projects };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "save");

  const post = await one<{ id: string }>(
    context,
    `SELECT id FROM posts WHERE id = ?1 AND author_id = ?2 AND deleted_at IS NULL`,
    params.id,
    me.id,
  );
  if (!post) throw new Response("Not Found", { status: 404 });

  if (intent === "delete") {
    // soft delete: comments and likes stay, the row just stops being served
    await run(
      context,
      `UPDATE posts SET deleted_at = ?2, updated_at = ?2 WHERE id = ?1`,
      post.id,
      Date.now(),
    );
    throw redirect(`/@${me.handle}`);
  }

  const kind = String(form.get("kind") ?? "show");
  const body = String(form.get("body") ?? "").trim();
  const projectId = String(form.get("project_id") ?? "");

  if (!body || body.length > 4000) {
    return Response.json({ error: "内容不能为空，且不超过 4000 字" }, { status: 400 });
  }

  await run(
    context,
    `UPDATE posts SET kind = ?2, body = ?3, project_id = ?4, updated_at = ?5
      WHERE id = ?1`,
    post.id,
    KINDS.some((k) => k.v === kind) ? kind : "show",
    body,
    projectId || null,
    Date.now(),
  );

  throw redirect(`/posts/${post.id}`);
}

export default function PostEdit({ loaderData }: Route.ComponentProps) {
  const { post, projects } = loaderData;

  return (
    <div className="max-w-[760px]">
      <PageHead
        label="Edit"
        title="编辑动态"
        description="改完立刻生效。已经有人点过的赞和评论都保留。"
        actions={
          <Link to={`/posts/${post.id}`} className="btn btn-ghost btn-sm">
            看这条
          </Link>
        }
      />

      <Form method="post" className="mt-8 space-y-5">
        <fieldset>
          <legend className="mb-2.5 text-[12.5px] font-medium">类型</legend>
          <div className="grid grid-cols-2 gap-2">
            {KINDS.map((k) => (
              <label
                key={k.v}
                className="cursor-pointer rounded-[10px] border border-[var(--color-line)] p-3 transition has-[:checked]:border-[var(--color-ink-soft)] has-[:checked]:bg-[var(--color-paper)]"
              >
                <input
                  type="radio"
                  name="kind"
                  value={k.v}
                  defaultChecked={post.kind === k.v}
                  className="sr-only"
                />
                <span className="block font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
                  {k.t}
                </span>
                <span className="mt-1 block text-[13px] text-[var(--color-ink-soft)]">
                  {k.d}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium">内容</span>
          <textarea
            name="body"
            required
            maxLength={4000}
            rows={8}
            defaultValue={post.body}
            className="field field-area !min-h-[180px]"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium">
            关联作品
            <span className="ml-2 font-normal text-[var(--color-faint)]">可选</span>
          </span>
          <select name="project_id" defaultValue={post.project_id ?? ""} className="field cursor-pointer">
            <option value="">不关联</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-line-soft)] pt-5">
          <span className="text-[12.5px] text-[var(--color-faint)]">
            删除后不会出现在任何列表里。
          </span>
          <div className="flex items-center gap-2">
            <button
              form="delete-form"
              className="btn btn-ghost btn-sm !text-[#c0392b]"
              type="submit"
            >
              删除动态
            </button>
            <Link to={`/posts/${post.id}`} className="btn btn-ghost btn-sm">
              取消
            </Link>
            <button className="btn btn-primary btn-sm">保存</button>
          </div>
        </div>
      </Form>

      <Form
        id="delete-form"
        method="post"
        className="hidden"
        onSubmit={(e) => {
          if (!confirm("确定删除这条动态？删除后不会出现在任何列表里。")) e.preventDefault();
        }}
      >
        <input type="hidden" name="intent" value="delete" />
      </Form>
    </div>
  );
}
````

## File: app/routes/project-edit.tsx
````typescript
import type { Route } from "./+types/project-edit";
import { data, Form, Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { batch, one, run, stmt } from "~/lib/db.server";
import { cleanUrl, clamp } from "~/lib/validate";
import { PageHead } from "~/components/page-head";

const KINDS = [
  { v: "project", t: "项目" },
  { v: "agent", t: "Agent" },
  { v: "tool", t: "工具" },
  { v: "automation", t: "自动化" },
  { v: "case", t: "案例" },
  { v: "oss", t: "开源" },
];

const VISIBILITY = [
  { v: "public", t: "公开", d: "出现在发现页和首页" },
  { v: "unlisted", t: "不列入", d: "不进列表，但拿到链接的人能看到" },
  { v: "private", t: "仅自己", d: "只有你自己能看到" },
];

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const me = await requireMe(context, request);
  const project = await one<{
    id: string;
    slug: string;
    kind: string;
    title: string;
    summary: string;
    description: string | null;
    cover_url: string | null;
    demo_url: string | null;
    docs_url: string | null;
    repo_url: string | null;
    role: string | null;
    stage: string | null;
    limitations: string | null;
    visibility: string;
  }>(
    context,
    `SELECT id, slug, kind, title, summary, description, cover_url, demo_url,
            docs_url, repo_url, role, stage, limitations, visibility
       FROM projects WHERE slug = ?1 AND owner_id = ?2`,
    params.slug,
    me.id,
  );

  // not yours (or not real) looks identical to never existed
  if (!project) throw new Response("Not Found", { status: 404 });

  const skills = await one<{ names: string }>(
    context,
    `SELECT group_concat(skill_name, ', ') AS names
       FROM (SELECT skill_name FROM project_skills
              WHERE project_id = ?1 ORDER BY position)`,
    project.id,
  );

  return { me, project, skillsText: skills?.names ?? "" };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "save");

  const project = await one<{ id: string; slug: string }>(
    context,
    `SELECT id, slug FROM projects WHERE slug = ?1 AND owner_id = ?2`,
    params.slug,
    me.id,
  );
  if (!project) throw new Response("Not Found", { status: 404 });

  if (intent === "delete") {
    // posts that referenced this work keep their text: FK is ON DELETE SET NULL
    await run(context, `DELETE FROM projects WHERE id = ?1 AND owner_id = ?2`, project.id, me.id);
    throw redirect(`/@${me.handle}`);
  }

  const title = clamp(String(form.get("title") ?? ""), 90);
  const summary = clamp(String(form.get("summary") ?? ""), 220);
  const description = clamp(String(form.get("description") ?? ""), 8000);
  const kind = String(form.get("kind") ?? "project");
  const stage = clamp(String(form.get("stage") ?? ""), 40);
  const role = clamp(String(form.get("role") ?? ""), 2000);
  const limitations = clamp(String(form.get("limitations") ?? ""), 2000);
  const cover = cleanUrl(String(form.get("cover_url") ?? ""));
  const demo = cleanUrl(String(form.get("demo_url") ?? ""));
  const docs = cleanUrl(String(form.get("docs_url") ?? ""));
  const repo = cleanUrl(String(form.get("repo_url") ?? ""));
  const visibility = String(form.get("visibility") ?? "public");
  const skills = String(form.get("skills") ?? "")
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

  const errors: Record<string, string> = {};
  if (!title) errors.title = "请填写标题";
  if (!summary) errors.summary = "请填写一句话简介";
  if (Object.keys(errors).length) return data({ errors }, { status: 400 });

  await batch(context, [
    stmt(
      context,
      `UPDATE projects
          SET kind = ?3, title = ?4, summary = ?5, description = ?6,
              cover_url = ?7, demo_url = ?8, docs_url = ?9, repo_url = ?10,
              role = ?11, stage = ?12, limitations = ?13, visibility = ?14,
              updated_at = ?15
        WHERE id = ?1 AND owner_id = ?2`,
      project.id,
      me.id,
      KINDS.some((k) => k.v === kind) ? kind : "project",
      title,
      summary,
      description || null,
      cover,
      demo,
      docs,
      repo,
      role || null,
      stage || null,
      limitations || null,
      VISIBILITY.some((v) => v.v === visibility) ? visibility : "public",
      Date.now(),
    ),
    stmt(context, `DELETE FROM project_skills WHERE project_id = ?1`, project.id),
    ...skills.map((s, i) =>
      stmt(
        context,
        `INSERT OR IGNORE INTO project_skills (project_id, skill_name, position)
         VALUES (?1, ?2, ?3)`,
        project.id,
        s,
        i,
      ),
    ),
  ]);

  throw redirect(`/projects/${project.slug}`);
}

export default function ProjectEdit({ loaderData, actionData }: Route.ComponentProps) {
  const { project, skillsText } = loaderData;
  const errors = actionData?.errors ?? {};

  return (
    <div className="max-w-[900px]">
      <PageHead
        label="Edit"
        title="编辑作品"
        description="改完立刻生效。链接不会变，分享出去的地方仍然有效。"
        actions={
          <Link to={`/projects/${project.slug}`} className="btn btn-ghost btn-sm">
            看作品页
          </Link>
        }
      />

      <Form method="post" className="mt-8 space-y-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
          <label className="block">
            <span className="mb-1.5 flex gap-2 text-[12.5px] font-medium">
              标题
              {errors.title && <span className="text-[#c0392b]">{errors.title}</span>}
            </span>
            <input
              name="title"
              required
              maxLength={90}
              defaultValue={project.title}
              className="field"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">类型</span>
            <select name="kind" defaultValue={project.kind} className="field cursor-pointer">
              {KINDS.map((k) => (
                <option key={k.v} value={k.v}>
                  {k.t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 flex gap-2 text-[12.5px] font-medium">
            一句话简介
            {errors.summary && <span className="text-[#c0392b]">{errors.summary}</span>}
          </span>
          <input
            name="summary"
            required
            maxLength={220}
            defaultValue={project.summary}
            className="field"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium">详细说明</span>
          <textarea
            name="description"
            rows={8}
            maxLength={8000}
            defaultValue={project.description ?? ""}
            className="field field-area !min-h-[180px]"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">
              我负责的部分
              <span className="ml-2 font-normal text-[var(--color-faint)]">会标注为自述</span>
            </span>
            <textarea
              name="role"
              rows={3}
              maxLength={2000}
              defaultValue={project.role ?? ""}
              className="field field-area !min-h-[88px]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">限制与前提</span>
            <textarea
              name="limitations"
              rows={3}
              maxLength={2000}
              defaultValue={project.limitations ?? ""}
              className="field field-area !min-h-[88px]"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">阶段</span>
            <input name="stage" maxLength={40} defaultValue={project.stage ?? ""} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">
              技能标签
              <span className="ml-2 font-normal text-[var(--color-faint)]">逗号分隔</span>
            </span>
            <input name="skills" defaultValue={skillsText} className="field" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">封面图 URL</span>
            <input
              name="cover_url"
              defaultValue={project.cover_url ?? ""}
              placeholder="留空则自动生成"
              className="field"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">在线 Demo</span>
            <input name="demo_url" defaultValue={project.demo_url ?? ""} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">文档</span>
            <input name="docs_url" defaultValue={project.docs_url ?? ""} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">代码仓库</span>
            <input name="repo_url" defaultValue={project.repo_url ?? ""} className="field" />
          </label>
        </div>

        <fieldset className="border-t border-[var(--color-line-soft)] pt-5">
          <legend className="mb-2.5 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
            谁能看到
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {VISIBILITY.map((v) => (
              <label
                key={v.v}
                className="cursor-pointer rounded-[10px] border border-[var(--color-line)] p-3 transition has-[:checked]:border-[var(--color-ink-soft)] has-[:checked]:bg-[var(--color-paper)]"
              >
                <input
                  type="radio"
                  name="visibility"
                  value={v.v}
                  defaultChecked={project.visibility === v.v}
                  className="sr-only"
                />
                <span className="block text-[13px] font-medium">{v.t}</span>
                <span className="mt-0.5 block text-[12px] text-[var(--color-ink-soft)]">{v.d}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-line-soft)] pt-5">
          <span className="text-[12.5px] text-[var(--color-faint)]">
            删除后无法恢复，引用它的动态会保留文字。
          </span>
          <div className="flex items-center gap-2">
            <button
              form="delete-form"
              className="btn btn-ghost btn-sm !text-[#c0392b]"
              type="submit"
            >
              删除作品
            </button>
            <Link to={`/projects/${project.slug}`} className="btn btn-ghost btn-sm">
              取消
            </Link>
            <button className="btn btn-primary btn-sm">保存</button>
          </div>
        </div>
      </Form>

      <Form
        id="delete-form"
        method="post"
        className="hidden"
        onSubmit={(e) => {
          if (!confirm("确定删除这个作品？删除后无法恢复。")) e.preventDefault();
        }}
      >
        <input type="hidden" name="intent" value="delete" />
      </Form>
    </div>
  );
}
````

## File: app/entry.client.tsx
````typescript
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
````

## File: app/entry.server.tsx
````typescript
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { renderToReadableStream } from "react-dom/server";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  let status = responseStatusCode;
  let shellRendered = false;

  const stream = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        status = 500;
        if (shellRendered) console.error(error);
      },
    },
  );

  shellRendered = true;
  await stream.allReady;

  const headers = new Headers(responseHeaders);
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return new Response(stream, { headers, status });
}
````

## File: docs/PRD.md
````markdown
# iMFDE 产品需求文档（PRD）

**版本：** v0.1  
**状态：** 产品方向确认 / MVP 需求基线  
**日期：** 2026-11-19  
**产品阶段：** 第一阶段——开放展示与专业社交网络

> **一句话定义：** iMFDE 是一个面向 FDE 的个人展示、作品集与专业社交网络。FDE 在这里展示自己是谁、做过什么、能提供什么、正在思考什么；访问者通过主页、作品、内容、外部账号和社区互动，自主形成判断。

---

## 0. 文档说明

本 PRD 将此前确认的产品方向转化为 MVP 可执行需求。它是产品、设计、前后端开发和运营的共同基线。文档中的“必须”代表 MVP 必须实现；“建议”代表在不显著增加复杂度时实现；“暂缓”代表明确不属于本阶段。

### 核心决策记录

| 决策 | 当前结论 |
|---|---|
| 产品核心 | FDE 展示与专业社交网络，不是交易市场或认证机构 |
| 交易模式 | 平台不走账，不提供订单支付、托管、佣金或收入验证 |
| 信任方式 | 展示可观察的信息，由访问者自行判断；平台不提供统一信用分 |
| 社交信号 | 粉丝、关注、帖子、作品、点赞、评论、转发等原始数据可见 |
| 外部资产 | 支持 GitHub、LinkedIn 等外部资料连接或链接 |
| 准入策略 | 开放注册；不要求先完成企业认证或能力认证 |
| 商业化 | MVP 暂不做付费推广；未来商业推广与自然展示必须隔离 |
| 产品策略 | 先野蛮生长，优先积累 FDE、主页、作品和真实互动 |

## 1. 产品概述

### 1.1 产品定位

iMFDE 面向独立 FDE、FDE 团队和 AI Agent/自动化服务提供者，提供一个可持续维护的公开主页与专业内容网络。它让 FDE 将分散在 GitHub、LinkedIn、个人网站、项目 Demo 和社交媒体上的信息汇集到一个可发现的主页，同时通过 Feed、关注和互动形成专业关系网络。

### 1.2 目标用户

| 用户 | 主要诉求 | 在平台上的行为 |
|---|---|---|
| 独立 FDE | 展示能力、作品和专业身份，扩大影响力 | 建主页、上传作品、发帖、连接外部账号、积累关注 |
| FDE 团队 / Studio | 展示团队成员、服务方向和代表项目 | 建团队型资料页、展示项目、发布动态 |
| 企业 / 潜在客户 | 发现 FDE，了解其能力和风格，自主联系 | 搜索、浏览主页、查看作品和内容、访问外部链接 |
| 同行 / 社区用户 | 关注专业人士、交流观点、发现作品 | 关注、点赞、评论、转发、收藏 |
| 平台运营 / 管理员 | 维护基本社区秩序 | 处理举报、垃圾信息和账号违规 |

### 1.3 产品目标

1. **让 FDE 快速拥有完整主页。** 能够在短时间内完成个人介绍、专业领域、作品、服务能力和外部账号配置。
2. **让能力通过作品表达。** 主页以项目、Agent、Demo 和内容为中心，而不是一份静态简历。
3. **让专业动态持续发生。** 通过帖子、关注和互动形成持续更新的专业关系网络。
4. **让访问者自主判断。** 展示来源清晰、可观察的信息，不替访问者生成一个权威信用结论。
5. **降低平台初期复杂度。** 不建设重型认证、交易、担保、信用评分或复杂反作弊体系。

### 1.4 非目标（MVP 明确不做）

- 不提供平台内交易、支付、合同、订单、资金托管、交易佣金或平台收入统计。
- 不提供客户验收、已成交项目、收入、复购等“已验证商业履历”标签。
- 不建立 FDE 综合信用分、平台认证等级、权威能力排名或专家评级。
- 不要求企业注册认证、开放内部系统或为 FDE 提供评价。
- 不开发 PoW、区块链、TEE、零知识证明或能力验证协议。
- 不将粉丝、点赞、评论、关注数合成为专业能力评分。
- 不提供付费买排名、付费认证或付费影响自然声誉。
- MVP 不提供站内私信；通过公开联系方式或外部链接联系。
- 不做复杂的企业招聘、人才撮合、合同管理或项目管理功能。

## 2. 产品原则

### 2.1 先展示，再判断

平台提供信息和工具，不替用户判断一个 FDE 是否优秀、可信或适合某个项目。用户根据主页、作品、内容、外部资料和互动记录自行形成判断。

### 2.2 自述与来源必须区分

个人填写的信息属于“FDE 自述”；外部账号链接属于“外部资料”；OAuth 连接表示账号授权关联，不代表其所有履历、作品或贡献均已被平台验证；平台内发生的关注、发帖、互动属于平台可观察行为。不得将这些不同类型的信息混写成“平台认证”。

### 2.3 不把人气等同于能力

粉丝数、帖子数、点赞数、评论数和转发数可以展示，但不生成统一信用分，也不作为“官方专业等级”。内容排序可以使用时间、相关性和互动热度，但必须明确其只是内容发现，不是能力认证。

### 2.4 开放生长，基础治理

允许用户低门槛入驻和表达；只配置必要的垃圾信息控制、举报、封禁、隐私和内容治理。不要因为预想所有作弊路径而提前建设复杂风控。

### 2.5 商业化与自然声誉隔离

MVP 不做商业推广。未来如推出赞助位、专题曝光或推广产品，必须显式标记商业内容，且不得影响自然关注、互动数据或自然发现规则。

## 3. 产品信息架构

### 3.1 全局导航

| 一级入口 | 页面 / 功能 | 说明 |
|---|---|---|
| Feed | Following / Latest | 关注动态和全站最新内容 |
| Discover | FDE / Projects / Topics | 发现 FDE、作品和专业领域 |
| Create | Post / Project | 发布动态或作品 |
| Notifications | Activity | 新关注、点赞、评论、转发、提及 |
| Profile | My Profile / Settings | 个人主页与设置 |

桌面端采用顶部导航或左侧导航均可；移动端提供紧凑导航。MVP 优先保证响应式 Web 体验，不强制建设独立 App。

### 3.2 公开页面路由建议

| 路由 | 页面 |
|---|---|
| `/` | Feed / 首页 |
| `/discover` | FDE 发现 |
| `/discover/projects` | 作品发现 |
| `/@{handle}` | FDE 主页 |
| `/@{handle}/projects` | 用户全部作品 |
| `/projects/{slug}` | 作品详情 |
| `/posts/{id}` | 帖子详情 |
| `/settings/profile` | 主页编辑 |
| `/settings/accounts` | 外部账号管理 |
| `/settings/privacy` | 隐私设置 |

具体 URL 可按现有技术栈调整，但用户主页应有稳定、可分享、可被搜索引擎索引的独立地址。

## 4. 核心功能需求

优先级定义：P0 = MVP 必须；P1 = MVP 后尽快补齐；P2 = 后续阶段。

### 4.1 账号与入驻

| ID | 优先级 | 需求 | 验收标准 |
|---|---|---|---|
| ACC-01 | P0 | 邮箱注册 / 登录 | 用户可完成注册、登录、退出和密码重置；邮箱验证用于账号安全，不作为职业身份认证 |
| ACC-02 | P0 | 唯一用户名 Handle | 注册时创建唯一 handle；支持修改规则、保留旧链接跳转或明确提示 |
| ACC-03 | P0 | 用户类型 | 支持 Individual FDE、Team / Studio 两类资料形态；MVP 可共用账号体系 |
| ACC-04 | P0 | 主页公开状态 | 用户可选择公开或非公开；默认公开需在注册 / 创建主页时明确告知 |
| ACC-05 | P1 | 第三方登录 | 可增加 GitHub 登录等方式；登录与资料连接分开处理 |

### 4.2 FDE 个人主页（核心）

主页是产品最重要的页面，设计上应更接近独立职业者的个人网站 / Portfolio，而不是传统招聘网站简历。

| 模块 | 字段 / 内容 | 要求 |
|---|---|---|
| 基础身份 | 头像、封面、姓名、Handle、个人类型 | P0；支持上传或使用授权头像 |
| 简介 | 一句话定位、About、所在地 / 时区 | P0；支持中英文内容 |
| 专业方向 | 领域标签、技能标签、工具栈 | P0；支持搜索和筛选 |
| 社交统计 | Followers、Following、Posts、Projects | P0；展示原始计数，不计算信用分 |
| 精选内容 | 精选作品、置顶帖子 | P0；用户自主选择 |
| 作品集 / Agent 展示 | 项目、Agent、工具、自动化工作流、案例卡片与详情 | P0 |
| 服务 / 能力 | 可提供的服务、适用场景、交付方式 | P1；仅展示，不形成下单或交易 |
| 外部链接 | GitHub、LinkedIn、个人网站、X 等 | P0；支持手动添加链接 |
| 联系方式 | 邮箱、预约链接、个人网站等 | P1；由用户主动公开，默认不暴露注册邮箱 |
| 动态 | 用户历史帖子 | P0 |

**主页展示规则：**

- 不显示“iMFDE 信用分”“平台认证 FDE”“官方等级”等概念。
- 不默认显示一个综合排名。
- 允许 FDE 自述背景与经验，但页面需有明确的信息归属，不暗示平台核实。
- 可提供“举报主页 / 屏蔽用户”入口。
- 主页模块允许用户调整排序或隐藏不适用模块。

### 4.3 作品集 Projects

| ID | 优先级 | 需求 | 验收标准 |
|---|---|---|---|
| PRJ-01 | P0 | 创建 / 编辑 / 删除作品 | 用户可管理作品；删除后公开页面不可访问，按数据保留策略处理备份 |
| PRJ-02 | P0 | 作品基本信息 | 名称、封面、摘要、详细介绍、领域、技术标签 |
| PRJ-03 | P0 | 作品媒体 | 支持图片；视频可使用外部链接嵌入，上传视频可列 P1 |
| PRJ-04 | P0 | 作品外链 | 支持 Demo、GitHub、产品网站、文章链接 |
| PRJ-05 | P0 | 角色与贡献描述 | FDE 可说明自己负责的部分；标记为作者自述，不表示平台审计 |
| PRJ-06 | P1 | 精选作品 | 用户可选择主页展示的精选作品 |
| PRJ-07 | P1 | 草稿 / 私有链接 | 支持先保存草稿，再公开；可选不公开但持链接可访问 |

每个作品详情页应让访问者快速理解：做了什么、解决什么问题、使用什么技术、FDE 负责什么、在哪里可以进一步查看或体验。

**作品类型：**至少支持 Project、Agent、Tool、Automation、Case Study、Open Source。Agent 类型应支持补充：Agent 名称与用途、适用场景、输入 / 输出示例、使用的工具或模型（可选）、部署形态、Demo / API 文档链接、使用限制。FDE 可以只展示视频、截图或外部 Demo，不需要把 Agent 托管到 iMFDE，也不需要公开源码、Prompt、模型权重、工作流或客户数据。iMFDE 不对外部 Demo 的安全性或服务可用性作担保。

### 4.4 Capabilities / Services 能力展示

该模块用于说明 FDE 可以提供什么，不是交易商品系统。

字段建议：服务名称、描述、适用场景、能力范围、技术栈、交付形式、部署方式（如 API / SaaS / 私有部署）、服务限制、联系入口、可选参考价格。

要求：
- P1 实现，MVP 时间紧张时可先用主页自定义区块替代。
- 不出现“下单”“立即购买”“支付”“订单状态”等交易流程。
- 参考价格只是展示信息，不产生平台报价单或合同。
- 服务信息由 FDE 自行维护，访问者需自行判断其适用性。

### 4.5 Feed 与内容发布

帖子类型：

| 类型 | 说明 | 示例 |
|---|---|---|
| Show Work | 展示作品或阶段成果 | 新 Agent、新产品、新 Demo |
| Build in Public | 分享构建过程 | 技术路线、开发进展、实验过程 |
| Thoughts | 专业观点 | 行业观察、方法论、技术判断 |
| Discussion | 发起讨论 | 提问、征求意见、开放话题 |

| ID | 优先级 | 需求 | 验收标准 |
|---|---|---|---|
| FEED-01 | P0 | 发布帖子 | 支持文本、图片、外链；支持草稿或删除 |
| FEED-02 | P0 | 帖子详情 | 独立链接，可分享和评论 |
| FEED-03 | P0 | 图片展示 | 支持多图上传、排序、删除 |
| FEED-04 | P0 | 外部链接预览 | 获取标题、摘要和封面；抓取失败时可手动编辑 |
| FEED-05 | P0 | Like | 用户可点赞 / 取消点赞；同一用户对同一帖子仅一条有效记录 |
| FEED-06 | P0 | Comment | 支持评论、删除自己的评论、举报评论 |
| FEED-07 | P1 | Repost | 可转发并附带简短评论；原帖删除时显示不可用状态 |
| FEED-08 | P1 | Bookmark | 用户私有收藏，其他用户不可见 |
| FEED-09 | P1 | Mention / Hashtag | 支持提及用户和主题标签 |
| FEED-10 | P1 | 置顶帖子 | 用户可在主页置顶有限数量帖子 |

Feed 类型：
- **Following：** 按关注关系展示所关注 FDE 的内容，按时间倒序为主。
- **Latest：** 全站公开内容按发布时间倒序。
- **Popular（P1）：** 可按近期互动热度辅助发现，但不得被解释为专业能力或可信度排名；需抑制明显重复和异常刷屏。

MVP 不使用复杂的个性化推荐算法。优先确保 Following 与 Latest 稳定、可理解、可预测。

### 4.6 社交关系与互动

| 功能 | 优先级 | 规则 |
|---|---|---|
| Follow / Unfollow | P0 | 一对用户之间只有一条有效关注关系；用户可查看粉丝和关注列表 |
| Like | P0 | 同一用户对同一内容只能有一条有效点赞 |
| Comment | P0 | 支持基本评论与删除；不做复杂楼中楼，MVP 可先支持一级回复 |
| Repost | P1 | 记录原帖与转发用户关系 |
| Bookmark | P1 | 私有收藏，不对外公开 |
| Notifications | P0 | 新关注、点赞、评论、转发、提及产生站内通知 |
| Direct Message | 暂缓 | MVP 不提供站内私信，降低骚扰和审核成本；使用用户公开的外部联系方式 |

### 4.7 Discover 发现与搜索

**发现对象：** FDE 个人 / 团队、作品、帖子和专业主题。

**搜索字段：** 名称、Handle、简介关键词、专业领域、技能标签、技术栈、所在地 / 时区。

**筛选条件：** Individual / Team、领域、技术标签、最近活跃、最近加入。

**排序方式：** 相关度、最近加入、最近活跃；作品和帖子可按最新或近期热度展示。

要求：
- P0 提供 FDE 搜索、分类浏览、主页访问。
- P0 提供作品发现的基础列表。
- P1 提供主题聚合页和热门内容页。
- 不建设全站“最可信 FDE”或“能力排行榜”。
- 搜索结果可以展示粉丝数、作品数等客观信息，但不得生成平台等级徽章。

### 4.8 外部账号连接

| 平台 | MVP 方式 | 可以展示什么 | 必须避免的误导 |
|---|---|---|---|
| GitHub | 支持 OAuth 连接；同时支持手动链接 | 用户名、头像、公开仓库、用户选择展示的项目（取决于授权范围） | 账号连接不代表每个仓库均由该用户独立完成 |
| LinkedIn | MVP 优先支持个人资料链接；OAuth / API 能力按平台实际授权逐步接入 | LinkedIn 公开资料链接；若获批 API 权限，再展示允许读取的数据 | 普通登录不等于完整职业履历验证；不得抓取未授权数据 |
| Hugging Face | 手动链接优先，后续评估 API | 模型、数据集、Spaces 等公开作品链接 | 不将公开页面等同于平台认证 |
| Personal Website / X / Blog | 手动添加链接 | 用户公开的外部资料 | 明确标记为外部链接 |

统一来源标签：
- **Self-reported：** FDE 自己填写。
- **External link：** 跳转到外部资料页。
- **Connected account：** 用户已授权连接该账号。
- **Platform activity：** iMFDE 内部可观察到的发帖、关注与互动。

MVP 不使用“Verified Professional”“已验证工作经历”等容易让用户误解的标签。

## 5. 主页可信度呈现原则

### 5.1 展示事实，不生成结论

主页可以展示粉丝数、关注数、帖子数、作品数、获赞数、评论数、转发数、加入时间、外部账号链接和平台内活动记录。所有数据保持独立，不合成一个总分。

### 5.2 不设置官方等级

不设置 Bronze / Silver / Gold、专家认证、可信度 95 分等体系。未来如引入编辑精选或活动奖项，必须说明评选范围、标准和时间，不得与付费推广混淆。

### 5.3 数据口径透明

每个计数明确对应对象和统计范围。例如：Followers 是当前关注该用户的有效账号数；Posts 是公开且未删除的帖子数；Projects 是公开作品数。删除、封禁和隐私变更后，计数应按统一口径更新。

### 5.4 互动不等于专业认可

点赞、关注、评论只是社区行为。产品文案、运营活动和页面设计不得将其表述为客户满意度、能力认证、成交证明或履约记录。

## 6. 基础社区治理与隐私

### 6.1 MVP 必需治理能力

- 举报用户、帖子、评论和作品。
- 管理员查看举报队列，支持忽略、删除内容、限制账号、封禁账号。
- 基础垃圾信息控制：发布频率限制、重复内容限制、链接滥用限制、必要的人机验证。
- 账号安全：邮箱验证、密码重置、登录会话管理。
- 隐私：用户可隐藏关注列表或设置主页非公开；联系邮箱默认不公开。
- 内容版权：用户声明拥有或有权发布上传内容；提供侵权投诉入口。

### 6.2 不建设的反作弊系统

MVP 不尝试识别所有社交关系造假，不建设复杂设备指纹、企业关联图谱或全站信用反作弊系统。只处理影响社区正常使用的明显垃圾、批量灌水、冒充、骚扰和违法违规内容。

### 6.3 账号与内容处置原则

处罚应有明确原因和基本申诉入口。不要仅因粉丝增长快、点赞多或账号之间存在关联就自动判定造假。自动化规则用于限速和队列筛查，严重处置应保留人工复核。

## 7. 数据模型（概念层）

| 实体 | 关键字段 | 说明 |
|---|---|---|
| User | id, email, handle, status, created_at | 登录账号与状态 |
| Profile | user_id, display_name, avatar, cover, bio, location, timezone, visibility | 公开主页资料 |
| SkillTag | id, name, category | 专业领域和技能标签 |
| ProfileSkill | user_id, skill_id | 主页技能关联 |
| ExternalAccount | user_id, provider, provider_user_id, profile_url, connection_status, scopes | 外部账号连接或链接 |
| Project | id, owner_id, project_type, title, summary, description, cover, links, demo_url, docs_url, access_mode, limitations, visibility, created_at | 作品 / Agent / 工具 / 自动化案例 |
| Capability | id, owner_id, title, description, domain, delivery_type, deployment, contact_url | 服务与能力展示 |
| Post | id, author_id, type, body, visibility, created_at, updated_at | 专业动态 |
| Media | id, owner_id, url, media_type, metadata | 图片和媒体资源 |
| Follow | follower_id, followed_id, created_at | 关注关系 |
| Reaction | user_id, target_type, target_id, type, created_at | 点赞等互动 |
| Comment | id, post_id, author_id, body, parent_id, created_at | 评论 |
| Repost | user_id, post_id, created_at | 转发 |
| Bookmark | user_id, target_type, target_id, created_at | 私有收藏 |
| Notification | id, recipient_id, actor_id, type, target_id, read_at | 站内通知 |
| Report | id, reporter_id, target_type, target_id, reason, status, handled_by | 举报与处理 |

关键约束：
- Handle 唯一；外部账号连接需处理一个 provider identity 与一个 iMFDE 用户的关联冲突。
- Follow 唯一约束 `(follower_id, followed_id)`，禁止自己关注自己。
- Reaction 唯一约束 `(user_id, target_type, target_id, type)`。
- Bookmark 仅对本人可见。
- 删除用户后，按隐私政策决定删除或匿名化关联内容；必须避免公开页面残留私密信息。

## 8. 核心用户流程

### 8.1 FDE 入驻并建立主页

1. 访问 iMFDE，注册并验证邮箱。
2. 选择 Individual FDE 或 Team / Studio。
3. 创建 Handle，填写头像、简介、专业方向和所在地 / 时区。
4. 添加 GitHub、LinkedIn、个人网站等外部资料。
5. 创建至少一个作品（允许跳过，后续补齐）。
6. 选择是否发布第一条动态。
7. 发布主页，获得可分享的公开 URL。

### 8.2 访问者发现并关注 FDE

1. 访问 Discover 或通过搜索引擎进入公开主页。
2. 浏览简介、技能、外部资料、作品和动态。
3. 查看粉丝、帖子、作品等公开计数。
4. 注册 / 登录后可关注、点赞、评论和收藏。
5. 通过 FDE 主动公开的外部链接联系。

### 8.3 FDE 发布动态

1. 点击 Create Post。
2. 选择 Show Work / Build in Public / Thoughts / Discussion。
3. 输入内容，添加图片或外部链接。
4. 预览后发布。
5. 内容进入个人主页和相应 Feed。
6. 用户可编辑、删除或查看互动数据。

## 9. 后台管理与运营

MVP 管理后台只需覆盖基础管理：

- 用户列表、状态和基本资料查询。
- 帖子、作品、评论内容查询。
- 举报队列、处理记录和操作人。
- 账号限流、禁言、封禁、解封。
- 主题标签与专业领域管理。
- 首页推荐位如需人工运营，必须明确为编辑推荐，不伪装成自然排名；MVP 可先不做推荐位。

管理员操作需要记录操作者、时间、目标、原因和处理结果。

## 10. 数据分析与产品指标

### 10.1 北极星指标建议

**每周活跃且有内容的 FDE 主页数（Weekly Active Showcasing FDEs）**：一周内至少完成一次有效内容或作品更新、且主页公开的 FDE 数量。

该指标用于衡量平台是否真正形成展示与内容供给，不用于对单个 FDE 排名。

### 10.2 MVP 指标

| 指标 | 定义 | 用途 |
|---|---|---|
| 注册 FDE 数 | 完成账号注册的 FDE 用户数 | 供给规模 |
| 主页完成率 | 填写核心资料并公开主页的用户 / 注册 FDE | 入驻体验 |
| 作品发布率 | 至少发布一个公开作品的 FDE / 注册 FDE | 作品供给 |
| 外部账号连接率 | 至少连接一个外部账号的用户 / 注册 FDE | 资料丰富度 |
| 周活跃 FDE | 一周内有发帖或作品更新的 FDE | 内容活跃 |
| Follow 转化率 | 主页访问后产生关注的比例 | 主页吸引力 |
| Feed 互动率 | 曝光后产生点赞、评论或转发的比例 | 内容参与 |
| Discover 点击率 | 搜索结果中进入 FDE 主页或作品的比例 | 发现效率 |
| 举报率 | 被举报内容或账号数 / 对应内容或账号量 | 社区健康 |

禁止将上述指标汇总成 FDE 信用分。商业收入、平台内订单和已完成交易数量不属于 MVP 指标。

## 11. 非功能需求

- **响应式：** 桌面端优先，同时适配移动浏览器；个人主页和作品详情必须在手机端可用。
- **性能：** Feed 分页加载；图片缩略图与懒加载；公开主页首屏应优先加载头像、简介和精选作品。
- **可发现性：** 公开主页、作品和帖子提供稳定 URL、基础 SEO 元信息、Open Graph 分享卡片。
- **安全：** 密码安全存储；OAuth Token 加密存储；遵循最小授权；支持撤销外部账号授权。
- **隐私：** 不公开用户注册邮箱和非公开资料；用户可以删除或隐藏作品与帖子。
- **可扩展：** 用户、主页、内容、互动、外部账号分离建模；未来商业推广作为独立模块，不污染自然内容数据。
- **国际化准备：** 数据结构支持中英文文本；MVP UI 可先以中文为主，保留英文内容展示能力。

## 12. MVP 范围与迭代计划

| 迭代 | 范围 | 交付结果 |
|---|---|---|
| Sprint 0 | 信息架构、设计系统、账号与资料模型 | 可用的设计稿与数据结构 |
| Sprint 1 | 注册登录、Handle、个人主页、资料编辑 | FDE 可以创建并分享主页 |
| Sprint 2 | 作品集、外部链接、GitHub 连接（权限允许范围内） | FDE 可以展示项目和外部资产 |
| Sprint 3 | Feed、发帖、点赞、评论、关注 | 形成基础内容和关系网络 |
| Sprint 4 | Discover、搜索、通知、基础后台治理 | 访客可以发现 FDE，运营可以维护秩序 |
| Beta | 可用性修复、SEO、移动端体验、隐私与安全检查 | 面向首批 FDE 开放 |

LinkedIn API 接入、团队组织页深度能力、视频原生上传、转发、书签、热门内容、推荐算法均可根据开发资源排入 P1，不阻塞第一版核心闭环。

## 13. MVP 验收标准

### FDE 侧

- 用户能够注册、登录、创建唯一 Handle。
- 用户能够创建、编辑和公开 / 隐藏个人主页。
- 用户能够添加头像、简介、专业领域、技能标签和外部链接。
- 用户能够创建至少一个作品，展示介绍、图片和外部链接。
- 用户能够发布帖子并在个人主页查看。
- 用户能够查看自己的粉丝、关注、帖子和作品数量。
- 用户能够连接或添加 GitHub、LinkedIn 等外部资料；页面清楚区分连接与普通链接。

### 访问者侧

- 未登录用户可以浏览公开 FDE 主页、作品和公开帖子。
- 用户可以搜索 FDE，并按领域或技能过滤。
- 登录用户可以关注、点赞和评论。
- 用户可以分享 FDE 主页、作品和帖子链接。

### 平台侧

- 管理员可以处理举报、删除违规内容、限制或封禁账号。
- 关注、点赞和评论计数准确，不能因重复操作重复累计。
- 用户隐私设置生效，私密内容不能通过直接 URL 访问。
- 页面没有信用分、认证等级、已验证订单或交易收入等不在 MVP 范围内的功能。
- 平台不收取或处理 FDE 与企业之间的服务款项。

## 14. 风险与应对

| 风险 | 说明 | MVP 应对 |
|---|---|---|
| 早期内容不足 | 用户注册但不持续发布 | 降低发帖门槛；提供作品模板和 Show Work 引导 |
| 主页质量参差 | 用户资料不完整 | 提供可跳过的主页完善提示，不强制认证 |
| 社交数据刷量 | 用户互刷关注和点赞 | 原始数据展示；基础限流与举报；不做总信用分 |
| 外部 API 权限受限 | LinkedIn 等平台的数据访问限制 | 先支持手动链接；只使用官方授权 API，不抓取未授权数据 |
| 企业误解平台背书 | 用户可能把资料页误认为平台认证 | 明确标注自述、外部链接、账号连接和平台内行为的区别 |
| 垃圾信息与骚扰 | 开放社区可能出现灌水和广告 | 举报、限速、基础审核；MVP 不开放站内私信 |
| 商业化污染公信力 | 未来付费推广影响自然发现 | 商业推广延后；预留独立数据域和清晰广告标识 |

## 15. 后续阶段（不纳入 MVP 承诺）

以下功能只作为方向储备，不应提前进入当前开发范围：

- 独立的商业推广系统：赞助位、专题曝光、推广活动；必须与自然发现隔离并显式标记。
- 团队 / Studio 多成员主页及角色管理。
- 主题社区、活动、线上路演。
- 更丰富的外部身份与作品平台集成。
- 编辑精选作品或内容；需说明标准和时间，不等于信用认证。
- 开放 API，让第三方展示或引用 FDE 的公开主页信息。

任何后续增加的功能都不得偷偷引入平台担保、交易验证或综合信用评分，除非另行完成产品决策。

## 16. 产品一句话与首页文案方向

**产品一句话：** The professional network where FDEs showcase what they build.

**中文表达：** FDE 展示自己、分享作品、连接同行，让世界发现你的能力。

首页首屏建议突出三件事：
1. 创建属于你的 FDE 主页。
2. 展示你的 Agent、项目和作品。
3. 通过专业内容和社区关系被更多人发现。

不要使用“认证最强 FDE”“权威信用排名”“已验证专家”等宣传语。

---

**文档结论：** iMFDE 第一阶段只建设开放的 FDE 展示与专业社交网络。平台提供个人主页、作品集、服务能力展示、外部账号链接、动态内容、关注互动和发现搜索；不经手交易，不验证平台外收入，不给 FDE 统一信用分，也不承担对用户自述内容的全面担保责任。先让真实的人、作品和内容自然聚集，再依据实际增长情况决定下一阶段产品。
````

## File: migrations/0001_init.sql
````sql
-- iMFDE MVP schema
-- 原则：所有 "自述 / 外部链接 / 已连接账号 / 平台行为" 在数据层就是不同字段，
-- 不允许在展示层模糊成 "已认证"。

PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  handle        TEXT NOT NULL UNIQUE,
  kind          TEXT NOT NULL DEFAULT 'individual'
                CHECK (kind IN ('individual','team')),
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','limited','banned')),
  created_at    INTEGER NOT NULL
);

CREATE TABLE profiles (
  user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url   TEXT,
  cover_url    TEXT,
  headline     TEXT,
  about        TEXT,
  location     TEXT,
  timezone     TEXT,
  visibility   TEXT NOT NULL DEFAULT 'public'
               CHECK (visibility IN ('public','private')),
  hide_follows INTEGER NOT NULL DEFAULT 0,
  updated_at   INTEGER NOT NULL
);

CREATE TABLE profile_skills (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, skill_name)
);

CREATE TABLE external_accounts (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL
                   CHECK (provider IN ('github','linkedin','huggingface','website','x','blog')),
  provider_user_id TEXT,
  profile_url      TEXT NOT NULL,
  connection       TEXT NOT NULL DEFAULT 'link'
                   CHECK (connection IN ('link','connected')),
  position         INTEGER NOT NULL DEFAULT 0,
  created_at       INTEGER NOT NULL,
  UNIQUE (user_id, provider, profile_url)
);

CREATE TABLE projects (
  id          TEXT PRIMARY KEY,
  owner_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'project'
              CHECK (kind IN ('project','agent','tool','automation','case','oss')),
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL,
  description TEXT,
  cover_url   TEXT,
  demo_url    TEXT,
  docs_url    TEXT,
  repo_url    TEXT,
  role        TEXT,
  stage       TEXT,
  access_mode TEXT,
  limitations TEXT,
  visibility  TEXT NOT NULL DEFAULT 'public'
              CHECK (visibility IN ('public','unlisted','private')),
  featured    INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  UNIQUE (owner_id, slug)
);

CREATE TABLE project_skills (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, skill_name)
);

CREATE TABLE posts (
  id         TEXT PRIMARY KEY,
  author_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL
             CHECK (kind IN ('show','build','thought','discussion')),
  body       TEXT NOT NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'public'
             CHECK (visibility IN ('public','private')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE post_media (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  position   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE follows (
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);

CREATE TABLE reactions (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post','project')),
  target_id   TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'like' CHECK (type IN ('like')),
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, target_type, target_id, type)
);

CREATE TABLE comments (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id  TEXT,
  body       TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE bookmarks (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post','project')),
  target_id   TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, target_type, target_id)
);

CREATE TABLE notifications (
  id           TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  type         TEXT NOT NULL
               CHECK (type IN ('follow','like','comment','repost','mention')),
  target_type  TEXT,
  target_id    TEXT,
  read_at      INTEGER,
  created_at   INTEGER NOT NULL
);

CREATE TABLE reports (
  id          TEXT PRIMARY KEY,
  reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user','post','project','comment')),
  target_id   TEXT NOT NULL,
  reason      TEXT NOT NULL,
  detail      TEXT,
  status      TEXT NOT NULL DEFAULT 'open'
              CHECK (status IN ('open','ignored','removed','limited')),
  handled_by  TEXT,
  handled_at  INTEGER,
  created_at  INTEGER NOT NULL
);

-- feed / discovery indexes
CREATE UNIQUE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_owner       ON projects(owner_id, visibility);
CREATE INDEX idx_projects_recent      ON projects(visibility, created_at DESC);
CREATE INDEX idx_posts_recent         ON posts(visibility, deleted_at, created_at DESC);
CREATE INDEX idx_posts_author         ON posts(author_id, deleted_at, created_at DESC);
CREATE INDEX idx_follows_followed     ON follows(followed_id);
CREATE INDEX idx_comments_post        ON comments(post_id, created_at);
CREATE INDEX idx_reactions_target     ON reactions(target_type, target_id);
CREATE INDEX idx_notifications_owner  ON notifications(recipient_id, created_at DESC);
CREATE INDEX idx_ext_accounts_owner   ON external_accounts(user_id, position);
CREATE INDEX idx_profile_skills_owner ON profile_skills(user_id, position);
````

## File: migrations/0002_feed_and_repost.sql
````sql
-- 0002: 广场（信息流）所需的最小增量
-- 原则：不引入外部服务，不新增可解释性之外的字段。转发与话题都只是
-- posts 的附加关系，删掉任何一边都不影响原文存在。

-- 引用转发 / 纯转发：指向被转发的原帖。原帖被删时转发的壳仍保留文字。
ALTER TABLE posts ADD COLUMN repost_of_id TEXT REFERENCES posts(id) ON DELETE SET NULL;

CREATE INDEX idx_posts_repost_of_id ON posts(repost_of_id);

-- #话题：一对多铺平，便于按标签筛选与统计热门标签。
CREATE TABLE post_tags (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag     TEXT NOT NULL,
  PRIMARY KEY (post_id, tag)
);

CREATE INDEX idx_post_tags_tag ON post_tags(tag);
````

## File: workers/app.ts
````typescript
import { createRequestHandler } from "react-router";
import type { Env } from "./env";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

// The React Router server build is a plain, platform-agnostic module
// (routes + assets + entry). Wrapping it is all a Worker needs to do.
// @ts-expect-error -- generated at build time, no types published
import * as serverBuild from "../build/server/index.js";

const requestHandler = createRequestHandler(
  () => serverBuild,
  "production",
);

export default {
  async fetch(request, env, ctx) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
````

## File: workers/env.d.ts
````typescript
/** Cloudflare bindings, mirroring wrangler.jsonc. */
export interface Env {
  DB: D1Database;
  /** HMAC key for the session cookie. `wrangler secret put SECRET_KEY`. */
  SECRET_KEY?: string;
}
````

## File: .dev.vars.example
````
SECRET_KEY=dev-only-please-replace
````

## File: package.json
````json
{
  "name": "imfde",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "react-router dev",
    "build": "react-router build",
    "start": "react-router-serve ./build/server/index.js",
    "typecheck": "react-router typegen && tsc",
    "deploy": "npm run build && wrangler deploy",
    "db:migrate:local": "wrangler d1 migrations apply imfde --local",
    "db:migrate:remote": "wrangler d1 migrations apply imfde --remote"
  },
  "dependencies": {
    "@fontsource-variable/instrument-sans": "^5.2.5",
    "@fontsource-variable/inter": "^5.2.5",
    "isbot": "^5.1.17",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router": "^7.9.1"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^5.20261118.1",
    "@react-router/dev": "^7.9.1",
    "@tailwindcss/vite": "^4.1.13",
    "@types/react": "^19.1.13",
    "@types/react-dom": "^19.1.9",
    "tailwindcss": "^4.1.13",
    "typescript": "^5.9.2",
    "vite": "^7.1.7",
    "wrangler": "^4.42.0"
  }
}
````

## File: react-router.config.ts
````typescript
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
} satisfies Config;
````

## File: vite.config.ts
````typescript
import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./app", import.meta.url)),
    },
  },
});
````

## File: wrangler.jsonc
````json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "imfde",
  "main": "./workers/app.ts",
  "compatibility_date": "2025-09-01",
  "compatibility_flags": ["nodejs_compat"],
  "workers_dev": true,
  "observability": { "enabled": true },
  "assets": {
    "directory": "./build/client",
    "not_found_handling": "none"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "imfde",
      "database_id": "99b2f49c-366f-499a-a742-a3e2cc9248bd",
      "migrations_dir": "migrations"
    }
  ],
  // www.imfde.ai is served by a zone Workers route + proxied CNAME, so it is
  // intentionally not listed here; binding it as a custom domain would clash
  // with that existing record.
  "routes": [{ "pattern": "imfde.ai", "custom_domain": true }]
}
````

## File: app/components/media.tsx
````typescript
import { useMemo } from "react";
import { avatarTint, coverPalette, coverPhoto, initials } from "~/lib/format";

export function Avatar({
  name,
  src,
  size = 40,
  ring = false,
}: {
  name: string;
  src?: string | null;
  size?: number;
  ring?: boolean;
}) {
  const tint = useMemo(() => avatarTint(name), [name]);
  const fontSize = Math.max(11, Math.round(size * 0.36));

  return (
    <span
      className="avatar relative inline-flex items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        boxShadow: ring ? "0 0 0 1px #fff, 0 0 0 3px #fcfcfc" : undefined,
        background: src ? undefined : tint,
      }}
      aria-hidden={src ? undefined : true}
    >
      {src ? (
        <img src={src} alt="" width={size} height={size} loading="lazy" />
      ) : (
        <span
          className="font-display font-semibold select-none"
          style={{ fontSize, color: "#14171f", opacity: 0.68 }}
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
}

/**
 * Cover art for work that has no image of its own. Ten openly licensed
 * photographs stand in, desaturated and tinted with a per-slug palette so a
 * project without a screenshot still looks like part of the set — and keeps
 * looking the same across visits.
 *
 * No title is baked in: the title is always set in type next to the card.
 */
export function CoverArt({
  seed,
  src,
  aspect = "16 / 9",
  className = "",
  photo = true,
}: {
  seed: string;
  src?: string | null;
  aspect?: string;
  className?: string;
  /** Work gets photography; a person's banner stays an abstract field, so a
      profile never reads as somebody's holiday snap. */
  photo?: boolean;
}) {
  const p = useMemo(() => coverPalette(seed), [seed]);

  if (src) {
    return (
      <div
        className={`overflow-hidden bg-[var(--color-sunken)] ${className}`}
        style={{ aspectRatio: aspect }}
      >
        <img
          src={src}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (!photo) {
    return (
      <div
        className={`cover-art ${className}`}
        style={
          {
            aspectRatio: aspect,
            "--ta": p.ta,
            "--tb": p.tb,
            "--mark": p.mark,
          } as React.CSSProperties
        }
        aria-hidden="true"
      >
        <span className="cover-arc" />
        <span className="cover-rule" />
      </div>
    );
  }

  return (
    <div
      className={`cover-photo ${className}`}
      style={
        {
          aspectRatio: aspect,
          "--ta": p.ta,
          "--tb": p.tb,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <img src={coverPhoto(seed)} alt="" loading="lazy" decoding="async" />
    </div>
  );
}
````

## File: app/lib/format.ts
````typescript
/** Small formatting helpers shared by server and client renders. */

export function relativeTime(ms: number, now = Date.now()): string {
  const diff = Math.max(0, now - ms);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;

  if (diff < min) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / min)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))} 个月前`;
  return `${Math.floor(diff / (365 * day))} 年前`;
}

export function absoluteDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

export function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${Math.round(n / 1000)}k`;
}

export function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // CJK: take the first character. Latin: first letters of up to two words.
  if (/[\u4e00-\u9fa5]/.test(trimmed)) return trimmed.slice(0, 1);
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

/** Deterministic 0..1 from a string, so gradients are stable per seed. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // murmur3 finaliser. Plain FNV leaves the high bits poorly mixed, so short
  // seeds that differ by one character (agent-1, agent-2 …) all landed in
  // the same bucket and every card got the same cover.
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Saturated accents for avatars — small areas can take real colour. */
const ACCENTS = [
  "#cbabff",
  "#f3ca4d",
  "#ff989a",
  "#a8d8de",
  "#e4e8f7",
  "#d6e3b4",
  "#f0c9a8",
];

/**
 * Cover duotone in two lightness steps plus one accent mark. Large flat
 * areas need low saturation or adjacent hues turn into mud.
 */
const COVERS: Array<[string, string, string]> = [
  ["#eef1f9", "#dde5f5", "#6a57e3"],
  ["#e9f4f4", "#d6ebee", "#0e8696"],
  ["#fdf3e3", "#f8e7c9", "#b07c1c"],
  ["#fdeeee", "#f9dedf", "#b04a4d"],
  ["#efeafa", "#e3daf7", "#6a57e3"],
  ["#eef3ea", "#dfe9d7", "#4e6b3c"],
  ["#f5eef0", "#ecdfe4", "#8a5568"],
];

export function coverPalette(seed: string): {
  ta: string;
  tb: string;
  mark: string;
} {
  const c = COVERS[Math.floor(hash(seed) * COVERS.length)]!;
  return { ta: c[0], tb: c[1], mark: c[2] };
}

/**
 * Placeholder photography for work that has no cover of its own. Ten openly
 * licensed Unsplash shots (via picsum.photos), chosen for texture and
 * structure rather than subject, so a grid of them reads as a considered
 * series instead of stock filler. The palette above still tints each one, so
 * they stay in the same family as the generated covers.
 */
const COVER_PHOTOS = [
  "/covers/01.webp",
  "/covers/02.webp",
  "/covers/03.webp",
  "/covers/04.webp",
  "/covers/05.webp",
  "/covers/06.webp",
  "/covers/07.webp",
  "/covers/08.webp",
  "/covers/09.webp",
  "/covers/10.webp",
];

export function coverPhoto(seed: string): string {
  return COVER_PHOTOS[Math.floor(hash(seed) * COVER_PHOTOS.length)]!;
}

export function avatarTint(seed: string): string {
  return ACCENTS[Math.floor(hash(seed + "·avatar") * ACCENTS.length)]!;
}

export const SKILL_GROUPS = [
  "Agent 与自动化",
  "模型与推理",
  "数据与管道",
  "前端与体验",
  "后端与服务",
  "云与部署",
  "行业领域",
] as const;

/**
 * URL slugs stay ASCII on purpose. A CJK title would otherwise become a
 * percent-encoded path that breaks when shared, indexed or pasted into chat,
 * so it falls back to a generic stem plus a short suffix.
 */
export function slugify(input: string): string {
  const ascii = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  if (ascii.length >= 2) return ascii;
  return `work-${Math.random().toString(36).slice(2, 8)}`;
}
````

## File: app/routes/join.tsx
````typescript
import type { Route } from "./+types/join";
import { data, Form, Link, redirect } from "react-router";
import { hashPassword, createSessionCookie } from "~/lib/auth.server";
import { one, stmt, batch } from "~/lib/db.server";
import { checkDisplayName, checkEmail, checkHandle, checkPassword } from "~/lib/validate";
import { getMe } from "~/lib/session.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await getMe(context, request);
  if (me) throw redirect(`/@${me.handle}`);
  return {};
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const handle = String(form.get("handle") ?? "").trim().toLowerCase();
  const displayName = String(form.get("display_name") ?? "").trim();
  const kind = form.get("kind") === "team" ? "team" : "individual";

  const errors: Record<string, string> = {};
  const e = checkEmail(email);
  if (e) errors.email = e;
  const p = checkPassword(password);
  if (p) errors.password = p;
  const h = checkHandle(handle);
  if (h) errors.handle = h;
  const d = checkDisplayName(displayName);
  if (d) errors.display_name = d;

  if (Object.keys(errors).length === 0) {
    const dupe = await one<{ n: number }>(
      context,
      `SELECT COUNT(*) AS n FROM users WHERE email = ?1 OR handle = ?2`,
      email,
      handle,
    );
    if ((dupe?.n ?? 0) > 0) {
      const emailTaken = await one<{ n: number }>(
        context,
        `SELECT COUNT(*) AS n FROM users WHERE email = ?1`,
        email,
      );
      if ((emailTaken?.n ?? 0) > 0) errors.email = "这个邮箱已经注册过了";
      else errors.handle = "这个 handle 已经有人用了";
    }
  }

  if (Object.keys(errors).length > 0) {
    return data({ errors, values: { email, handle, display_name: displayName, kind } }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  const hash = await hashPassword(password);

  await batch(context, [
    stmt(
      context,
      `INSERT INTO users (id, email, password_hash, handle, kind, status, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, 'active', ?6)`,
      id,
      email,
      hash,
      handle,
      kind,
      now,
    ),
    stmt(
      context,
      `INSERT INTO profiles (user_id, display_name, visibility, updated_at)
       VALUES (?1, ?2, 'public', ?3)`,
      id,
      displayName,
      now,
    ),
  ]);

  const cookie = await createSessionCookie(context, id);
  throw redirect(`/settings/profile?welcome=1`, {
    headers: { "Set-Cookie": cookie },
  });
}

export default function Join({ actionData }: Route.ComponentProps) {
  const errors = actionData?.errors ?? {};
  const values = actionData?.values;

  return (
    <AuthShell
      title="建你的主页"
      subtitle="两分钟。不需要认证，不需要审核。"
      side={{
        title: "一个地址，装下你做过的事。",
        points: [
          "imfde.ai/@你的名字 — 可搜索、可分享",
          "作品配得上截图、Demo 和仓库链接",
          "同行会看到，但没人给你打分",
        ],
      }}
    >
      <Form method="post" className="space-y-4">
        <Field label="邮箱" error={errors.email}>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={values?.email}
            placeholder="you@example.com"
            className="field"
          />
        </Field>

        <Field label="密码" error={errors.password} hint="至少 8 位">
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            placeholder="••••••••"
            className="field"
          />
        </Field>

        <Field label="Handle" error={errors.handle} hint="你的地址：imfde.ai/@handle">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[var(--color-faint)]">
              @
            </span>
            <input
              name="handle"
              required
              autoComplete="username"
              defaultValue={values?.handle}
              placeholder="yourname"
              pattern="[a-z0-9][a-z0-9_]{1,23}"
              className="field pl-8"
            />
          </div>
        </Field>

        <Field label="显示名称" error={errors.display_name}>
          <input
            name="display_name"
            required
            autoComplete="name"
            defaultValue={values?.display_name}
            placeholder="你的名字，或工作室名字"
            className="field"
          />
        </Field>

        <fieldset>
          <legend className="mb-2 text-[12.5px] font-medium text-[var(--color-ink)]">
            你以什么身份出现
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "individual", t: "独立 FDE", d: "个人主页" },
              { v: "team", t: "团队 / Studio", d: "团队主页" },
            ].map((o) => (
              <label
                key={o.v}
                className="cursor-pointer rounded-[var(--radius-field)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3 transition has-[:checked]:border-[var(--color-ink-soft)] has-[:checked]:bg-[var(--color-accent-soft)]"
              >
                <input
                  type="radio"
                  name="kind"
                  value={o.v}
                  defaultChecked={(values?.kind ?? "individual") === o.v}
                  className="sr-only"
                />
                <span className="block text-[13px] font-medium">{o.t}</span>
                <span className="mt-0.5 block text-[11.5px] text-[var(--color-muted)]">
                  {o.d}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <button className="btn btn-primary !mt-6 w-full">建主页</button>

        <p className="pt-1 text-center text-[12.5px] text-[var(--color-muted)]">
          已经有账号？
          <Link to="/login" className="ml-1 text-[var(--color-ink-soft)] hover:underline">
            登录
          </Link>
        </p>
      </Form>
    </AuthShell>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-2">
        <span className="text-[12.5px] font-medium text-[var(--color-ink)]">{label}</span>
        {hint && !error && (
          <span className="text-[11.5px] text-[var(--color-faint)]">{hint}</span>
        )}
        {error && <span className="text-[11.5px] text-[#c0392b]">{error}</span>}
      </span>
      {children}
    </label>
  );
}

export function AuthShell({
  title,
  subtitle,
  side,
  children,
}: {
  title: string;
  subtitle: string;
  side: { title: string; points: string[] };
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[var(--color-canvas)]">
      <div className="mx-auto grid min-h-dvh max-w-[1100px] items-center gap-12 px-6 py-12 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div>
          <Link to="/" className="display text-[22px]">
            iMFDE<span className="text-[var(--color-ink-soft)]">.</span>
          </Link>
          <h1 className="display mt-8 text-[clamp(26px,3.2vw,34px)]">{title}</h1>
          <p className="mt-2 text-[13.5px] text-[var(--color-muted)]">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>

        <aside className="hidden lg:block">
          <div
            className="relative overflow-hidden rounded-[24px] border border-[var(--color-line)] px-9 py-12"
            style={{
              backgroundImage:
                "radial-gradient(80% 90% at 10% 0%, #f0e9ff 0%, transparent 60%), radial-gradient(70% 80% at 95% 10%, #e3f2f3 0%, transparent 62%), radial-gradient(90% 90% at 50% 110%, #fdf4d8 0%, transparent 66%)",
              background: "var(--color-surface)",
            }}
          >
            <p className="display text-[clamp(22px,2.4vw,30px)] leading-[1.25]">
              {side.title}
            </p>
            <ul className="mt-7 space-y-3.5">
              {side.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-[13.5px] text-[var(--color-ink-soft)]">
                  <span className="mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--color-ink-2)] text-[10px] text-white">
                    ✓
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-9 font-mono text-[10.5px] tracking-[0.12em] text-[var(--color-faint)] uppercase">
              No credit scores · No escrow · No ranking
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
````

## File: app/routes/login.tsx
````typescript
import type { Route } from "./+types/login";
import { data, Form, Link, redirect } from "react-router";
import { createSessionCookie, verifyPassword } from "~/lib/auth.server";
import { one } from "~/lib/db.server";
import { safeNext, getMe } from "~/lib/session.server";
import { AuthShell } from "./join";

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await getMe(context, request);
  const next = safeNext(new URL(request.url).searchParams.get("next"));
  if (me) throw redirect(next);
  return { next };
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = safeNext(String(form.get("next") ?? "/"));

  if (!email || !password) {
    return data({ error: "请填写邮箱和密码" }, { status: 400 });
  }

  const user = await one<{
    id: string;
    password_hash: string;
    status: string;
    handle: string;
  }>(
    context,
    `SELECT u.id, u.password_hash, u.status, u.handle
       FROM users u WHERE u.email = ?1`,
    email,
  );

  // constant-ish response regardless of which half failed
  const ok = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !ok) {
    return data({ error: "邮箱或密码不对" }, { status: 400 });
  }
  if (user.status === "banned") {
    return data({ error: "这个账号已被封禁" }, { status: 403 });
  }

  const cookie = await createSessionCookie(context, user.id);
  throw redirect(next === "/" ? `/@${user.handle}` : next, {
    headers: { "Set-Cookie": cookie },
  });
}

export default function Login({ loaderData, actionData }: Route.ComponentProps) {
  const next = loaderData?.next ?? "/";
  const error = actionData?.error;

  return (
    <AuthShell
      title="欢迎回来"
      subtitle="登录后可以关注、点赞、评论和发布。"
      side={{
        title: "这里的数字只是数字。",
        points: [
          "关注数和点赞数不会变成信用分",
          "平台不经手任何交易",
          "你写的每一句都标注为本人自述",
        ],
      }}
    >
      <Form method="post" className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium">邮箱</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="field"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium">密码</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="field"
          />
        </label>

        {error && (
          <p className="rounded-[var(--radius-field)] bg-[#fdeceb] px-3.5 py-2.5 text-[12.5px] text-[#c0392b]">
            {error}
          </p>
        )}

        <button className="btn btn-primary !mt-6 w-full">登录</button>

        <p className="pt-1 text-center text-[12.5px] text-[var(--color-muted)]">
          还没有账号？
          <Link to="/join" className="ml-1 text-[var(--color-ink-soft)] hover:underline">
            建一个
          </Link>
        </p>
      </Form>
    </AuthShell>
  );
}
````

## File: app/root.tsx
````typescript
import type { Route } from "./+types/root";
import { Link, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "@fontsource-variable/inter";
import "@fontsource-variable/instrument-sans";
import "./app.css";

export const meta: Route.MetaFunction = ({ location }) => {
  const origin = location.pathname;
  return [
    { title: "iMFDE — FDE 的作品集与专业网络" },
    {
      name: "description",
      content:
        "iMFDE 是 FDE 展示自己、分享作品、连接同行的专业网络。建主页、传作品、发动态，让世界看到你能做什么。",
    },
    { property: "og:site_name", content: "iMFDE" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { tagName: "link", rel: "canonical", href: `https://imfde.ai${origin}` },
    { property: "og:image", content: "https://imfde.ai/og.jpg" },
    { name: "twitter:image", content: "https://imfde.ai/og.jpg" },
  ];
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#fcfcfc" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const is404 = typeof error === "object" && error !== null && "status" in error && (error as { status?: number }).status === 404;
  return (
    <div className="min-h-dvh bg-[var(--color-canvas)]">
      <div className="mx-auto max-w-[640px] px-6 py-24 text-center">
        <p className="font-mono text-[13px] tracking-[0.14em] text-[var(--color-muted)] uppercase">
          {is404 ? "404" : "Error"}
        </p>
        <h1 className="mt-4 text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
          {is404 ? "这个页面不存在" : "出了一点问题"}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
          {is404
            ? "链接可能已经失效，或者这个 FDE 已经改了 handle。"
            : "我们已经记录，稍后再试一次。"}
        </p>
        <Link
          to="/discover"
          className="mt-8 inline-flex h-11 items-center rounded-full bg-[var(--color-ink)] px-6 text-[14px] font-medium text-white transition hover:opacity-85"
        >
          去发现 FDE
        </Link>
      </div>
    </div>
  );
}
````

## File: .gitignore
````
.qa/
.react-router/
.wrangler/
node_modules/
build/
dist/
.dev.vars
.env
*.log
.DS_Store
Thumbs.db
````

## File: README.md
````markdown
# iMFDE

FDE（Forward Deployed Engineer）的展示网络。一个主页、一份作品集、一条能持续更新的动态。

线上：[imfde.ai](https://imfde.ai)

## 这个产品是什么

FDE 做的事通常散在 GitHub、LinkedIn、demo 视频和聊天记录里。iMFDE 把它们收拢到一个可以搜索、可以分享、可以写进简历和邮件签名的地址：`imfde.ai/@你的名字`。

它刻意不是这些东西：

- 不是交易市场：平台不经手合同、不收款、不做托管
- 不是认证机构：不给信用分、不给能力等级、不给排行榜
- 不是招聘网站：主页长得像作品集，不像简历

平台只做一件事：把可观察的信息展示清楚，让访问者自己判断。所以每个页面都会标明信息从哪来——本人自述、外部链接、平台行为，三者分开列。

## 技术栈

- **Cloudflare Workers** 承载全部请求（SSR）
- **D1** 存数据，SQLite 语法
- **React Router v7** framework mode，服务端渲染 + 类型化路由
- **Tailwind CSS v4**，设计 token 写在 `app/app.css`
- 字体自托管（Inter + Instrument Sans），不依赖外部 CDN

## 本地跑起来

```bash
npm install
npx wrangler d1 migrations apply imfde --local   # 建本地库
printf 'SECRET_KEY=%s
' "$(openssl rand -hex 32)" > .dev.vars
npm run dev                                      # 改代码即时生效
```

想看和线上一致的构建产物：

```bash
npm run build
npx wrangler dev --port 8866 --local
```

## 部署

```bash
npx wrangler d1 create imfde                 # 首次：把 id 填进 wrangler.jsonc
npx wrangler d1 migrations apply imfde --remote
npx wrangler secret put SECRET_KEY           # 会话 cookie 的 HMAC 密钥
npm run deploy
```

`www.imfde.ai` 由 zone 里的 Workers route 加一条代理 CNAME 提供，不写进 `routes`，否则会和已有记录冲突。

## 目录

```
app/
  routes/           每个页面对应一个路由模块
    shell.tsx       导航与页脚，所有登录态页面都挂在它下面
    home.tsx        落地页（未登录）/ 动态流（已登录）
    profile.tsx     /@handle 主页
    project.tsx     /projects/{slug} 作品详情
    post.tsx        /posts/{id} 动态详情与评论
    discover*.tsx   发现 FDE 与发现作品
    settings-*.tsx  主页、外部账号、隐私
    actions-*.tsx   点赞 / 关注 / 评论（resource route）
  lib/
    db.server.ts    D1 绑定与查询 helpers
    auth.server.ts  PBKDF2 密码、HMAC 会话 cookie
    queries.server.ts 列表与搜索
    format.ts       时间、计数、封面配色
  components/       卡片、头像、封面
workers/app.ts      Worker 入口，把请求交给 React Router
migrations/         D1 schema
docs/PRD.md         产品需求文档 v0.1
```

## 四条不能破的规矩

1. **不合成评分。** 关注数、点赞数、作品数分别显示，不汇总成一个总分，也不做等级。
2. **注明信息来源。** 自述、外部链接、平台行为在数据层就是不同字段，展示时不许混成「已认证」。
3. **不经手交易。** 没有订单、支付、托管、佣金，也不展示成交与收入。
4. **先展示，再判断。** 页面给事实，不给结论。

## 许可

MIT。
````

## File: tsconfig.json
````json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": [
      "DOM",
      "DOM.Iterable",
      "ES2022"
    ],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "types": [
      "@cloudflare/workers-types",
      "vite/client"
    ],
    "baseUrl": ".",
    "paths": {
      "~/*": [
        "./app/*"
      ]
    },
    "rootDirs": [
      ".",
      "./.react-router/types"
    ],
    "noEmit": true
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".react-router/types/**/*",
    "workers/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "build"
  ]
}
````

## File: app/components/app-shell.tsx
````typescript
import { Link, NavLink, Outlet, Form } from "react-router";
import { Avatar } from "./media";
import type { Me } from "~/lib/session.server";

/**
 * Signed-in shell, rebuilt from a live measurement of Contra's workspace view
 * at 1536×730:
 *
 *   body          bg #fbfcfd
 *   rail          288px wide content in a 336px column, items 40px tall,
 *                 8px radius, 15px/400 labels, 24px gaps between groups
 *   primary CTA   full-rail 288×40, #222834, radius 24
 *   panel         1209×722 at x=312, white, radius 20, 8px top padding
 *   group labels  10px, letter-spacing 1.2px, #4a5264, uppercase
 */

export const RAIL_ITEMS = [
  { key: "home", label: "首页", to: "/", end: true },
  { key: "square", label: "广场", to: "/feed", end: true },
  { key: "discover", label: "发现 FDE", to: "/discover", end: true },
  { key: "work", label: "作品", to: "/discover/projects", end: true },
  { key: "messages", label: "消息", to: "/notifications", end: false },
] as const;

export const RAIL_GROUPS = [
  {
    label: "发现",
    items: [
      { key: "people", label: "FDE", to: "/discover", end: true },
      { key: "topics", label: "方向", to: "/discover/projects", end: false },
    ],
  },
] as const;

export function AppShell({ me, setupDone }: { me: Me; setupDone: number }) {
  return (
    <div className="min-h-dvh bg-[#fbfcfd]">
      {/* ── mobile top bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 md:hidden">
        <Link to="/" className="display text-[22px] tracking-[-0.02em]">
          iMFDE
        </Link>
        <Link to="/new/post" className="btn btn-primary btn-sm ml-auto">
          写点什么
        </Link>
        <Link to={`/@${me.handle}`}>
          <Avatar name={me.display_name} src={me.avatar_url} size={34} />
        </Link>
      </div>

      <div className="flex">
        {/* ── rail: 288px content inside a 336px gutter ─────────────── */}
        <aside className="sticky top-0 hidden h-dvh w-[336px] shrink-0 flex-col px-3 pb-3 pt-4 md:flex">
          <div className="flex h-8 items-center gap-2 px-3">
            <Link to="/" className="display text-[24px] tracking-[-0.02em]">
              iMFDE
            </Link>
            <span className="ml-auto flex items-center gap-1">
              <Link
                to="/notifications"
                className="grid h-8 w-8 place-items-center rounded-[4px] text-[var(--color-ink-soft)] transition hover:bg-white"
                aria-label="通知"
              >
                <BellIcon />
              </Link>
              <Link
                to={`/@${me.handle}`}
                className="rounded-full border border-[var(--color-line)]"
                aria-label="我的主页"
              >
                <Avatar name={me.display_name} src={me.avatar_url} size={28} />
              </Link>
            </span>
          </div>

          {/* full-width primary action: 288×40, radius 24 */}
          <Link
            to="/new/post"
            className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-[24px] bg-[var(--color-ink-2)] text-[14px] font-semibold text-white transition hover:bg-[#2f3746]"
          >
            <PlusIcon />
            写点什么
          </Link>

          <nav className="mt-4 space-y-1">
            {RAIL_ITEMS.map((item) => (
              <RailLink {...item} />
            ))}
            <Link
              to="/settings/profile"
              className="flex h-10 items-center gap-3 rounded-[8px] px-3 text-[15px] text-[var(--color-ink)] transition hover:bg-white"
            >
              <span className="grid h-[18px] w-[18px] place-items-center text-[var(--color-ink-soft)]">
                <GearIcon />
              </span>
              {setupDone === 4 ? "主页已完整" : "完成设置"}
              <span className="ml-auto font-mono text-[13px] text-[var(--color-faint)]">
                {setupDone}/4
              </span>
            </Link>
          </nav>

          {RAIL_GROUPS.map((group) => (
            <div key={group.label} className="mt-6">
              <p className="mb-1 flex items-center gap-2 px-3 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
                {group.label}
                <span className="h-px flex-1 bg-[var(--color-line)]" />
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <RailLink {...item} />
                ))}
              </div>
            </div>
          ))}

          <div className="mt-6">
            <p className="mb-1 px-3 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
              我的
            </p>
            <div className="space-y-1">
              <RailLink
                key="profile"
                label="我的主页"
                to={`/@${me.handle}`}
                end={false}
              />
              <Form method="post" action="/logout">
                <button className="flex h-10 w-full items-center gap-3 rounded-[8px] px-3 text-left text-[15px] text-[var(--color-ink)] transition hover:bg-white">
                  <span className="grid h-[18px] w-[18px] place-items-center text-[var(--color-ink-soft)]">
                    <LogoutIcon />
                  </span>
                  退出
                </button>
              </Form>
            </div>
          </div>

          {/* bottom promo, as the rail's card sits flush above the fold */}
          <Link
            to="/new/project"
            className="mt-auto block rounded-[12px] bg-[var(--color-ink-2)] p-3.5 text-white"
          >
            <p className="text-[14px] font-semibold leading-snug">把作品放上来</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-white/65">
              一个标题、一句话就能开始。
            </p>
            <p className="mt-2 text-[12.5px] font-semibold text-white/90">
              上传作品 →
            </p>
          </Link>
        </aside>

        {/* ── white panel: radius 20, 8px inset from the top ────────── */}
        <div className="min-w-0 flex-1 pb-3 md:pr-3">
          <div className="min-h-[calc(100dvh-8px)] rounded-[20px] border border-[var(--color-line-soft)] bg-white px-5 pb-8 pt-6 md:px-14 md:pt-10">
            <div className="mb-6 flex gap-1 overflow-x-auto md:hidden">
              {RAIL_ITEMS.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `shrink-0 rounded-full px-3 py-1.5 text-[14px] font-medium ${
                      isActive
                        ? "bg-[var(--color-ink-2)] text-white"
                        : "text-[var(--color-ink-soft)]"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/settings/profile"
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-3 py-1.5 text-[14px] font-medium ${
                    isActive
                      ? "bg-[var(--color-ink-2)] text-white"
                      : "text-[var(--color-ink-soft)]"
                  }`
                }
              >
                设置
              </NavLink>
              <Form method="post" action="/logout" className="shrink-0">
                <button className="rounded-full px-3 py-1.5 text-[14px] font-medium text-[var(--color-ink-soft)]">
                  退出
                </button>
              </Form>
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

function RailLink({
  label,
  to,
  end = false,
}: {
  label: string;
  to: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex h-10 items-center gap-3 rounded-[8px] px-3 text-[15px] transition ${
          isActive
            ? "bg-white font-medium text-[var(--color-ink)] shadow-[0_1px_2px_rgba(16,24,40,0.06)]"
            : "text-[var(--color-ink)] hover:bg-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="grid h-[18px] w-[18px] place-items-center text-[var(--color-ink-soft)]">
            {isActive ? <DotIcon /> : <RingIcon />}
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}

/* ── icons: 18px, 1.6 stroke, quiet like the measured rail ───────────── */

function RingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="7.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function DotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="7.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9.5a6 6 0 0112 0v3.2l1.6 3.1c.3.6-.1 1.2-.8 1.2H5.2c-.7 0-1.1-.6-.8-1.2L6 12.7V9.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9.6 19.4a2.5 2.5 0 004.8 0" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 8V5a1 1 0 00-1-1H6a1 1 0 00-1 1v14a1 1 0 001 1h8a1 1 0 001-1v-3"
        stroke="currentColor" strokeWidth="1.6" />
      <path d="M11 12h9m0 0l-3-3m3 3l-3 3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}
````

## File: app/routes/discover.tsx
````typescript
import type { Route } from "./+types/discover";
import { Link, useSearchParams } from "react-router";
import { searchPeople } from "~/lib/queries.server";
import { PersonCard } from "~/components/cards";
import { PageHead } from "~/components/page-head";

const KINDS = [
  { v: "", label: "全部" },
  { v: "individual", label: "独立 FDE" },
  { v: "team", label: "团队 / Studio" },
];

const SORTS = [
  { v: "", label: "关注最多" },
  { v: "projects", label: "作品最多" },
  { v: "new", label: "最近更新" },
];

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || undefined;
  const kind = url.searchParams.get("kind") || undefined;
  const skill = url.searchParams.get("skill") || undefined;
  const sort = url.searchParams.get("sort") || undefined;

  const people = await searchPeople(context, {
    q,
    kind,
    skill,
    sort,
    limit: 30,
  });

  return { people, q: q ?? "", kind: kind ?? "", skill: skill ?? "", sort: sort ?? "" };
}

export default function Discover({ loaderData }: Route.ComponentProps) {
  const { people, q, kind, skill, sort } = loaderData;
  const [params] = useSearchParams();

  const withParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const s = next.toString();
    return `/discover${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <PageHead
        label="Discover"
        title="找到正在现场做事的人"
        description="按名字、方向或技能找。页面上看到的都是原始信息：作品数、关注者、他们自己写的话。平台不做排名，也不给任何人打等级。"
      />

      <form method="get" className="mt-7 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <input
            name="q"
            defaultValue={q}
            placeholder="搜名字、handle 或一句话介绍"
            className="field !h-[46px] pl-10"
            aria-label="搜索 FDE"
          />
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-faint)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </span>
        </div>
        {kind && <input type="hidden" name="kind" value={kind} />}
        {sort && <input type="hidden" name="sort" value={sort} />}
        <button className="btn btn-primary">搜索</button>
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <FilterRow label="类型">
          {KINDS.map((k) => (
            <FilterChip
              key={k.v || "all"}
              to={withParam("kind", k.v)}
              active={kind === k.v}
            >
              {k.label}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label="排序">
          {SORTS.map((s) => (
            <FilterChip
              key={s.v || "default"}
              to={withParam("sort", s.v)}
              active={sort === s.v}
            >
              {s.label}
            </FilterChip>
          ))}
        </FilterRow>
      </div>

      {skill && (
        <div className="mt-4 flex items-center gap-2 text-[12.5px] text-[var(--color-muted)]">
          技能筛选：<span className="chip chip-teal">{skill}</span>
          <Link to={withParam("skill", "")} className="text-[var(--color-ink-soft)] hover:underline">
            清除
          </Link>
        </div>
      )}

      <div className="mt-8 border-t border-[var(--color-line-soft)]">
        <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-line-soft)] py-2.5">
          <span className="font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
            {kind === "team"
              ? "团队 / Studio"
              : kind === "individual"
                ? "独立 FDE"
                : "全部 FDE"}
          </span>
          <span className="font-mono text-[11px] text-[var(--color-faint)] tabular-nums">
            {people.length} 位
          </span>
        </div>
        {people.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[16px] font-semibold">没找到</p>
            <p className="mt-1.5 text-[13.5px] text-[var(--color-ink-soft)]">
              换个关键词，或者去掉筛选条件。
            </p>
            <Link to="/discover" className="btn btn-ghost btn-sm mt-5">
              清空筛选
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line-soft)]">
            {people.map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 font-mono text-[11px] tracking-[0.1em] text-[var(--color-faint)] uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterChip({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      preventScrollReset
      className={`chip transition ${
        active
          ? "!bg-[var(--color-ink)] !text-white"
          : "hover:!bg-[var(--color-sunken-deep)]"
      }`}
    >
      {children}
    </Link>
  );
}
````

## File: app/routes/new-post.tsx
````typescript
import type { Route } from "./+types/new-post";
import { Form, Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { many, run } from "~/lib/db.server";
import { PageHead } from "~/components/page-head";

const KINDS = [
  { v: "show", t: "Show Work", d: "展示一个作品或阶段成果" },
  { v: "build", t: "Build in Public", d: "分享正在构建的过程" },
  { v: "thought", t: "Thoughts", d: "一个专业判断或观察" },
  { v: "discussion", t: "Discussion", d: "抛一个问题出来" },
];

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await requireMe(context, request);
  const projects = await many<{ id: string; title: string }>(
    context,
    `SELECT id, title FROM projects
      WHERE owner_id = ?1 AND visibility = 'public'
      ORDER BY created_at DESC LIMIT 20`,
    me.id,
  );
  return { me, projects };
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const kind = String(form.get("kind") ?? "show");
  const body = String(form.get("body") ?? "").trim();
  const projectId = String(form.get("project_id") ?? "");

  if (!body || body.length > 4000) {
    return Response.json({ error: "内容不能为空，且不超过 4000 字" }, { status: 400 });
  }

  const now = Date.now();
  const id = crypto.randomUUID();

  await run(
    context,
    `INSERT INTO posts (id, author_id, kind, body, project_id, visibility, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, 'public', ?6, ?6)`,
    id,
    me.id,
    KINDS.some((k) => k.v === kind) ? kind : "show",
    body,
    projectId || null,
    now,
  );

  throw redirect(`/posts/${id}`);
}

export default function NewPost({ loaderData }: Route.ComponentProps) {
  const { me, projects } = loaderData;

  return (
    <div className="max-w-[760px]">
      <PageHead
        label="Create"
        title="发一条动态"
        description={`以 @${me.handle} 的身份发布。发布后所有人可见。`}
        actions={
          <Link to="/" className="btn btn-ghost btn-sm">
            取消
          </Link>
        }
      />

      <Form method="post" className="mt-7 space-y-5">
        <fieldset>
          <legend className="mb-2.5 text-[12.5px] font-medium">类型</legend>
          <div className="grid grid-cols-2 gap-2">
            {KINDS.map((k, i) => (
              <label
                key={k.v}
                className="cursor-pointer rounded-[var(--radius-field)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3 transition has-[:checked]:border-[var(--color-ink-soft)] has-[:checked]:bg-[var(--color-accent-soft)]"
              >
                <input
                  type="radio"
                  name="kind"
                  value={k.v}
                  defaultChecked={i === 0}
                  className="sr-only"
                />
                <span className="block font-mono text-[10.5px] tracking-[0.1em] text-[var(--color-muted)] uppercase">
                  {k.t}
                </span>
                <span className="mt-0.5 block text-[12.5px] text-[var(--color-ink-soft)]">
                  {k.d}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium">内容</span>
          <textarea
            name="body"
            required
            maxLength={4000}
            rows={8}
            placeholder="做了什么、为什么、遇到了什么。具体一点更有用。"
            className="field field-area !min-h-[200px] text-[15px]"
          />
        </label>

        {projects.length > 0 && (
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">
              关联作品 <span className="font-normal text-[var(--color-faint)]">（可选）</span>
            </span>
            <select name="project_id" className="field cursor-pointer">
              <option value="">不关联</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Link to="/" className="btn btn-ghost">
            取消
          </Link>
          <button className="btn btn-primary">发布</button>
        </div>
      </Form>
    </div>
  );
}
````

## File: app/routes/new-project.tsx
````typescript
import type { Route } from "./+types/new-project";
import { data, Form, Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { one, stmt, batch } from "~/lib/db.server";
import { cleanUrl, clamp } from "~/lib/validate";
import { slugify } from "~/lib/format";
import { insertPost } from "~/lib/queries.server";
import { PageHead } from "~/components/page-head";

const KINDS = [
  { v: "project", t: "项目" },
  { v: "agent", t: "Agent" },
  { v: "tool", t: "工具" },
  { v: "automation", t: "自动化" },
  { v: "case", t: "案例" },
  { v: "oss", t: "开源" },
];

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await requireMe(context, request);
  return { me };
}

async function uniqueSlug(
  context: Parameters<typeof one>[0],
  base: string,
): Promise<string> {
  const root = base || "work";
  for (let i = 0; i < 40; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const hit = await one<{ n: number }>(
      context,
      `SELECT COUNT(*) AS n FROM projects WHERE slug = ?1`,
      candidate,
    );
    if ((hit?.n ?? 0) === 0) return candidate;
  }
  return `${root}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();

  const title = clamp(String(form.get("title") ?? ""), 90);
  const summary = clamp(String(form.get("summary") ?? ""), 220);
  const description = clamp(String(form.get("description") ?? ""), 8000);
  const kind = String(form.get("kind") ?? "project");
  const stage = clamp(String(form.get("stage") ?? ""), 40);
  const role = clamp(String(form.get("role") ?? ""), 2000);
  const limitations = clamp(String(form.get("limitations") ?? ""), 2000);
  const cover = cleanUrl(String(form.get("cover_url") ?? ""));
  const demo = cleanUrl(String(form.get("demo_url") ?? ""));
  const docs = cleanUrl(String(form.get("docs_url") ?? ""));
  const repo = cleanUrl(String(form.get("repo_url") ?? ""));
  const skills = String(form.get("skills") ?? "")
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

  const errors: Record<string, string> = {};
  if (!title) errors.title = "请填写标题";
  if (!summary) errors.summary = "请填写一句话简介";
  if (Object.keys(errors).length) {
    return data({ errors }, { status: 400 });
  }

  const slug = await uniqueSlug(context, slugify(title));
  const id = crypto.randomUUID();
  const now = Date.now();

  const stmts = [
    stmt(
      context,
      `INSERT INTO projects
         (id, owner_id, slug, kind, title, summary, description, cover_url,
          demo_url, docs_url, repo_url, role, stage, limitations,
          visibility, featured, created_at, updated_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,'public',0,?15,?15)`,
      id,
      me.id,
      slug,
      KINDS.some((k) => k.v === kind) ? kind : "project",
      title,
      summary,
      description || null,
      cover,
      demo,
      docs,
      repo,
      role || null,
      stage || null,
      limitations || null,
      now,
    ),
    ...skills.map((s, i) =>
      stmt(
        context,
        `INSERT OR IGNORE INTO project_skills (project_id, skill_name, position)
         VALUES (?1, ?2, ?3)`,
        id,
        s,
        i,
      ),
    ),
  ];

  await batch(context, stmts);

  // Publishing work is the one moment the author is already writing copy, so
  // offering a matching feed post here is cheaper than asking them again.
  if (form.get("share_to_feed") === "on") {
    await insertPost(context, {
      authorId: me.id,
      kind: "show",
      body: `${title}
${summary}`,
      projectId: id,
      tags: skills.slice(0, 5),
    });
  }

  throw redirect(`/projects/${slug}`);
}

export default function NewProject({ actionData }: Route.ComponentProps) {
  const errors = actionData?.errors ?? {};

  return (
    <div className="max-w-[900px]">
      <PageHead
        label="Create"
        title="上传一个作品"
        description="标题之外都可以先跳过。作品页会明确标注哪些是本人自述、哪些是外部链接。"
        actions={
          <Link to="/" className="btn btn-ghost btn-sm">
            取消
          </Link>
        }
      />

      <Form method="post" className="mt-8 space-y-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
          <label className="block">
            <span className="mb-1.5 flex gap-2 text-[12.5px] font-medium">
              标题
              {errors.title && <span className="text-[#c0392b]">{errors.title}</span>}
            </span>
            <input
              name="title"
              required
              maxLength={90}
              placeholder="比如：把客服工单自动归档的 Agent"
              className="field"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">类型</span>
            <select name="kind" className="field cursor-pointer">
              {KINDS.map((k) => (
                <option key={k.v} value={k.v}>
                  {k.t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 flex gap-2 text-[12.5px] font-medium">
            一句话简介
            {errors.summary && <span className="text-[#c0392b]">{errors.summary}</span>}
          </span>
          <input
            name="summary"
            required
            maxLength={220}
            placeholder="它解决什么问题，为谁解决"
            className="field"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium">
            详细说明
            <span className="ml-2 font-normal text-[var(--color-faint)]">
              可以留空
            </span>
          </span>
          <textarea
            name="description"
            rows={8}
            maxLength={8000}
            placeholder="背景、做法、结果。贴截图和数字时说明口径会更有说服力。"
            className="field field-area !min-h-[180px]"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">
              我负责的部分
              <span className="ml-2 font-normal text-[var(--color-faint)]">会标注为自述</span>
            </span>
            <textarea
              name="role"
              rows={3}
              maxLength={2000}
              placeholder="比如：独立完成架构和后端，前端与设计师合作"
              className="field field-area !min-h-[88px]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">
              限制与前提
              <span className="ml-2 font-normal text-[var(--color-faint)]">可选</span>
            </span>
            <textarea
              name="limitations"
              rows={3}
              maxLength={2000}
              placeholder="比如：只支持英文工单；需要私有部署"
              className="field field-area !min-h-[88px]"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">
              阶段 <span className="font-normal text-[var(--color-faint)]">可选</span>
            </span>
            <input
              name="stage"
              maxLength={40}
              placeholder="原型 / 内测 / 已上线 / 维护中"
              className="field"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">
              技能标签
              <span className="ml-2 font-normal text-[var(--color-faint)]">逗号分隔</span>
            </span>
            <input
              name="skills"
              placeholder="RAG, 语音转写, D1"
              className="field"
            />
          </label>
        </div>

        <fieldset className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-sunken)] p-4">
          <legend className="px-1 text-[11.5px] tracking-[0.1em] text-[var(--color-muted)] uppercase">
            链接与图片
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12px] text-[var(--color-ink-soft)]">封面图片 URL</span>
              <input name="cover_url" placeholder="https://…" className="field !h-[42px]" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] text-[var(--color-ink-soft)]">在线 Demo</span>
              <input name="demo_url" placeholder="https://…" className="field !h-[42px]" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] text-[var(--color-ink-soft)]">文档</span>
              <input name="docs_url" placeholder="https://…" className="field !h-[42px]" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] text-[var(--color-ink-soft)]">代码仓库</span>
              <input name="repo_url" placeholder="https://github.com/…" className="field !h-[42px]" />
            </label>
          </div>
          <p className="mt-2.5 text-[11.5px] text-[var(--color-faint)]">
            没有封面图也可以发布，会自动生成一张配色封面。
          </p>
        </fieldset>

        <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-sunken)] p-4">
          <input
            type="checkbox"
            name="share_to_feed"
            defaultChecked
            className="mt-0.5 h-[16px] w-[16px] shrink-0 accent-[var(--color-ink-soft)]"
          />
          <span>
            <span className="block text-[13px] font-medium">同时发布一条动态到广场</span>
            <span className="mt-0.5 block text-[12px] text-[var(--color-ink-soft)]">
              用标题和简介自动生成，带上技能标签，可以之后在广场上改。
            </span>
          </span>
        </label>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link to="/" className="btn btn-ghost">
            取消
          </Link>
          <button className="btn btn-primary">发布作品</button>
        </div>
      </Form>
    </div>
  );
}
````

## File: app/routes/notifications.tsx
````typescript
import type { Route } from "./+types/notifications";
import { Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { many, run } from "~/lib/db.server";
import { Avatar } from "~/components/media";
import { relativeTime } from "~/lib/format";
import { PageHead } from "~/components/page-head";

const TEXT: Record<string, string> = {
  follow: "关注了你",
  like: "赞了你的内容",
  comment: "评论了你的动态",
  repost: "转发了你的动态",
  mention: "提到了你",
};

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await requireMe(context, request);
  const items = await many<{
    id: string;
    type: string;
    target_type: string | null;
    target_id: string | null;
    read_at: number | null;
    created_at: number;
    actor_handle: string | null;
    actor_name: string | null;
    actor_avatar: string | null;
    post_id: string | null;
    project_slug: string | null;
  }>(
    context,
    `SELECT n.id, n.type, n.target_type, n.target_id, n.read_at, n.created_at,
            u.handle AS actor_handle, p.display_name AS actor_name,
            p.avatar_url AS actor_avatar,
            po.id AS post_id, pr.slug AS project_slug
       FROM notifications n
       LEFT JOIN users u    ON u.id = n.actor_id
       LEFT JOIN profiles p ON p.user_id = n.actor_id
       LEFT JOIN posts po   ON n.target_type = 'post'    AND po.id = n.target_id
       LEFT JOIN projects pr ON n.target_type = 'project' AND pr.id = n.target_id
      WHERE n.recipient_id = ?1
      ORDER BY n.created_at DESC
      LIMIT 60`,
    me.id,
  );

  const unread = items.filter((i) => !i.read_at).length;
  const rows = items.map((i) => ({ ...i, time_label: relativeTime(i.created_at) }));
  return { me, items: rows, unread };
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  await run(
    context,
    `UPDATE notifications SET read_at = ?2 WHERE recipient_id = ?1 AND read_at IS NULL`,
    me.id,
    Date.now(),
  );
  return redirect("/notifications");
}

export default function Notifications({ loaderData }: Route.ComponentProps) {
  const { items, unread } = loaderData;

  return (
    <div>
      <PageHead
        label="Activity"
        title="通知"
        actions={
          unread > 0 ? (
            <form method="post">
              <button className="btn btn-ghost btn-sm">全部标为已读</button>
            </form>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <div className="mt-8 border-t border-[var(--color-line-soft)] py-16">
          <p className="text-[16px] font-semibold">还没有通知</p>
          <p className="mt-1.5 text-[13.5px] text-[var(--color-ink-soft)]">
            有人关注你、赞你的作品或评论你的动态时，会出现在这里。
          </p>
        </div>
      ) : (
        <div className="mt-8 divide-y divide-[var(--color-line-soft)] border-t border-[var(--color-line-soft)]">
          {items.map((n) => {
            const href =
              n.post_id
                ? `/posts/${n.post_id}`
                : n.project_slug
                  ? `/projects/${n.project_slug}`
                  : n.actor_handle
                    ? `/@${n.actor_handle}`
                    : "/discover";

            return (
              <Link
                key={n.id}
                to={href}
                className={`flex items-center gap-3 px-1 py-3.5 transition hover:bg-[var(--color-paper)] ${
                  n.read_at ? "opacity-55" : ""
                }`}
              >
                {!n.read_at && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-ink-soft)]" />
                )}
                <Avatar
                  name={n.actor_name ?? "?"}
                  src={n.actor_avatar}
                  size={34}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px]">
                    <span className="font-medium">{n.actor_name ?? "某人"}</span>{" "}
                    <span className="text-[var(--color-muted)]">
                      {TEXT[n.type] ?? n.type}
                    </span>
                  </p>
                  <p className="font-mono text-[10.5px] text-[var(--color-faint)]">
                    {n.time_label}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
````

## File: app/routes/settings-accounts.tsx
````typescript
import type { Route } from "./+types/settings-accounts";
import { data, Form, Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { many, run } from "~/lib/db.server";
import { cleanUrl } from "~/lib/validate";
import { PageHead } from "~/components/page-head";

const PROVIDERS = [
  { v: "github", t: "GitHub", ph: "https://github.com/yourname" },
  { v: "linkedin", t: "LinkedIn", ph: "https://www.linkedin.com/in/yourname" },
  { v: "huggingface", t: "Hugging Face", ph: "https://huggingface.co/yourname" },
  { v: "website", t: "个人网站", ph: "https://yoursite.com" },
  { v: "x", t: "X", ph: "https://x.com/yourname" },
  { v: "blog", t: "博客", ph: "https://yourblog.com" },
];

const LABEL: Record<string, string> = Object.fromEntries(
  PROVIDERS.map((p) => [p.v, p.t]),
);

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await requireMe(context, request);
  const accounts = await many<{
    id: string;
    provider: string;
    profile_url: string;
    connection: string;
  }>(
    context,
    `SELECT id, provider, profile_url, connection FROM external_accounts
      WHERE user_id = ?1 ORDER BY position, created_at`,
    me.id,
  );
  return { me, accounts };
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "add");

  if (intent === "remove") {
    await run(
      context,
      `DELETE FROM external_accounts WHERE id = ?1 AND user_id = ?2`,
      String(form.get("id") ?? ""),
      me.id,
    );
    return redirect("/settings/accounts");
  }

  const provider = String(form.get("provider") ?? "");
  const url = cleanUrl(String(form.get("profile_url") ?? ""));

  if (!PROVIDERS.some((p) => p.v === provider)) {
    return data({ error: "请选择平台" }, { status: 400 });
  }
  if (!url) {
    return data({ error: "请填写正确的链接" }, { status: 400 });
  }

  const count = await many<{ n: number }>(
    context,
    `SELECT COUNT(*) AS n FROM external_accounts WHERE user_id = ?1`,
    me.id,
  );

  await run(
    context,
    `INSERT OR IGNORE INTO external_accounts
       (id, user_id, provider, profile_url, connection, position, created_at)
     VALUES (?1, ?2, ?3, ?4, 'link', ?5, ?6)`,
    crypto.randomUUID(),
    me.id,
    provider,
    url,
    count[0]?.n ?? 0,
    Date.now(),
  );

  return redirect("/settings/accounts");
}

export default function SettingsAccounts({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { accounts } = loaderData;

  return (
    <div className="max-w-[760px]">
      <PageHead
        label="Settings"
        title="外部账号"
        description="加 GitHub、LinkedIn 这些链接，会显示在主页上，并标注为「外部链接」——意思是我们不核实那边的内容，访问者点过去自己看。"
        actions={
          <Link to="/settings/profile" className="btn btn-ghost btn-sm">
            编辑主页
          </Link>
        }
      />

      {accounts.length > 0 && (
        <div className="mt-7 divide-y divide-[var(--color-line-soft)] border-y border-[var(--color-line-soft)]">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-3.5">
              <span className="chip chip-outline shrink-0">
                {LABEL[a.provider] ?? a.provider}
              </span>
              <a
                href={a.profile_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="min-w-0 flex-1 truncate text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              >
                {a.profile_url}
              </a>
              <Form method="post" className="shrink-0">
                <input type="hidden" name="intent" value="remove" />
                <input type="hidden" name="id" value={a.id} />
                <button className="btn btn-quiet btn-sm">移除</button>
              </Form>
            </div>
          ))}
        </div>
      )}

      <Form
        method="post"
        className="mt-6 rounded-[12px] border border-[var(--color-line-soft)] bg-[var(--color-paper)] p-4"
      >
        <p className="mb-3 text-[12.5px] font-medium">添加一个</p>
        <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
          <select name="provider" className="field cursor-pointer">
            {PROVIDERS.map((p) => (
              <option key={p.v} value={p.v}>
                {p.t}
              </option>
            ))}
          </select>
          <input
            name="profile_url"
            required
            placeholder="https://…"
            className="field"
          />
        </div>
        {actionData?.error && (
          <p className="mt-2 text-[12.5px] text-[#c0392b]">{actionData.error}</p>
        )}
        <div className="mt-3 flex justify-end">
          <button className="btn btn-primary btn-sm">添加</button>
        </div>
      </Form>

      <p className="mt-5 text-[11.5px] leading-relaxed text-[var(--color-faint)]">
        当前所有外部账号都是「手动链接」。OAuth 授权连接会在后续版本提供，
        届时会额外标注「已连接账号」，同样不代表我们核实了你的履历。
      </p>
    </div>
  );
}
````

## File: app/routes/settings-privacy.tsx
````typescript
import type { Route } from "./+types/settings-privacy";
import { Form, Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { one, run } from "~/lib/db.server";
import { PageHead } from "~/components/page-head";

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await requireMe(context, request);
  const p = await one<{ visibility: string; hide_follows: number }>(
    context,
    `SELECT visibility, hide_follows FROM profiles WHERE user_id = ?1`,
    me.id,
  );
  return { me, profile: p };
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "save");

  if (intent === "delete-account") {
    // hard delete: cascade removes profile, projects, posts, follows, reactions
    await run(context, `DELETE FROM users WHERE id = ?1`, me.id);
    const { clearSessionCookie } = await import("~/lib/auth.server");
    throw redirect("/", { headers: { "Set-Cookie": clearSessionCookie() } });
  }

  await run(
    context,
    `UPDATE profiles SET visibility = ?2, hide_follows = ?3, updated_at = ?4
      WHERE user_id = ?1`,
    me.id,
    form.get("visibility") === "private" ? "private" : "public",
    form.get("hide_follows") === "on" ? 1 : 0,
    Date.now(),
  );

  return redirect("/settings/privacy?saved=1");
}

export default function SettingsPrivacy({
  loaderData,
}: Route.ComponentProps) {
  const { profile } = loaderData;

  return (
    <div className="max-w-[760px]">
      <PageHead
        label="Settings"
        title="隐私"
        description="这些开关只影响别人看到什么，不影响数据本身。"
        actions={
          <Link to="/settings/profile" className="btn btn-ghost btn-sm">
            编辑主页
          </Link>
        }
      />

      <Form method="post" className="mt-7 space-y-3">
        <div className="divide-y divide-[var(--color-line-soft)] border-y border-[var(--color-line-soft)]">
          <label className="flex items-center justify-between gap-4 py-4">
            <span>
              <span className="block text-[13px] font-medium">主页公开</span>
              <span className="mt-0.5 block text-[12px] text-[var(--color-muted)]">
                关闭后，主页、作品和动态都不对其他人可见。
              </span>
            </span>
            <select
              name="visibility"
              defaultValue={profile?.visibility ?? "public"}
              className="field !h-[38px] !w-[104px] shrink-0"
            >
              <option value="public">公开</option>
              <option value="private">非公开</option>
            </select>
          </label>

          <label className="flex items-center justify-between gap-4 py-4">
            <span>
              <span className="block text-[13px] font-medium">隐藏关注数与关注列表</span>
              <span className="mt-0.5 block text-[12px] text-[var(--color-muted)]">
                关注者仍然存在，只是不在主页显示数字。
              </span>
            </span>
            <input
              type="checkbox"
              name="hide_follows"
              defaultChecked={Boolean(profile?.hide_follows)}
              className="h-[18px] w-[18px] shrink-0 accent-[var(--color-ink-soft)]"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary">保存</button>
        </div>
      </Form>

      <section className="mt-10 rounded-[var(--radius-panel)] border border-[#f0d5d2] bg-[#fdf6f5] p-5">
        <h2 className="text-[14px] font-medium text-[#8c3b2f]">删除账号</h2>
        <p className="mt-1.5 max-w-[520px] text-[12.5px] leading-relaxed text-[#8c3b2f]/80">
          会永久删除你的主页、作品、动态、评论和关注关系。这个操作不可撤销，
          也没有回收站。
        </p>
        <Form method="post" className="mt-3.5">
          <input type="hidden" name="intent" value="delete-account" />
          <button className="btn btn-sm border border-[#e0c0bc] bg-white text-[#8c3b2f] hover:bg-[#fdf0ee]">
            删除我的账号
          </button>
        </Form>
      </section>
    </div>
  );
}
````

## File: app/app.css
````css
@import "tailwindcss";

/* ─────────────────────────────────────────────────────────────────────
   Design tokens reverse-engineered from contra.com at runtime.
   These are measured, not estimated: computed styles plus
   getBoundingClientRect from a 1440×1000 render.

   frame      container 1368px · page padding 26px 36px · nav 74px
   ink        #14171f headline · #222834 primary button · #4a5264 nav idle
   muted      #677084
   canvas     #ffffff
   card       16px radius · 0 10px 20px rgba(0,0,0,.05)
   search     20px radius
   type       h1 58/500 · 1.05 · -0.01em
              h2 23/500 · 1.39 · +0.02em
              lead 19/400 · 1.47 · +0.02em
              label 16/600 · small 14/400
   buttons    48h · 24r · 16px/600     and 36h · 999r · 14px
   ───────────────────────────────────────────────────────────────────── */

@theme {
  --color-canvas: #ffffff;
  --color-surface: #ffffff;
  --color-paper: #f6f6f6;
  --color-sunken: #f2f2f2;
  --color-sunken-deep: #e9eaec;
  --color-ink: #14171f;
  --color-ink-2: #222834;
  --color-ink-soft: #4a5264;
  --color-muted: #677084;
  --color-faint: #8b93a3;
  --color-line: #e3e5ea;
  --color-line-soft: #eef0f2;
  --color-accent: #222834;
  --color-accent-soft: #f2f4f7;
  --color-butter: #f2c94c;
  --color-watermelon: #ff5a5e;
  --color-lilac: #8f6fdb;
  --color-sky: #6ca3e0;

  --font-sans: "Inter Variable", ui-sans-serif, system-ui, -apple-system,
    "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-display: "Instrument Sans Variable", "Inter Variable", ui-sans-serif,
    system-ui, "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;

  --radius-card: 16px;
  --radius-panel: 16px;
  --radius-field: 12px;
  --radius-search: 20px;
  --radius-pill: 999px;

  --shadow-card: 0 10px 20px rgba(0, 0, 0, 0.05);
  --shadow-lift: 0 14px 32px rgba(0, 0, 0, 0.09);
}

@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    -webkit-text-size-adjust: 100%;
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    background: var(--color-canvas);
    color: var(--color-ink);
    font-family: var(--font-sans);
    font-size: 16px;
    line-height: 1.5;
    letter-spacing: 0.01em;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::selection {
    background: var(--color-ink);
    color: #fff;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
    color: inherit;
  }

  :focus-visible {
    outline: 2px solid var(--color-ink);
    outline-offset: 2px;
    border-radius: 4px;
  }

  img {
    display: block;
    max-width: 100%;
  }

  .rail {
    scrollbar-width: thin;
    scrollbar-color: var(--color-line) transparent;
  }
  .rail::-webkit-scrollbar {
    height: 6px;
  }
  .rail::-webkit-scrollbar-thumb {
    background: var(--color-line);
    border-radius: 999px;
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@layer components {
  /* Page frame: 1368 container with 36px gutters, as measured. */
  .frame {
    margin: 0 auto;
    max-width: 1368px;
    padding-left: 36px;
    padding-right: 36px;
  }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-faint);
  }

  /* h1: 58/500/1.05/-0.01em, measured off "Get more creative" */
  .display {
    font-family: var(--font-display);
    font-weight: 500;
    line-height: 1.05;
    letter-spacing: -0.01em;
    color: var(--color-ink);
  }

  /* h2: 23/500/1.39 with the positive +0.02em tracking Contra uses */
  .section-title {
    font-family: var(--font-display);
    font-size: 23px;
    font-weight: 500;
    line-height: 1.39;
    letter-spacing: 0.02em;
    color: var(--color-ink);
  }

  .lead {
    font-size: 19px;
    line-height: 1.47;
    letter-spacing: 0.02em;
    color: var(--color-muted);
  }

  .card {
    background: var(--color-surface);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
    border: 1px solid var(--color-line-soft);
  }

  .card-link {
    transition:
      transform 200ms cubic-bezier(0.2, 0.7, 0.2, 1),
      box-shadow 200ms cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  .card-link:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lift);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 48px;
    padding: 0 24px;
    border-radius: 24px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.01em;
    white-space: nowrap;
    cursor: pointer;
    border: 1px solid transparent;
    transition:
      background 160ms ease,
      color 160ms ease,
      border-color 160ms ease,
      transform 160ms ease;
  }
  .btn:active {
    transform: scale(0.985);
  }
  .btn-primary {
    background: var(--color-ink-2);
    color: #fff;
  }
  .btn-primary:hover {
    background: #2f3746;
  }
  .btn-ghost {
    background: var(--color-surface);
    color: var(--color-ink);
    border-color: var(--color-line);
  }
  .btn-ghost:hover {
    background: var(--color-paper);
  }
  .btn-quiet {
    background: transparent;
    color: var(--color-ink-soft);
  }
  .btn-quiet:hover {
    color: var(--color-ink);
    background: var(--color-paper);
  }
  .btn-sm {
    height: 36px;
    padding: 0 16px;
    border-radius: var(--radius-pill);
    font-size: 14px;
    font-weight: 500;
  }

  .field {
    width: 100%;
    height: 48px;
    padding: 0 16px;
    border-radius: var(--radius-field);
    border: 1px solid var(--color-line);
    background: var(--color-surface);
    font-size: 16px;
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease;
  }
  .field::placeholder {
    color: var(--color-faint);
  }
  .field:focus {
    outline: none;
    border-color: var(--color-ink-soft);
    box-shadow: 0 0 0 3px rgba(34, 40, 52, 0.08);
  }
  .field-area {
    height: auto;
    min-height: 140px;
    padding: 14px 16px;
    line-height: 1.6;
    resize: vertical;
  }

  /* Search composer: the 20px-radius shell from the Contra hero. */
  .search-shell {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 64px;
    padding: 10px 12px 10px 20px;
    border-radius: var(--radius-search);
    border: 1px solid var(--color-line);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }
  .search-shell input {
    flex: 1;
    min-width: 0;
    height: 44px;
    border: 0;
    background: transparent;
    font-size: 16px;
    outline: none;
  }
  .search-shell input::placeholder {
    color: var(--color-faint);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 12px;
    border-radius: var(--radius-pill);
    background: var(--color-paper);
    color: var(--color-ink-soft);
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
  }
  .chip-dark {
    background: var(--color-ink-2);
    color: #fff;
  }
  .chip-outline {
    background: transparent;
    border: 1px solid var(--color-line);
    color: var(--color-muted);
  }

  .avatar {
    border-radius: 50%;
    object-fit: cover;
    background: var(--color-paper);
    flex: none;
  }

  /* Abstract field: flat duotone plus one geometric mark, keyed by slug.
     Used where a photograph would be a lie — a person's own banner. */
  .cover-art {
    position: relative;
    overflow: hidden;
    background-image: linear-gradient(150deg, var(--ta) 0%, var(--tb) 100%);
  }
  .cover-art::after {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0.32;
    background-image: repeating-linear-gradient(
      -35deg,
      transparent 0 6px,
      rgba(255, 255, 255, 0.5) 6px 7px
    );
    mix-blend-mode: soft-light;
  }
  .cover-arc {
    position: absolute;
    right: -8%;
    top: -22%;
    width: 62%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--mark);
    opacity: 0.14;
  }
  .cover-rule {
    position: absolute;
    left: 8%;
    top: 50%;
    width: 26%;
    height: 2px;
    background: var(--mark);
    opacity: 0.42;
  }

  /* Cover art: a photograph, tinted per slug so a grid of them reads as a
     set. The fine diagonal lattice is what keeps it in the same family as
     the rest of the surface. */
  .cover-photo {
    position: relative;
    overflow: hidden;
    /* neutral until the photo arrives: a pastel block at low fill reads as
       a missing image, a paper-grey block reads as a deliberate placeholder */
    background: var(--color-sunken);
    isolation: isolate;
  }
  .cover-photo img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(18%) saturate(92%) contrast(103%);
  }
  .cover-photo::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
    background-image: linear-gradient(150deg, var(--ta) 0%, var(--tb) 100%);
    opacity: 0.24;
    mix-blend-mode: multiply;
  }
  .cover-photo::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 2;
    opacity: 0.26;
    background-image: repeating-linear-gradient(
      -35deg,
      transparent 0 6px,
      rgba(255, 255, 255, 0.55) 6px 7px
    );
    mix-blend-mode: soft-light;
  }
}

@media (max-width: 760px) {
  .frame {
    padding-left: 20px;
    padding-right: 20px;
  }
}
````

## File: app/routes.ts
````typescript
import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/shell.tsx", [
    index("routes/home.tsx"),

    route("feed", "routes/feed.tsx"),

    route("discover", "routes/discover.tsx"),
    route("discover/projects", "routes/discover-projects.tsx"),

    route("projects/:slug/edit", "routes/project-edit.tsx"),
    route("projects/:slug", "routes/project.tsx"),
    route("posts/:id/edit", "routes/post-edit.tsx"),
    route("posts/:id", "routes/post.tsx"),

    route("notifications", "routes/notifications.tsx"),

    route("settings/profile", "routes/settings-profile.tsx"),
    route("settings/accounts", "routes/settings-accounts.tsx"),
    route("settings/privacy", "routes/settings-privacy.tsx"),

    route("new/post", "routes/new-post.tsx"),
    route("new/project", "routes/new-project.tsx"),

    route(":handle", "routes/profile.tsx"),
    route(":handle/projects", "routes/profile-projects.tsx"),

    route("actions/like", "routes/actions-like.tsx"),
    route("actions/follow", "routes/actions-follow.tsx"),
    route("actions/comment", "routes/actions-comment.tsx"),
    route("actions/bookmark", "routes/actions-bookmark.tsx"),
    route("actions/repost", "routes/actions-repost.tsx"),
  ]),

  // auth lives outside the shell: full-bleed, no nav chrome
  route("join", "routes/join.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
] satisfies RouteConfig;
````

## File: app/lib/queries.server.ts
````typescript
import type { AppLoadContext } from "react-router";
import { batch, many, stmt } from "./db.server";
import { relativeTime } from "./format";

export interface ProjectCardRow {
  id: string;
  slug: string;
  kind: string;
  title: string;
  summary: string;
  cover_url: string | null;
  featured: number;
  created_at: number;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  likes: number;
}

export interface PostCardRow {
  id: string;
  kind: string;
  body: string;
  created_at: number;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  likes: number;
  comments: number;
  /** Formatted once on the server so SSR and hydration agree. */
  time_label: string;
  project_slug: string | null;
  project_title: string | null;
  liked: number;
}

export interface PersonRow {
  id: string;
  handle: string;
  kind: string;
  display_name: string;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  projects: number;
  followers: number;
}

/**
 * Content visibility has two levels: the item's own `visibility`, and the
 * owner's profile visibility. A profile set to 私密 means "主页、作品和动态
 * 都不对其他人可见", so every public surface has to honour it — the owner
 * is the only exception.
 */
const projectSelect = (viewerSlot: number) => `
  SELECT pr.id, pr.slug, pr.kind, pr.title, pr.summary, pr.cover_url,
         pr.featured, pr.created_at,
         u.handle, p.display_name, p.avatar_url,
         (SELECT COUNT(*) FROM reactions r
           WHERE r.target_type = 'project' AND r.target_id = pr.id) AS likes
    FROM projects pr
    JOIN users u   ON u.id = pr.owner_id
    JOIN profiles p ON p.user_id = pr.owner_id
   WHERE pr.visibility = 'public' AND u.status = 'active'
     AND (p.visibility = 'public' OR pr.owner_id = ?${viewerSlot})
`;

export async function latestProjects(
  context: AppLoadContext,
  viewerId: string | null,
  limit = 9,
): Promise<ProjectCardRow[]> {
  return many<ProjectCardRow>(
    context,
    `${projectSelect(1)} ORDER BY pr.featured DESC, pr.created_at DESC LIMIT ?2`,
    viewerId ?? "·none·",
    limit,
  );
}

export async function projectsByOwner(
  context: AppLoadContext,
  ownerId: string,
  viewerId: string | null = null,
): Promise<ProjectCardRow[]> {
  return many<ProjectCardRow>(
    context,
    `${projectSelect(2)} AND pr.owner_id = ?1
      ORDER BY pr.featured DESC, pr.created_at DESC`,
    ownerId,
    viewerId ?? "·none·",
  );
}

const POST_SELECT = `
  SELECT po.id, po.kind, po.body, po.created_at,
         u.handle, p.display_name, p.avatar_url,
         pr.slug AS project_slug, pr.title AS project_title,
         (SELECT COUNT(*) FROM reactions r
           WHERE r.target_type = 'post' AND r.target_id = po.id AND r.type = 'like') AS likes,
         (SELECT COUNT(*) FROM comments c
           WHERE c.post_id = po.id AND c.deleted_at IS NULL) AS comments,
         (SELECT COUNT(*) FROM reactions r2
           WHERE r2.target_type = 'post' AND r2.target_id = po.id
             AND r2.type = 'like' AND r2.user_id = ?2) AS liked
    FROM posts po
    JOIN users u    ON u.id = po.author_id
    JOIN profiles p ON p.user_id = po.author_id
    LEFT JOIN projects pr ON pr.id = po.project_id
   WHERE po.visibility = 'public' AND po.deleted_at IS NULL AND u.status = 'active'
     AND (p.visibility = 'public' OR po.author_id = ?2)
`;

export async function latestPosts(
  context: AppLoadContext,
  viewerId: string | null,
  limit = 20,
): Promise<PostCardRow[]> {
  const rows = await many<PostCardRow>(
    context,
    `${POST_SELECT} ORDER BY po.created_at DESC LIMIT ?1`,
    limit,
    viewerId ?? "·none·",
  );
  return rows.map((r) => ({ ...r, time_label: relativeTime(r.created_at) }));
}

export async function followingPosts(
  context: AppLoadContext,
  viewerId: string,
  limit = 20,
): Promise<PostCardRow[]> {
  const rows = await many<PostCardRow>(
    context,
    `${POST_SELECT}
       AND (po.author_id = ?2 OR po.author_id IN (
             SELECT followed_id FROM follows WHERE follower_id = ?2))
      ORDER BY po.created_at DESC LIMIT ?1`,
    limit,
    viewerId,
  );
  return rows.map((r) => ({ ...r, time_label: relativeTime(r.created_at) }));
}

export async function postsByAuthor(
  context: AppLoadContext,
  authorId: string,
  viewerId: string | null,
  limit = 20,
): Promise<PostCardRow[]> {
  const rows = await many<PostCardRow>(
    context,
    `${POST_SELECT} AND po.author_id = ?3 ORDER BY po.created_at DESC LIMIT ?1`,
    limit,
    viewerId ?? "·none·",
    authorId,
  );
  return rows.map((r) => ({ ...r, time_label: relativeTime(r.created_at) }));
}

const PERSON_SELECT = `
  SELECT u.id, u.handle, u.kind, p.display_name, p.avatar_url,
         p.headline, p.location, p.updated_at,
         (SELECT COUNT(*) FROM projects pr
           WHERE pr.owner_id = u.id AND pr.visibility = 'public') AS projects,
         (SELECT COUNT(*) FROM follows f WHERE f.followed_id = u.id) AS followers
    FROM users u JOIN profiles p ON p.user_id = u.id
   WHERE u.status = 'active' AND p.visibility = 'public'
`;

export async function featuredPeople(
  context: AppLoadContext,
  limit = 6,
): Promise<PersonRow[]> {
  return many<PersonRow>(
    context,
    `${PERSON_SELECT} ORDER BY followers DESC, projects DESC, p.updated_at DESC LIMIT ?1`,
    limit,
  );
}

export async function recommendedPeople(
  context: AppLoadContext,
  viewerId: string,
  limit = 4,
): Promise<PersonRow[]> {
  return many<PersonRow>(
    context,
    `${PERSON_SELECT} AND u.id <> ?1
       AND u.id NOT IN (SELECT followed_id FROM follows WHERE follower_id = ?1)
      ORDER BY followers DESC, projects DESC LIMIT ?2`,
    viewerId,
    limit,
  );
}

export async function searchPeople(
  context: AppLoadContext,
  opts: {
    q?: string;
    kind?: string;
    skill?: string;
    sort?: string;
    limit?: number;
  },
): Promise<PersonRow[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (opts.q) {
    params.push(`%${opts.q}%`);
    clauses.push(
      `(p.display_name LIKE ?${i} OR u.handle LIKE ?${i} OR p.headline LIKE ?${i})`,
    );
    i++;
  }
  if (opts.kind === "individual" || opts.kind === "team") {
    params.push(opts.kind);
    clauses.push(`u.kind = ?${i}`);
    i++;
  }
  if (opts.skill) {
    params.push(opts.skill);
    clauses.push(
      `u.id IN (SELECT user_id FROM profile_skills WHERE skill_name = ?${i})`,
    );
    i++;
  }

  const where = clauses.length ? ` AND ${clauses.join(" AND ")}` : "";
  const order =
    opts.sort === "new"
      ? "p.updated_at DESC"
      : opts.sort === "projects"
        ? "projects DESC, followers DESC"
        : "followers DESC, projects DESC";

  return many<PersonRow>(
    context,
    `${PERSON_SELECT}${where} ORDER BY ${order} LIMIT ?${i}`,
    ...params,
    opts.limit ?? 24,
  );
}

export async function searchProjects(
  context: AppLoadContext,
  opts: {
    q?: string;
    kind?: string;
    sort?: string;
    limit?: number;
    viewerId?: string | null;
  },
): Promise<ProjectCardRow[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (opts.q) {
    params.push(`%${opts.q}%`);
    clauses.push(`(pr.title LIKE ?${i} OR pr.summary LIKE ?${i})`);
    i++;
  }
  if (opts.kind && opts.kind !== "all") {
    params.push(opts.kind);
    clauses.push(`pr.kind = ?${i}`);
    i++;
  }

  const viewerSlot = i;
  params.push(opts.viewerId ?? "·none·");
  i++;

  const where = clauses.length ? ` AND ${clauses.join(" AND ")}` : "";
  const order =
    opts.sort === "likes" ? "likes DESC, pr.created_at DESC" : "pr.created_at DESC";

  return many<ProjectCardRow>(
    context,
    `${projectSelect(viewerSlot)}${where} ORDER BY ${order} LIMIT ?${i}`,
    ...params,
    opts.limit ?? 24,
  );
}

export async function countsForProfile(
  context: AppLoadContext,
  userId: string,
): Promise<{ followers: number; following: number; posts: number; projects: number }> {
  const rows = await many<{
    followers: number;
    following: number;
    posts: number;
    projects: number;
  }>(
    context,
    `SELECT
       (SELECT COUNT(*) FROM follows WHERE followed_id = ?1) AS followers,
       (SELECT COUNT(*) FROM follows WHERE follower_id = ?1) AS following,
       (SELECT COUNT(*) FROM posts WHERE author_id = ?1
          AND deleted_at IS NULL AND visibility = 'public') AS posts,
       (SELECT COUNT(*) FROM projects WHERE owner_id = ?1
          AND visibility = 'public') AS projects`,
    userId,
  );
  return rows[0] ?? { followers: 0, following: 0, posts: 0, projects: 0 };
}

/** Skills clustered across public work — the feed's "trending" rail. */
export async function topSkills(
  context: AppLoadContext,
  limit = 4,
): Promise<Array<{ skill_name: string; n: number }>> {
  return many<{ skill_name: string; n: number }>(
    context,
    `SELECT ps.skill_name, COUNT(*) AS n
       FROM project_skills ps
       JOIN projects pr ON pr.id = ps.project_id
       JOIN users u     ON u.id = pr.owner_id
       JOIN profiles p  ON p.user_id = pr.owner_id
      WHERE pr.visibility = 'public' AND u.status = 'active'
        AND p.visibility = 'public'
      GROUP BY ps.skill_name
      ORDER BY n DESC, ps.skill_name
      LIMIT ?1`,
    limit,
  );
}

/* ── 广场：信息流查询 ───────────────────────────────────────────────── */

export interface RepostSource {
  id: string;
  kind: string;
  body: string;
  time_label: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  project_slug: string | null;
  project_title: string | null;
}

export interface FeedPostRow {
  id: string;
  kind: string;
  body: string;
  created_at: number;
  time_label: string;
  author_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  project_id: string | null;
  project_slug: string | null;
  project_title: string | null;
  project_summary: string | null;
  likes: number;
  comments: number;
  reposts: number;
  liked: number;
  bookmarked: number;
  tags: string[];
  /** Non-null when this row is a repost; the original is inlined for display. */
  repost: RepostSource | null;
}

/**
 * One statement per page: counters come from correlated subqueries and the
 * reposted original is joined in, so a 30-row page costs the same number of
 * round trips as a 3-row one. Tags are fetched afterwards for the whole page
 * in a single `IN (...)` query.
 */
const FEED_SELECT = `
  SELECT po.id, po.kind, po.body, po.created_at, po.author_id,
         po.project_id, po.repost_of_id,
         u.handle, p.display_name, p.avatar_url,
         pr.slug AS project_slug, pr.title AS project_title, pr.summary AS project_summary,
         (SELECT COUNT(*) FROM reactions r
           WHERE r.target_type = 'post' AND r.target_id = po.id AND r.type = 'like') AS likes,
         (SELECT COUNT(*) FROM comments c
           WHERE c.post_id = po.id AND c.deleted_at IS NULL) AS comments,
         (SELECT COUNT(*) FROM posts rp
           WHERE rp.repost_of_id = po.id AND rp.deleted_at IS NULL) AS reposts,
         (SELECT COUNT(*) FROM reactions r2
           WHERE r2.target_type = 'post' AND r2.target_id = po.id
             AND r2.type = 'like' AND r2.user_id = ?1) AS liked,
         (SELECT COUNT(*) FROM bookmarks b
           WHERE b.user_id = ?1 AND b.target_type = 'post' AND b.target_id = po.id) AS bookmarked,
         op.id AS r_id, op.kind AS r_kind, op.body AS r_body,
         op.created_at AS r_created_at,
         ou.handle AS r_handle, opf.display_name AS r_display_name,
         opf.avatar_url AS r_avatar_url, opf.visibility AS r_visibility,
         rpr.slug AS r_project_slug, rpr.title AS r_project_title
    FROM posts po
    JOIN users u     ON u.id = po.author_id
    JOIN profiles p  ON p.user_id = po.author_id
    LEFT JOIN projects pr ON pr.id = po.project_id
    LEFT JOIN posts op    ON op.id = po.repost_of_id AND op.deleted_at IS NULL
    LEFT JOIN users ou    ON ou.id = op.author_id
    LEFT JOIN profiles opf ON opf.user_id = op.author_id
    LEFT JOIN projects rpr ON rpr.id = op.project_id
   WHERE po.visibility = 'public' AND po.deleted_at IS NULL AND u.status = 'active'
     AND (p.visibility = 'public' OR po.author_id = ?1)
`;

type RawFeedRow = Omit<FeedPostRow, "time_label" | "tags" | "repost"> & {
  r_id: string | null;
  r_kind: string | null;
  r_body: string | null;
  r_created_at: number | null;
  r_handle: string | null;
  r_display_name: string | null;
  r_avatar_url: string | null;
  r_visibility: string | null;
  r_project_slug: string | null;
  r_project_title: string | null;
};

export async function feedPosts(
  context: AppLoadContext,
  opts: {
    viewerId: string | null;
    scope?: "all" | "following";
    kind?: string;
    tag?: string;
    limit?: number;
  },
): Promise<FeedPostRow[]> {
  const params: unknown[] = [opts.viewerId ?? "·none·"];
  const clauses: string[] = [];
  let i = 2;

  if (opts.kind && opts.kind !== "all") {
    params.push(opts.kind);
    clauses.push(`po.kind = ?${i++}`);
  }
  if (opts.tag) {
    params.push(opts.tag);
    clauses.push(`po.id IN (SELECT post_id FROM post_tags WHERE tag = ?${i++})`);
  }
  if (opts.scope === "following") {
    // ?1 is the viewer, so this only narrows when someone is signed in
    clauses.push(
      `(po.author_id = ?1 OR po.author_id IN (
          SELECT followed_id FROM follows WHERE follower_id = ?1))`,
    );
  }

  params.push(opts.limit ?? 30);
  const where = clauses.length ? ` AND ${clauses.join(" AND ")}` : "";

  const rows = await many<RawFeedRow>(
    context,
    `${FEED_SELECT}${where} ORDER BY po.created_at DESC LIMIT ?${i}`,
    ...params,
  );

  const tags = await tagsForPosts(context, rows.map((r) => r.id));
  return rows.map((r) => ({
    ...r,
    time_label: relativeTime(r.created_at),
    tags: tags.get(r.id) ?? [],
    // a reposted original disappears if its author went private
    repost:
      r.r_id && r.r_body !== null && r.r_visibility !== "private"
        ? {
            id: r.r_id,
            kind: r.r_kind ?? "thought",
            body: r.r_body,
            time_label: relativeTime(r.r_created_at ?? r.created_at),
            handle: r.r_handle ?? "",
            display_name: r.r_display_name ?? "",
            avatar_url: r.r_avatar_url,
            project_slug: r.r_project_slug,
            project_title: r.r_project_title,
          }
        : null,
  }));
}

/** All tags for a set of posts, in one query — never per row. */
export async function tagsForPosts(
  context: AppLoadContext,
  postIds: string[],
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (!postIds.length) return out;

  const placeholders = postIds.map((_, n) => `?${n + 1}`).join(",");
  const rows = await many<{ post_id: string; tag: string }>(
    context,
    `SELECT post_id, tag FROM post_tags WHERE post_id IN (${placeholders})
      ORDER BY tag`,
    ...postIds,
  );
  for (const r of rows) {
    const list = out.get(r.post_id) ?? [];
    list.push(r.tag);
    out.set(r.post_id, list);
  }
  return out;
}

export interface HotTag {
  tag: string;
  n: number;
}

/** Tags ranked by how many public posts carry them. */
export async function hotTags(
  context: AppLoadContext,
  limit = 8,
): Promise<HotTag[]> {
  return many<HotTag>(
    context,
    `SELECT pt.tag, COUNT(*) AS n
       FROM post_tags pt
       JOIN posts po   ON po.id = pt.post_id
       JOIN users u    ON u.id = po.author_id
       JOIN profiles p ON p.user_id = po.author_id
      WHERE po.visibility = 'public' AND po.deleted_at IS NULL
        AND u.status = 'active' AND p.visibility = 'public'
      GROUP BY pt.tag
      ORDER BY n DESC, pt.tag
      LIMIT ?1`,
    limit,
  );
}

 /** The logged-in author's own work, for the composer's project picker. */
export async function projectsForComposer(
  context: AppLoadContext,
  ownerId: string,
  limit = 20,
): Promise<Array<{ id: string; title: string }>> {
  return many<{ id: string; title: string }>(
    context,
    `SELECT id, title FROM projects
      WHERE owner_id = ?1 AND visibility <> 'private'
      ORDER BY created_at DESC LIMIT ?2`,
    ownerId,
    limit,
  );
}

/**
 * Write a post and its tags together. Tags are derived from the body by the
 * caller (see lib/tags.ts) so the same parser feeds the links in the browser.
 */
export async function insertPost(
  context: AppLoadContext,
  input: {
    authorId: string;
    kind: string;
    body: string;
    projectId?: string | null;
    repostOfId?: string | null;
    tags?: string[];
  },
): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const statements = [
    stmt(
      context,
      `INSERT INTO posts
         (id, author_id, kind, body, project_id, repost_of_id, visibility,
          created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'public', ?7, ?7)`,
      id,
      input.authorId,
      input.kind,
      input.body,
      input.projectId ?? null,
      input.repostOfId ?? null,
      now,
    ),
    ...(input.tags ?? []).map((tag) =>
      stmt(
        context,
        `INSERT OR IGNORE INTO post_tags (post_id, tag) VALUES (?1, ?2)`,
        id,
        tag,
      ),
    ),
  ];
  await batch(context, statements);
  return id;
}
````

## File: app/routes/discover-projects.tsx
````typescript
import type { Route } from "./+types/discover-projects";
import { Link, useSearchParams } from "react-router";
import { searchProjects } from "~/lib/queries.server";
import { getMe } from "~/lib/session.server";
import { ProjectCard } from "~/components/cards";
import { PageHead } from "~/components/page-head";

const KINDS = [
  { v: "all", label: "全部" },
  { v: "project", label: "项目" },
  { v: "agent", label: "Agent" },
  { v: "tool", label: "工具" },
  { v: "automation", label: "自动化" },
  { v: "case", label: "案例" },
  { v: "oss", label: "开源" },
];

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || undefined;
  const kind = url.searchParams.get("kind") || "all";
  const sort = url.searchParams.get("sort") || undefined;

  const me = await getMe(context, request);
  const projects = await searchProjects(context, {
    q,
    kind,
    sort,
    limit: 30,
    viewerId: me?.id ?? null,
  });
  return { projects, q: q ?? "", kind, sort: sort ?? "" };
}

export default function DiscoverProjects({ loaderData }: Route.ComponentProps) {
  const { projects, q, kind, sort } = loaderData;
  const [params] = useSearchParams();

  const withParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const s = next.toString();
    return `/discover/projects${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <PageHead
        label="Work"
        title="有人真的把它跑起来了"
        description="项目、Agent、自动化流程。每一条都由作者自己写，链接指向他们愿意公开的地方。"
      />

      <form method="get" className="mt-7 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <input
            name="q"
            defaultValue={q}
            placeholder="搜作品标题或简介"
            className="field !h-[46px] pl-10"
            aria-label="搜索作品"
          />
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-faint)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </span>
        </div>
        <input type="hidden" name="kind" value={kind} />
        {sort && <input type="hidden" name="sort" value={sort} />}
        <button className="btn btn-primary">搜索</button>
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-mono text-[11px] tracking-[0.1em] text-[var(--color-faint)] uppercase">
          类型
        </span>
        {KINDS.map((k) => (
          <Link
            key={k.v}
            to={withParam("kind", k.v === "all" ? "" : k.v)}
            preventScrollReset
            className={`chip transition ${
              kind === k.v
                ? "!bg-[var(--color-ink)] !text-white"
                : "hover:!bg-[var(--color-sunken-deep)]"
            }`}
          >
            {k.label}
          </Link>
        ))}
        <span className="ml-3 mr-1 font-mono text-[11px] tracking-[0.1em] text-[var(--color-faint)] uppercase">
          排序
        </span>
        {[
          { v: "", label: "最新" },
          { v: "likes", label: "赞最多" },
        ].map((s) => (
          <Link
            key={s.v || "new"}
            to={withParam("sort", s.v)}
            preventScrollReset
            className={`chip transition ${
              sort === s.v
                ? "!bg-[var(--color-ink)] !text-white"
                : "hover:!bg-[var(--color-sunken-deep)]"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="mt-8 border-t border-[var(--color-line-soft)]">
        <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-line-soft)] py-2.5">
          <span className="font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
            作品
          </span>
          <span className="font-mono text-[11px] text-[var(--color-faint)] tabular-nums">
            {projects.length} 件
          </span>
        </div>
        {projects.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[16px] font-semibold">还没有这样的作品</p>
            <p className="mt-1.5 text-[13.5px] text-[var(--color-ink-soft)]">
              换个类型或关键词试试。
            </p>
            <Link to="/new/project" className="btn btn-primary btn-sm mt-5">
              上传第一个
            </Link>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-8 pt-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
````

## File: app/routes/profile-projects.tsx
````typescript
import type { Route } from "./+types/profile-projects";
import { Link } from "react-router";
import { getMe, normalizeHandle } from "~/lib/session.server";
import { one } from "~/lib/db.server";
import { ProjectCard } from "~/components/cards";
import { Avatar } from "~/components/media";
import { projectsByOwner } from "~/lib/queries.server";
import { PageHead } from "~/components/page-head";

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const handle = normalizeHandle(params.handle);
  if (!handle) throw new Response("Not Found", { status: 404 });

  const me = await getMe(context, request);
  const user = await one<{
    id: string;
    handle: string;
    display_name: string;
    avatar_url: string | null;
    visibility: string;
  }>(
    context,
    `SELECT u.id, u.handle, p.display_name, p.avatar_url, p.visibility
       FROM users u JOIN profiles p ON p.user_id = u.id
      WHERE u.handle = ?1 AND u.status = 'active'`,
    handle,
  );

  if (!user) throw new Response("Not Found", { status: 404 });
  if (user.visibility === "private" && user.id !== me?.id) {
    throw new Response("Not Found", { status: 404 });
  }

  const projects = await projectsByOwner(context, user.id, me?.id ?? null);
  return { user, projects, isSelf: me?.id === user.id };
}

export default function ProfileProjects({ loaderData }: Route.ComponentProps) {
  const { user, projects, isSelf } = loaderData;

  return (
    <div>
      <Link
        to={`/@${user.handle}`}
        className="inline-flex items-center gap-2.5 transition hover:opacity-80"
      >
        <Avatar name={user.display_name} src={user.avatar_url} size={38} />
        <div>
          <p className="text-[14px] font-medium">{user.display_name}</p>
          <p className="font-mono text-[11px] tracking-wide text-[var(--color-faint)]">
            @{user.handle}
          </p>
        </div>
      </Link>

      <div className="mt-7">
        <PageHead
          label="Work"
          title="全部作品"
          description={`${user.display_name} 公开的 ${projects.length} 件作品。`}
        />
      </div>

      {projects.length === 0 ? (
        <div className="mt-8 border-t border-[var(--color-line-soft)] py-16 text-center">
          <p className="text-[13.5px] text-[var(--color-ink-soft)]">
            这个人还没有公开作品。
          </p>
          {isSelf && (
            <Link to="/new/project" className="btn btn-primary btn-sm mt-4">
              上传第一个
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-x-6 gap-y-8 border-t border-[var(--color-line-soft)] pt-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
````

## File: app/routes/profile.tsx
````typescript
import type { Route } from "./+types/profile";
import { Link } from "react-router";
import { getMe, normalizeHandle } from "~/lib/session.server";
import { many, one } from "~/lib/db.server";
import { Avatar, CoverArt } from "~/components/media";
import { FollowButton, PostCard, ProjectCard } from "~/components/cards";
import { compact } from "~/lib/format";
import { countsForProfile, postsByAuthor, projectsByOwner } from "~/lib/queries.server";
import { SectionTitle } from "~/components/page-head";

const PROVIDER_LABEL: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  huggingface: "Hugging Face",
  website: "个人网站",
  x: "X",
  blog: "博客",
};

const PROVIDER_ICON: Record<string, string> = {
  github: "GH",
  linkedin: "in",
  huggingface: "HF",
  website: "↗",
  x: "X",
  blog: "✎",
};

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const handle = normalizeHandle(params.handle);
  if (!handle) throw new Response("Not Found", { status: 404 });

  const [me, user] = await Promise.all([
    getMe(context, request),
    one<{
      id: string;
      handle: string;
      kind: "individual" | "team";
      display_name: string;
      avatar_url: string | null;
      cover_url: string | null;
      headline: string | null;
      about: string | null;
      location: string | null;
      timezone: string | null;
      visibility: "public" | "private";
      hide_follows: number;
      created_at: number;
    }>(
      context,
      `SELECT u.id, u.handle, u.kind, u.created_at,
              p.display_name, p.avatar_url, p.cover_url, p.headline, p.about,
              p.location, p.timezone, p.visibility, p.hide_follows
         FROM users u JOIN profiles p ON p.user_id = u.id
        WHERE u.handle = ?1 AND u.status = 'active'`,
      handle,
    ),
  ]);

  if (!user) throw new Response("Not Found", { status: 404 });
  if (user.visibility === "private" && user.id !== me?.id) {
    throw new Response("Not Found", { status: 404 });
  }

  const [counts, skills, links, projects, posts, following] = await Promise.all([
    countsForProfile(context, user.id),
    many<{ skill_name: string }>(
      context,
      `SELECT skill_name FROM profile_skills WHERE user_id = ?1 ORDER BY position`,
      user.id,
    ),
    many<{
      id: string;
      provider: string;
      profile_url: string;
      connection: string;
    }>(
      context,
      `SELECT id, provider, profile_url, connection FROM external_accounts
        WHERE user_id = ?1 ORDER BY position`,
      user.id,
    ),
    projectsByOwner(context, user.id, me?.id ?? null),
    postsByAuthor(context, user.id, me?.id ?? null, 12),
    me
      ? one<{ n: number }>(
          context,
          `SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?1 AND followed_id = ?2`,
          me.id,
          user.id,
        )
      : Promise.resolve(null),
  ]);

  return {
    me,
    user,
    counts,
    skills: skills.map((s) => s.skill_name),
    links,
    projects,
    posts,
    isSelf: me?.id === user.id,
    following: Boolean(following?.n),
  };
}

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data?.user) return [{ title: "找不到这个人 — iMFDE" }];
  const u = data.user;
  const desc =
    u.headline ??
    `${u.display_name} 在 iMFDE 上的主页：作品、动态与外部资料。`;
  return [
    { title: `${u.display_name} (@${u.handle}) — iMFDE` },
    { name: "description", content: desc },
    { property: "og:title", content: `${u.display_name} on iMFDE` },
    { property: "og:description", content: desc },
    { property: "og:type", content: "profile" },
  ];
};

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { user, counts, skills, links, projects, posts, isSelf, following } =
    loaderData;
  const featured = projects.filter((p) => p.featured).slice(0, 3);
  const shown = (featured.length ? featured : projects).slice(0, 6);

  return (
    <div className="max-w-[1060px]">
      {/* cover — flat, no frame, same 12px radius as a project cover */}
      <div className="overflow-hidden rounded-[12px]">
        <CoverArt
          seed={`${user.handle}-cover`}
          src={user.cover_url}
          aspect="4 / 1"
          photo={false}
        />
      </div>

      <div className="px-1 sm:px-2">
        <div className="-mt-14 flex items-start gap-4">
          <Avatar
            name={user.display_name}
            src={user.avatar_url}
            size={96}
            ring
          />
          <div className="flex-1 pt-[58px]">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.02em]">
                {user.display_name}
              </h1>
              {user.kind === "team" && (
                <span className="chip chip-outline">团队 / Studio</span>
              )}
            </div>
            <p className="mt-0.5 font-mono text-[12px] tracking-wide text-[var(--color-faint)]">
              @{user.handle}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {isSelf ? (
            <>
              <Link to="/settings/profile" className="btn btn-ghost btn-sm">
                编辑主页
              </Link>
              <Link to="/new/project" className="btn btn-primary btn-sm">
                上传作品
              </Link>
            </>
          ) : (
            <FollowButton targetId={user.id} following={following} />
          )}
          {(user.location || user.timezone) && (
            <span className="text-[12.5px] text-[var(--color-muted)]">
              {[user.location, user.timezone].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>

        {user.headline && (
          <p className="mt-4 max-w-[660px] text-[16px] leading-[1.7] text-[var(--color-ink-2)]">
            {user.headline}
          </p>
        )}



        {/* counts — raw numbers, no synthesis */}
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-[var(--color-line-soft)] py-4">
          <Stat n={counts.projects} label="作品" />
          <Stat n={counts.posts} label="动态" />
          {user.hide_follows ? null : (
            <>
              <Stat n={counts.followers} label="关注者" />
              <Stat n={counts.following} label="关注" />
            </>
          )}
          <span className="ml-auto text-[11.5px] text-[var(--color-faint)]">
            以上均为原始计数，不合成任何评分
          </span>
        </div>

        {/* external accounts — explicitly labelled by source type */}
        {links.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {links.map((l) => (
              <a
                key={l.id}
                href={l.profile_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-[12.5px] transition hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              >
                <span className="font-mono text-[10.5px] font-semibold text-[var(--color-muted)]">
                  {PROVIDER_ICON[l.provider] ?? "↗"}
                </span>
                {PROVIDER_LABEL[l.provider] ?? l.provider}
                <span className="font-mono text-[9.5px] tracking-[0.08em] text-[var(--color-faint)] uppercase">
                  {l.connection === "connected" ? "已连接" : "链接"}
                </span>
              </a>
            ))}
          </div>
        )}

        {user.about && (
          <section className="mt-8">
            <h2 className="mb-2 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
              关于
            </h2>
            <div className="max-w-[660px] whitespace-pre-wrap text-[14.5px] leading-[1.85] text-[var(--color-ink-2)]">
              {user.about}
            </div>
            <p className="mt-2 text-[11.5px] text-[var(--color-faint)]">
              由本人填写。
            </p>
          </section>
        )}

        {skills.length > 0 && (
          <section className="mt-7">
            <h2 className="mb-2.5 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
              方向
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <Link
                  key={s}
                  to={`/discover?skill=${encodeURIComponent(s)}`}
                  className="chip transition hover:!bg-[var(--color-sunken-deep)]"
                >
                  {s}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* projects */}
      <section className="mt-10">
        <SectionTitle
          action={
            projects.length > 6 ? (
              <Link
                to={`/@${user.handle}/projects`}
                className="text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              >
                全部 {projects.length} 个 →
              </Link>
            ) : undefined
          }
        >
          作品
        </SectionTitle>
        {shown.length === 0 ? (
          <div className="border-t border-[var(--color-line-soft)] py-12 text-center">
            <p className="text-[13.5px] text-[var(--color-ink-soft)]">
              这个人还没有公开作品。
            </p>
            {isSelf && (
              <Link to="/new/project" className="btn btn-primary btn-sm mt-4">
                上传第一个
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-8 pt-1 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      {/* posts */}
      {posts.length > 0 && (
        <section className="mt-12">
          <SectionTitle>动态</SectionTitle>
          <div className="border-t border-[var(--color-line-soft)]">
            {posts.slice(0, 6).map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* source legend — the product's trust model, stated plainly */}
      <section className="mt-12 border-t border-[var(--color-line-soft)] pt-6">
        <h2 className="mb-2.5 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
          这个页面上的信息从哪里来
        </h2>
        <dl className="grid gap-2 text-[12.5px] leading-relaxed text-[var(--color-muted)] sm:grid-cols-2">
          <div>
            <dt className="font-medium text-[var(--color-ink)]">本人自述</dt>
            <dd>简介、方向、作品说明。平台不核实。</dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-ink)]">外部链接</dt>
            <dd>GitHub、LinkedIn 等，跳到站外，内容由对方负责。</dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-ink)]">平台行为</dt>
            <dd>发帖、关注、点赞。这些在这里真实发生过。</dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-ink)]">没有的东西</dt>
            <dd>没有信用分，没有等级，没有成交与收入记录。</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="font-mono text-[17px] font-medium text-[var(--color-ink)]">
        {compact(n)}
      </span>
      <span className="text-[12px] text-[var(--color-muted)]">{label}</span>
    </span>
  );
}
````

## File: app/routes/project.tsx
````typescript
import type { Route } from "./+types/project";
import { Link, useFetcher } from "react-router";
import { getMe } from "~/lib/session.server";
import { many, one } from "~/lib/db.server";
import { Avatar, CoverArt } from "~/components/media";
import { FollowButton, HeartIcon } from "~/components/cards";
import { absoluteDate, compact } from "~/lib/format";

const KIND_LABEL: Record<string, string> = {
  project: "项目",
  agent: "Agent",
  tool: "工具",
  automation: "自动化流程",
  case: "案例",
  oss: "开源项目",
};

export async function loader({ request, context, params }: Route.LoaderArgs) {
  // `me` first: the like state below is viewer-dependent, so it cannot be
  // fetched in the same Promise.all as the project row.
  const me = await getMe(context, request);
  const project = await one<{
      id: string;
      owner_id: string;
      slug: string;
      kind: string;
      title: string;
      summary: string;
      description: string | null;
      cover_url: string | null;
      demo_url: string | null;
      docs_url: string | null;
      repo_url: string | null;
      role: string | null;
      stage: string | null;
      access_mode: string | null;
      limitations: string | null;
      visibility: string;
      created_at: number;
      updated_at: number;
      handle: string;
      display_name: string;
      avatar_url: string | null;
      headline: string | null;
      likes: number;
      followers: number;
      liked: number;
      owner_visibility: string;
    }>(
      context,
      `SELECT pr.*, u.handle, p.display_name, p.avatar_url, p.headline,
              p.visibility AS owner_visibility,
              (SELECT COUNT(*) FROM reactions r
                WHERE r.target_type='project' AND r.target_id = pr.id) AS likes,
              (SELECT COUNT(*) FROM follows f WHERE f.followed_id = pr.owner_id) AS followers,
              (SELECT COUNT(*) FROM reactions r3
                WHERE r3.target_type='project' AND r3.target_id = pr.id
                  AND r3.type='like' AND r3.user_id = ?2) AS liked
         FROM projects pr
         JOIN users u ON u.id = pr.owner_id
         JOIN profiles p ON p.user_id = pr.owner_id
        WHERE pr.slug = ?1`,
    params.slug,
    me?.id ?? "·none·",
  );

  if (!project) throw new Response("Not Found", { status: 404 });
  // item-level privacy, then the owner's profile-level privacy
  if (project.visibility === "private" && project.owner_id !== me?.id) {
    throw new Response("Not Found", { status: 404 });
  }
  if (project.owner_visibility === "private" && project.owner_id !== me?.id) {
    throw new Response("Not Found", { status: 404 });
  }

  const [skills, more, following] = await Promise.all([
    many<{ skill_name: string }>(
      context,
      `SELECT skill_name FROM project_skills WHERE project_id = ?1 ORDER BY position`,
      project.id,
    ),
    many<{ id: string; slug: string; title: string; cover_url: string | null; kind: string }>(
      context,
      `SELECT id, slug, title, cover_url, kind FROM projects
        WHERE owner_id = ?1 AND id <> ?2 AND visibility = 'public'
        ORDER BY created_at DESC LIMIT 3`,
      project.owner_id,
      project.id,
    ),
    me
      ? one<{ n: number }>(
          context,
          `SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?1 AND followed_id = ?2`,
          me.id,
          project.owner_id,
        )
      : Promise.resolve(null),
  ]);

  return {
    me,
    project,
    skills: skills.map((s) => s.skill_name),
    more,
    following: Boolean(following?.n),
  };
}

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data?.project) return [{ title: "作品不存在 — iMFDE" }];
  const p = data.project;
  const desc = p.summary.slice(0, 150);
  return [
    { title: `${p.title} — ${p.display_name} · iMFDE` },
    { name: "description", content: desc },
    { property: "og:title", content: p.title },
    { property: "og:description", content: desc },
    { property: "og:type", content: "article" },
  ];
};

export default function Project({ loaderData }: Route.ComponentProps) {
  const { me, project, skills, more, following } = loaderData;
  const fetcher = useFetcher();
  const isOwner = me?.id === project.owner_id;
  const liked = fetcher.formData
    ? fetcher.formData.get("intent") === "like"
    : Boolean(project.liked);
  const likes =
    project.likes + (liked && !project.liked ? 1 : !liked && project.liked ? -1 : 0);

  return (
    <article className="max-w-[1060px]">
      <div className="overflow-hidden rounded-[12px]">
        <CoverArt seed={project.slug} src={project.cover_url} aspect="16 / 9" />
      </div>

      <header className="mt-7 flex flex-wrap items-center gap-2">
        <span className="chip chip-teal">{KIND_LABEL[project.kind] ?? project.kind}</span>
        {project.stage && <span className="chip">{project.stage}</span>}
        {project.access_mode && (
          <span className="chip chip-outline">{project.access_mode}</span>
        )}
      </header>

      <h1 className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.02em]">
        {project.title}
      </h1>
      <p className="mt-3 max-w-[680px] text-[15px] leading-[1.7] text-[var(--color-ink-soft)]">
        {project.summary}
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-3 border-y border-[var(--color-line-soft)] py-4">
        <Link to={`/@${project.handle}`} className="flex items-center gap-2.5">
          <Avatar name={project.display_name} src={project.avatar_url} size={38} />
          <div>
            <p className="text-[14px] font-medium">{project.display_name}</p>
            <p className="font-mono text-[11px] tracking-wide text-[var(--color-faint)]">
              @{project.handle} · {compact(project.followers)} 关注者
            </p>
          </div>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {isOwner ? (
            <Link to={`/projects/${project.slug}/edit`} className="btn btn-ghost btn-sm">
              编辑作品
            </Link>
          ) : me ? (
            <FollowButton targetId={project.owner_id} following={following} />
          ) : null}

          <fetcher.Form method="post" action="/actions/like">
            <input type="hidden" name="intent" value={liked ? "unlike" : "like"} />
            <input type="hidden" name="target_type" value="project" />
            <input type="hidden" name="target_id" value={project.id} />
            <button
              aria-pressed={liked}
              className={`btn btn-ghost btn-sm ${liked ? "!text-[var(--color-ink-soft)]" : ""}`}
            >
              <HeartIcon filled={liked} />
              {likes > 0 ? compact(likes) : "赞"}
            </button>
          </fetcher.Form>
        </div>
      </div>

      {project.description && (
        <section className="mt-8">
          <h2 className="mb-3 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">它是什么</h2>
          <div className="whitespace-pre-wrap text-[15px] leading-[1.85] text-[var(--color-ink-2)]">
            {project.description}
          </div>
        </section>
      )}

      {project.role && (
        <section className="mt-8 rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-sunken)] p-5">
          <h2 className="mb-2 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">我负责的部分</h2>
          <p className="whitespace-pre-wrap text-[14px] leading-[1.8] text-[var(--color-ink-2)]">
            {project.role}
          </p>
          <p className="mt-3 text-[12px] text-[var(--color-faint)]">
            作者自述，未经平台核实。
          </p>
        </section>
      )}

      {project.limitations && (
        <section className="mt-6">
          <h2 className="mb-2 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">限制与前提</h2>
          <p className="whitespace-pre-wrap text-[14px] leading-[1.8] text-[var(--color-muted)]">
            {project.limitations}
          </p>
        </section>
      )}

      {(project.demo_url || project.docs_url || project.repo_url) && (
        <section className="mt-8">
          <h2 className="mb-3 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">外部链接</h2>
          <div className="flex flex-wrap gap-2">
            {project.demo_url && (
              <ExternalLink href={project.demo_url} label="在线 Demo" />
            )}
            {project.docs_url && (
              <ExternalLink href={project.docs_url} label="文档" />
            )}
            {project.repo_url && (
              <ExternalLink href={project.repo_url} label="代码仓库" />
            )}
          </div>
          <p className="mt-3 text-[12px] text-[var(--color-faint)]">
            以上为外部链接，内容与可用性由作者与目标站点负责。
          </p>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">用到的</h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {more.length > 0 && (
        <section className="mt-12 border-t border-[var(--color-line-soft)] pt-8">
          <h2 className="mb-3 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">{project.display_name} 的其他作品</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {more.map((m) => (
              <Link key={m.id} to={`/projects/${m.slug}`} className="group">
                <div className="overflow-hidden rounded-[16px] border border-[var(--color-line)] transition group-hover:border-[#d9dde5]">
                  <CoverArt seed={m.slug} src={m.cover_url} aspect="4 / 3"  />
                </div>
                <p className="mt-2 truncate text-[13.5px] font-medium group-hover:text-[var(--color-ink)]">
                  {m.title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="mt-10 text-[12px] text-[var(--color-faint)]">
        发布于 {absoluteDate(project.created_at)} · 更新于{" "}
        {absoluteDate(project.updated_at)}
      </p>
    </article>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="btn btn-ghost btn-sm"
    >
      {label}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M8 16L16 8M16 8H9M16 8v7" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </a>
  );
}
````

## File: app/routes/settings-profile.tsx
````typescript
import type { Route } from "./+types/settings-profile";
import { data, Form, Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { many, one, stmt, batch } from "~/lib/db.server";
import { cleanUrl, clamp } from "~/lib/validate";
import { Avatar, CoverArt } from "~/components/media";
import { PageHead } from "~/components/page-head";

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await requireMe(context, request);
  const profile = await one<{
    display_name: string;
    avatar_url: string | null;
    cover_url: string | null;
    headline: string | null;
    about: string | null;
    location: string | null;
    timezone: string | null;
    visibility: string;
    hide_follows: number;
  }>(
    context,
    `SELECT display_name, avatar_url, cover_url, headline, about, location,
            timezone, visibility, hide_follows
       FROM profiles WHERE user_id = ?1`,
    me.id,
  );
  const skills = await many<{ skill_name: string }>(
    context,
    `SELECT skill_name FROM profile_skills WHERE user_id = ?1 ORDER BY position`,
    me.id,
  );

  const url = new URL(request.url);
  return {
    me,
    profile,
    skills: skills.map((s) => s.skill_name).join(", "),
    welcome: url.searchParams.get("welcome") === "1",
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();

  const displayName = clamp(String(form.get("display_name") ?? ""), 60);
  if (!displayName) {
    return data({ error: "显示名称不能为空" }, { status: 400 });
  }

  const now = Date.now();
  await batch(context, [
    stmt(
      context,
      `UPDATE profiles SET
         display_name = ?2, headline = ?3, about = ?4, location = ?5,
         timezone = ?6, avatar_url = ?7, cover_url = ?8, visibility = ?9,
         updated_at = ?10
       WHERE user_id = ?1`,
      me.id,
      displayName,
      clamp(String(form.get("headline") ?? ""), 140) || null,
      clamp(String(form.get("about") ?? ""), 4000) || null,
      clamp(String(form.get("location") ?? ""), 80) || null,
      clamp(String(form.get("timezone") ?? ""), 60) || null,
      cleanUrl(String(form.get("avatar_url") ?? "")),
      cleanUrl(String(form.get("cover_url") ?? "")),
      form.get("visibility") === "private" ? "private" : "public",
      now,
    ),
    stmt(context, `DELETE FROM profile_skills WHERE user_id = ?1`, me.id),
  ]);

  const skills = String(form.get("skills") ?? "")
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);

  if (skills.length) {
    await batch(
      context,
      skills.map((s, i) =>
        stmt(
          context,
          `INSERT OR IGNORE INTO profile_skills (user_id, skill_name, position)
           VALUES (?1, ?2, ?3)`,
          me.id,
          s,
          i,
        ),
      ),
    );
  }

  throw redirect(`/@${me.handle}`);
}

export default function SettingsProfile({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { me, profile, skills, welcome } = loaderData;
  const p = profile!;

  return (
    <div className="max-w-[900px]">
      {welcome && (
        <div className="mb-6 rounded-[var(--radius-panel)] border border-[var(--color-ink-soft)] bg-[var(--color-accent-soft)] px-4 py-3.5">
          <p className="text-[13.5px] font-medium text-[#0a6772]">
            主页建好了。接着把它填完整——
          </p>
          <p className="mt-1 text-[12.5px] text-[#0a6772]/80">
            写一句话介绍自己，贴一个作品，再连上 GitHub。三步之后别人就能看懂你是谁。
          </p>
        </div>
      )}

      <PageHead
        label="Settings"
        title="编辑主页"
        description="别人看到的这一页，就是这里填的东西。"
        actions={
          <>
            <Link to={`/@${me.handle}`} className="btn btn-ghost btn-sm">
              看主页
            </Link>
            <Link to="/settings/accounts" className="btn btn-ghost btn-sm">
              外部账号
            </Link>
          </>
        }
      />

      {/* live preview header */}
      <div className="mt-7 overflow-hidden rounded-[12px] border border-[var(--color-line-soft)]">
        <CoverArt
          seed={`${me.handle}-cover`}
          src={p.cover_url}
          aspect="16 / 5"
          photo={false}
        />
        <div className="-mt-9 flex items-end gap-3 px-4 pb-4">
          <Avatar name={p.display_name} src={p.avatar_url} size={64} ring />
          <div className="pb-0.5">
            <p className="text-[15px] font-medium">{p.display_name}</p>
            <p className="font-mono text-[11px] text-[var(--color-faint)]">
              @{me.handle}
            </p>
          </div>
        </div>
      </div>

      <Form method="post" className="mt-8 space-y-5">
        {/* privacy toggle lives here because it is about the page itself */}
        <label className="flex items-center justify-between gap-4 rounded-[var(--radius-field)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3.5">
          <span>
            <span className="block text-[13px] font-medium">主页可见性</span>
            <span className="mt-0.5 block text-[12px] text-[var(--color-muted)]">
              非公开时只有你自己能看到这个页面。
            </span>
          </span>
          <select
            name="visibility"
            defaultValue={p.visibility}
            className="field !h-[38px] !w-[104px] shrink-0"
          >
            <option value="public">公开</option>
            <option value="private">非公开</option>
          </select>
        </label>

        <Field label="显示名称">
          <input
            name="display_name"
            required
            maxLength={60}
            defaultValue={p.display_name}
            className="field"
          />
        </Field>

        <Field label="一句话定位" hint="会显示在主页最上方和搜索结果里">
          <input
            name="headline"
            maxLength={140}
            defaultValue={p.headline ?? ""}
            placeholder="比如：把企业系统接到大模型上的 FDE，专做语音与工单"
            className="field"
          />
        </Field>

        <Field label="关于">
          <textarea
            name="about"
            rows={6}
            maxLength={4000}
            defaultValue={p.about ?? ""}
            placeholder="你的背景、擅长的场景、怎么工作。写成给同行和潜在客户看的样子。"
            className="field field-area !min-h-[140px]"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="所在地">
            <input
              name="location"
              maxLength={80}
              defaultValue={p.location ?? ""}
              placeholder="上海"
              className="field"
            />
          </Field>
          <Field label="时区">
            <input
              name="timezone"
              maxLength={60}
              defaultValue={p.timezone ?? ""}
              placeholder="UTC+8"
              className="field"
            />
          </Field>
        </div>

        <Field label="方向标签" hint="逗号分隔，最多 12 个">
          <input
            name="skills"
            defaultValue={skills}
            placeholder="Agent 编排, RAG, 语音转写, 私有部署"
            className="field"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="头像 URL" hint="留空则用名称首字">
            <input
              name="avatar_url"
              defaultValue={p.avatar_url ?? ""}
              placeholder="https://…"
              className="field"
            />
          </Field>
          <Field label="封面 URL" hint="留空则生成配色封面">
            <input
              name="cover_url"
              defaultValue={p.cover_url ?? ""}
              placeholder="https://…"
              className="field"
            />
          </Field>
        </div>

        {actionData?.error && (
          <p className="text-[12.5px] text-[#c0392b]">{actionData.error}</p>
        )}

        <div className="flex items-center justify-between pt-2">
          <Link
            to="/settings/privacy"
            className="text-[12.5px] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            隐私设置 →
          </Link>
          <button className="btn btn-primary">保存</button>
        </div>
      </Form>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex flex-wrap items-baseline gap-2">
        <span className="text-[12.5px] font-medium">{label}</span>
        {hint && <span className="text-[11.5px] text-[var(--color-faint)]">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
````

## File: app/components/cards.tsx
````typescript
import { Link, useFetcher } from "react-router";
import { Avatar, CoverArt } from "./media";
import { compact } from "~/lib/format";
import { extractTags } from "~/lib/tags";
import type {
  FeedPostRow,
  PersonRow,
  PostCardRow,
  ProjectCardRow,
} from "~/lib/queries.server";
import { PostBody, TagLinks } from "./post-body";

const KIND_LABEL: Record<string, string> = {
  project: "项目",
  agent: "Agent",
  tool: "工具",
  automation: "自动化",
  case: "案例",
  oss: "开源",
};

const POST_KIND_LABEL: Record<string, string> = {
  show: "Show Work",
  build: "Build in Public",
  thought: "Thoughts",
  discussion: "Discussion",
};

export function ProjectCard({
  project,
  variant = "grid",
}: {
  project: ProjectCardRow;
  variant?: "grid" | "row";
}) {
  const href = `/projects/${project.slug}`;

  if (variant === "row") {
    return (
      <Link
        to={href}
        className="group flex items-center gap-3 rounded-[10px] px-2 py-2.5 transition hover:bg-[var(--color-paper)]"
      >
        <span className="w-[52px] shrink-0 overflow-hidden rounded-[8px]">
          <CoverArt seed={project.slug} src={project.cover_url} aspect="1 / 1" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-semibold group-hover:underline">
            {project.title}
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-[var(--color-ink-soft)]">
            {project.summary}
          </span>
          <span className="mt-1 flex items-center gap-2 text-[12px] text-[var(--color-faint)]">
            <span>{project.display_name}</span>
            <span>·</span>
            <span>{KIND_LABEL[project.kind] ?? project.kind}</span>
            <span className="ml-auto flex items-center gap-1">
              <HeartIcon />
              {compact(project.likes)}
            </span>
          </span>
        </span>
      </Link>
    );
  }

  return (
    <article className="group">
      <Link to={href} className="block">
        <div className="overflow-hidden rounded-[12px]">
          <CoverArt seed={project.slug} src={project.cover_url} aspect="4 / 3" />
        </div>
      </Link>
      <Link to={href} className="mt-2.5 block">
        <h3 className="truncate text-[15px] font-semibold group-hover:underline">
          {project.title}
        </h3>
      </Link>
      <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">
        {project.summary}
      </p>
      <div className="mt-2 flex items-center gap-2 text-[12.5px] text-[var(--color-faint)]">
        <Link
          to={`/@${project.handle}`}
          className="flex min-w-0 items-center gap-1.5 hover:text-[var(--color-ink)]"
        >
          <Avatar name={project.display_name} src={project.avatar_url} size={20} />
          <span className="truncate">{project.display_name}</span>
        </Link>
        <span>·</span>
        <span className="shrink-0">{KIND_LABEL[project.kind] ?? project.kind}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          <HeartIcon />
          {compact(project.likes)}
        </span>
      </div>
    </article>
  );
}

export function PersonCard({ person }: { person: PersonRow }) {
  return (
    <Link
      to={`/@${person.handle}`}
      className="group flex items-center gap-3 px-1 py-3.5 transition hover:bg-[var(--color-paper)]"
    >
      <Avatar name={person.display_name} src={person.avatar_url} size={46} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[15px] font-semibold group-hover:underline">
            {person.display_name}
          </p>
          {person.kind === "team" && (
            <span className="chip chip-outline !h-[19px] !px-1.5 !text-[10.5px]">
              团队
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[13.5px] text-[var(--color-ink-soft)]">
          {person.headline || `@${person.handle}`}
        </p>
        <p className="mt-1 flex items-center gap-2.5 font-mono text-[11.5px] tracking-wide text-[var(--color-faint)]">
          <span>{person.projects} 作品</span>
          <span>{compact(person.followers)} 关注者</span>
        </p>
      </div>
    </Link>
  );
}

export function PostCard({
  post,
  showActions = true,
}: {
  post: PostCardRow;
  showActions?: boolean;
}) {
  const likeFetcher = useFetcher();
  const liked = likeFetcher.formData
    ? likeFetcher.formData.get("intent") === "like"
    : Boolean(post.liked);
  const likeCount = likeFetcher.formData
    ? post.likes + (liked && !post.liked ? 1 : !liked && post.liked ? -1 : 0)
    : post.likes;

  return (
    <article className="border-b border-[var(--color-line-soft)] px-1 py-4 last:border-b-0">
      <header className="flex items-center gap-2.5">
        <Link to={`/@${post.handle}`}>
          <Avatar
            name={post.display_name}
            src={post.avatar_url}
            size={36}
          />
        </Link>
        <div className="min-w-0">
          <Link
            to={`/@${post.handle}`}
            className="block truncate text-[15px] font-semibold hover:opacity-70"
          >
            {post.display_name}
          </Link>
          <p className="font-mono text-[11.5px] tracking-wide text-[var(--color-faint)]">
            @{post.handle} · {post.time_label}
          </p>
        </div>
        <span className="chip chip-dark ml-auto shrink-0 !h-[24px] !text-[11px]">
          {POST_KIND_LABEL[post.kind] ?? post.kind}
        </span>
      </header>

      <Link to={`/posts/${post.id}`} className="mt-2 block">
        <p className="whitespace-pre-wrap text-[15px] leading-[1.55] text-[var(--color-ink)]">
          {post.body}
        </p>
      </Link>

      {post.project_slug ? (
        <Link
          to={`/projects/${post.project_slug}`}
          className="mt-3 flex items-center gap-2 rounded-[var(--radius-field)] border border-[var(--color-line)] bg-[var(--color-sunken)] px-3 py-2.5 text-[12.5px] text-[var(--color-ink-soft)] transition hover:border-[var(--color-ink-soft)]"
        >
          <span className="chip !h-[22px] !text-[10.5px]">作品</span>
          <span className="truncate">{post.project_title}</span>
          <span className="ml-auto shrink-0 text-[var(--color-faint)]">→</span>
        </Link>
      ) : null}

      {showActions ? (
        <footer className="mt-3.5 flex items-center gap-1 text-[13px] text-[var(--color-muted)]">
          <likeFetcher.Form method="post" action="/actions/like">
            <input type="hidden" name="target_type" value="post" />
            <input type="hidden" name="target_id" value={post.id} />
            <input
              type="hidden"
              name="intent"
              value={liked ? "unlike" : "like"}
            />
            <button
              className={`flex items-center gap-1.5 flex items-center gap-1.5 rounded-full transition hover:text-[var(--color-ink)] ${
                liked ? "text-[var(--color-ink)]" : ""
              }`}
              aria-pressed={liked}
            >
              <HeartIcon filled={liked} />
              {likeCount > 0 ? compact(likeCount) : "赞"}
            </button>
          </likeFetcher.Form>

          <Link
            to={`/posts/${post.id}`}
            className="flex items-center gap-1.5 flex items-center gap-1.5 rounded-full transition hover:text-[var(--color-ink)]"
          >
            <CommentIcon />
            {post.comments > 0 ? compact(post.comments) : "评论"}
          </Link>
        </footer>
      ) : null}
    </article>
  );
}

export function FollowButton({
  targetId,
  following,
}: {
  targetId: string;
  following: boolean;
}) {
  const fetcher = useFetcher();
  const isFollowing = fetcher.formData
    ? fetcher.formData.get("intent") === "follow"
    : following;

  return (
    <fetcher.Form method="post" action="/actions/follow">
      <input type="hidden" name="target_id" value={targetId} />
      <input
        type="hidden"
        name="intent"
        value={isFollowing ? "unfollow" : "follow"}
      />
      <button
        className={`btn btn-sm ${isFollowing ? "btn-ghost" : "btn-primary"}`}
      >
        {isFollowing ? "已关注" : "关注"}
      </button>
    </fetcher.Form>
  );
}

/**
 * The full post row used by /feed: tags as links, the reposted original inlined,
 * the attached work previewed, and four actions. Likes and bookmarks are
 * optimistic through fetchers; the loader revalidates afterwards so the stored
 * state wins.
 */
export function FeedCard({
  post,
  signedIn = true,
}: {
  post: FeedPostRow;
  signedIn?: boolean;
}) {
  const likeFetcher = useFetcher();
  const likeIntent = likeFetcher.formData?.get("intent");
  const liked = likeIntent ? likeIntent === "like" : Boolean(post.liked);
  const likeCount =
    likeIntent === "like" && !post.liked
      ? post.likes + 1
      : likeIntent === "unlike" && post.liked
        ? post.likes - 1
        : post.likes;

  const bookmarkFetcher = useFetcher();
  const bookmarkIntent = bookmarkFetcher.formData?.get("intent");
  const bookmarked = bookmarkIntent
    ? bookmarkIntent === "bookmark"
    : Boolean(post.bookmarked);

  const repostFetcher = useFetcher();
  const reposting = repostFetcher.state !== "idle";
  const repostCount = post.reposts + (repostFetcher.data ? 1 : 0);

  return (
    <article className="border-b border-[var(--color-line-soft)] px-1 py-4 last:border-b-0">
      {post.repost && (
        <p className="mb-2 flex items-center gap-1.5 text-[12px] text-[var(--color-faint)]">
          <RepostIcon />
          转发了 @{post.repost.handle} 的动态
        </p>
      )}

      <header className="flex items-center gap-2.5">
        <Link to={`/@${post.handle}`}>
          <Avatar name={post.display_name} src={post.avatar_url} size={36} />
        </Link>
        <div className="min-w-0">
          <Link
            to={`/@${post.handle}`}
            className="block truncate text-[15px] font-semibold hover:opacity-70"
          >
            {post.display_name}
          </Link>
          <p className="font-mono text-[11.5px] tracking-wide text-[var(--color-faint)]">
            @{post.handle} · {post.time_label}
          </p>
        </div>
        <span className="chip chip-dark ml-auto shrink-0 !h-[24px] !text-[11px]">
          {POST_KIND_LABEL[post.kind] ?? post.kind}
        </span>
      </header>

      {post.body.trim() !== "" && (
        // not wrapped in a Link: the body itself contains #tag links, and an
        // anchor inside an anchor makes the HTML parser split the tree
        <PostBody
          body={post.body}
          className="mt-2 text-[15px] leading-[1.55] text-[var(--color-ink)]"
        />
      )}

      {post.repost && (
        <div className="mt-3 rounded-[12px] border border-[var(--color-line)] p-3">
          <div className="flex items-center gap-2">
            <Avatar
              name={post.repost.display_name}
              src={post.repost.avatar_url}
              size={22}
            />
            <Link
              to={`/@${post.repost.handle}`}
              className="text-[13px] font-semibold hover:opacity-70"
            >
              {post.repost.display_name}
            </Link>
            <span className="font-mono text-[11px] text-[var(--color-faint)]">
              @{post.repost.handle} · {post.repost.time_label}
            </span>
          </div>
          <PostBody
            body={post.repost.body}
            className="mt-1.5 text-[13.5px] leading-[1.6] text-[var(--color-ink-soft)]"
          />
          {post.repost.project_slug && (
            <Link
              to={`/projects/${post.repost.project_slug}`}
              className="mt-2 block text-[12px] text-[var(--color-faint)] hover:text-[var(--color-ink)]"
            >
              作品：{post.repost.project_title}
            </Link>
          )}
        </div>
      )}

      {(() => {
        // a tag already in the text is already a link there; chips are only
        // needed for tags that never appear in the body (e.g. auto-tagged
        // posts created together with a project)
        const inline = new Set(extractTags(post.body).map((t) => t.toLowerCase()));
        const extra = post.tags.filter((t) => !inline.has(t.toLowerCase()));
        return extra.length ? <TagLinks tags={extra} className="mt-2.5" /> : null;
      })()}

      {post.project_slug ? (
        <Link
          to={`/projects/${post.project_slug}`}
          className="mt-3 flex items-center gap-2.5 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-sunken)] px-3 py-2.5 transition hover:border-[var(--color-ink-soft)]"
        >
          <span className="h-[34px] w-[34px] shrink-0 overflow-hidden rounded-[6px]">
            <CoverArt seed={post.project_slug} aspect="1 / 1" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold">
              {post.project_title}
            </span>
            <span className="block truncate text-[12px] text-[var(--color-ink-soft)]">
              {post.project_summary}
            </span>
          </span>
        </Link>
      ) : null}

      <footer className="mt-3.5 flex items-center gap-1 text-[13px] text-[var(--color-muted)]">
        <likeFetcher.Form method="post" action="/actions/like">
          <input type="hidden" name="target_type" value="post" />
          <input type="hidden" name="target_id" value={post.id} />
          <input type="hidden" name="intent" value={liked ? "unlike" : "like"} />
          <button
            aria-pressed={liked}
            aria-label={liked ? "取消赞" : "赞"}
            className={`flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:text-[var(--color-ink)] ${
              liked ? "text-[var(--color-ink)]" : ""
            }`}
          >
            <HeartIcon filled={liked} />
            {likeCount > 0 ? compact(likeCount) : ""}
          </button>
        </likeFetcher.Form>

        <Link
          to={`/posts/${post.id}`}
          aria-label="评论"
          className="flex items-center gap-1.5 rounded-full transition hover:text-[var(--color-ink)]"
        >
          <CommentIcon />
          {post.comments > 0 ? compact(post.comments) : ""}
        </Link>

        {signedIn && (
          <>
            <details className="group relative">
              <summary
                className="flex cursor-pointer list-none items-center gap-1.5 rounded-full transition hover:text-[var(--color-ink)]"
                aria-label="转发"
              >
                <RepostIcon />
                {repostCount > 0 ? compact(repostCount) : ""}
              </summary>
              <repostFetcher.Form
                method="post"
                action="/actions/repost"
                className="mt-2 space-y-2 rounded-[10px] border border-[var(--color-line)] p-2.5"
              >
                <input type="hidden" name="post_id" value={post.id} />
                <textarea
                  name="body"
                  rows={2}
                  maxLength={2000}
                  placeholder="加一句你的看法，或留空直接转发"
                  className="field field-area !min-h-[64px] !text-[13px]"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    name="intent"
                    value="repost"
                    disabled={reposting}
                    className="btn btn-primary btn-sm"
                  >
                    转发
                  </button>
                </div>
              </repostFetcher.Form>
            </details>

            <bookmarkFetcher.Form method="post" action="/actions/bookmark">
              <input type="hidden" name="target_type" value="post" />
              <input type="hidden" name="target_id" value={post.id} />
              <input
                type="hidden"
                name="intent"
                value={bookmarked ? "unbookmark" : "bookmark"}
              />
              <button
                aria-pressed={bookmarked}
                aria-label={bookmarked ? "取消收藏" : "收藏"}
                className={`flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:text-[var(--color-ink)] ${
                  bookmarked ? "text-[var(--color-ink)]" : ""
                }`}
              >
                <BookmarkIcon filled={bookmarked} />
              </button>
            </bookmarkFetcher.Form>
          </>
        )}
      </footer>
    </article>
  );
}

function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M7.2 3.8h9.6a1.2 1.2 0 011.2 1.2v15.9a.6.6 0 01-.94.5L12 17.1l-5.06 4.3a.6.6 0 01-.94-.5V5a1.2 1.2 0 011.2-1.2z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RepostIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M16.6 3.2l3.4 3.4-3.4 3.4M20 6.6H8.2a3.6 3.6 0 00-3.6 3.6v1.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.4 20.8L4 17.4l3.4-3.4M4 17.4h11.8a3.6 3.6 0 003.6-3.6v-1.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


export function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M12 20.3l-1.3-1.2C6.4 15.3 3.5 12.7 3.5 9.4 3.5 6.7 5.6 4.6 8.3 4.6c1.5 0 3 .7 3.7 1.9.8-1.2 2.3-1.9 3.8-1.9 2.7 0 4.8 2.1 4.8 4.8 0 3.3-2.9 5.9-7.2 9.7L12 20.3z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 12.2c0 3.7-3.6 6.7-8 6.7-1 0-2-.1-2.9-.4L5 20l.9-3.2C4.4 15.5 3.5 13.9 3.5 12.2c0-3.7 3.6-6.7 8-6.7s8.5 3 8.5 6.7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
````

## File: app/routes/post.tsx
````typescript
import type { Route } from "./+types/post";
import { Form, Link, useFetcher } from "react-router";
import { getMe } from "~/lib/session.server";
import { many, one } from "~/lib/db.server";
import { Avatar } from "~/components/media";
import { HeartIcon } from "~/components/cards";
import { absoluteDate, compact, relativeTime } from "~/lib/format";
import { PostBody } from "~/components/post-body";

const KIND_LABEL: Record<string, string> = {
  show: "Show Work",
  build: "Build in Public",
  thought: "Thoughts",
  discussion: "Discussion",
};

interface PostDetail {
  id: string;
  kind: string;
  body: string;
  created_at: number;
  author_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  headline: string | null;
  project_slug: string | null;
  project_title: string | null;
  likes: number;
  visibility: string;
  author_visibility: string;
  repost_of_id: string | null;
  r_body: string | null;
  r_handle: string | null;
  r_display_name: string | null;
  r_avatar_url: string | null;
  r_created_at: number | null;
  r_project_slug: string | null;
  r_project_title: string | null;
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const me = await getMe(context, request);

  const post = await one<PostDetail>(
    context,
    `SELECT po.id, po.kind, po.body, po.created_at, po.author_id,
            u.handle, p.display_name, p.avatar_url, p.headline,
            p.visibility AS author_visibility,
            pr.slug AS project_slug, pr.title AS project_title,
            (SELECT COUNT(*) FROM reactions r
              WHERE r.target_type='post' AND r.target_id = po.id AND r.type='like') AS likes,
            po.repost_of_id,
            op.body AS r_body, op.created_at AS r_created_at,
            ou.handle AS r_handle, opf.display_name AS r_display_name,
            opf.avatar_url AS r_avatar_url,
            rpr.slug AS r_project_slug, rpr.title AS r_project_title
       FROM posts po
       JOIN users u ON u.id = po.author_id
       JOIN profiles p ON p.user_id = po.author_id
       LEFT JOIN projects pr ON pr.id = po.project_id
       LEFT JOIN posts op    ON op.id = po.repost_of_id AND op.deleted_at IS NULL
       LEFT JOIN users ou    ON ou.id = op.author_id
       LEFT JOIN profiles opf ON opf.user_id = op.author_id
       LEFT JOIN projects rpr ON rpr.id = op.project_id
      WHERE po.id = ?1 AND po.deleted_at IS NULL`,
    params.id,
  );

  if (!post) throw new Response("Not Found", { status: 404 });
  if (post.visibility === "private" && post.author_id !== me?.id) {
    throw new Response("Not Found", { status: 404 });
  }
  if (post.author_visibility === "private" && post.author_id !== me?.id) {
    throw new Response("Not Found", { status: 404 });
  }

  const comments = await many<{
    id: string;
    body: string;
    created_at: number;
    author_id: string;
    handle: string;
    display_name: string;
    avatar_url: string | null;
  }>(
    context,
    `SELECT c.id, c.body, c.created_at, c.author_id,
            u.handle, p.display_name, p.avatar_url
       FROM comments c
       JOIN users u ON u.id = c.author_id
       JOIN profiles p ON p.user_id = c.author_id
      WHERE c.post_id = ?1 AND c.deleted_at IS NULL
      ORDER BY c.created_at ASC`,
    post.id,
  );

  const liked = me
    ? await one<{ n: number }>(
        context,
        `SELECT COUNT(*) AS n FROM reactions
          WHERE user_id = ?1 AND target_type='post' AND target_id = ?2 AND type='like'`,
        me.id,
        post.id,
      )
    : null;

  return {
    me,
    post: { ...post, time_label: relativeTime(post.created_at) },
    comments: comments.map((c) => ({ ...c, time_label: relativeTime(c.created_at) })),
    liked: Boolean(liked?.n),
  };
}

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data?.post) return [{ title: "动态不存在 — iMFDE" }];
  const body = (data.post.body.trim() || data.post.r_body || "").slice(0, 150);
  return [
    { title: `${data.post.display_name}：${data.post.body.slice(0, 40)} — iMFDE` },
    { name: "description", content: body },
    { property: "og:title", content: `${data.post.display_name} on iMFDE` },
    { property: "og:description", content: body },
    { property: "og:type", content: "article" },
  ];
};

export default function Post({ loaderData }: Route.ComponentProps) {
  const { me, post, comments, liked } = loaderData;
  const likeFetcher = useFetcher();
  const isLiked = likeFetcher.formData
    ? likeFetcher.formData.get("intent") === "like"
    : liked;

  return (
    <article className="max-w-[760px]">
      <div className="flex items-center gap-3">
        <Link
          to={`/@${post.handle}`}
          className="flex min-w-0 items-center gap-3 transition hover:opacity-80"
        >
          <Avatar name={post.display_name} src={post.avatar_url} size={44} />
          <div>
            <p className="text-[15px] font-medium">{post.display_name}</p>
            <p className="font-mono text-[11.5px] tracking-wide text-[var(--color-faint)]">
              @{post.handle} · {post.time_label}
            </p>
          </div>
        </Link>
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          <span className="chip chip-teal !h-[26px]">
            {KIND_LABEL[post.kind] ?? post.kind}
          </span>
          {me?.id === post.author_id && (
            <Link
              to={`/posts/${post.id}/edit`}
              className="chip !h-[26px] hover:!bg-[var(--color-sunken-deep)]"
            >
              编辑
            </Link>
          )}
        </span>
      </div>

      {post.body.trim() !== "" && (
        <PostBody
          body={post.body}
          className="mt-5 text-[17px] leading-[1.8] text-[var(--color-ink)]"
        />
      )}

      {post.repost_of_id && post.r_body !== null && (
        <div className="mt-4 rounded-[12px] border border-[var(--color-line)] p-4">
          <div className="flex items-center gap-2">
            <Avatar name={post.r_display_name ?? "?"} src={post.r_avatar_url} size={24} />
            <Link
              to={`/@${post.r_handle}`}
              className="text-[13.5px] font-semibold hover:opacity-70"
            >
              {post.r_display_name}
            </Link>
            <span className="font-mono text-[11px] text-[var(--color-faint)]">
              @{post.r_handle} · {relativeTime(post.r_created_at ?? post.created_at)}
            </span>
          </div>
          <PostBody
            body={post.r_body}
            className="mt-2 text-[14.5px] leading-[1.65] text-[var(--color-ink-soft)]"
          />
          {post.r_project_slug && (
            <Link
              to={`/projects/${post.r_project_slug}`}
              className="mt-2 block text-[12.5px] text-[var(--color-faint)] hover:text-[var(--color-ink)]"
            >
              作品：{post.r_project_title}
            </Link>
          )}
        </div>
      )}

      {post.project_slug && (
        <Link
          to={`/projects/${post.project_slug}`}
          className="mt-5 flex items-center gap-2.5 rounded-[var(--radius-field)] border border-[var(--color-line)] bg-[var(--color-sunken)] px-4 py-3 text-[13.5px] transition hover:border-[var(--color-ink-soft)]"
        >
          <span className="chip !h-[22px] !text-[10.5px]">作品</span>
          <span className="truncate">{post.project_title}</span>
          <span className="ml-auto shrink-0 text-[var(--color-faint)]">→</span>
        </Link>
      )}

      <div className="mt-6 flex items-center gap-1 border-y border-[var(--color-line-soft)] py-2.5">
        <likeFetcher.Form method="post" action="/actions/like">
          <input type="hidden" name="target_type" value="post" />
          <input type="hidden" name="target_id" value={post.id} />
          <input type="hidden" name="intent" value={isLiked ? "unlike" : "like"} />
          <button
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] transition hover:bg-[var(--color-sunken)] ${
              isLiked ? "text-[var(--color-ink-soft)]" : "text-[var(--color-muted)]"
            }`}
          >
            <HeartIcon filled={isLiked} />
            {post.likes > 0 ? compact(post.likes) : "赞"}
          </button>
        </likeFetcher.Form>
        <span className="text-[13px] text-[var(--color-muted)]">
          {comments.length} 条评论
        </span>
        <p className="ml-auto text-[12px] text-[var(--color-faint)]">
          {absoluteDate(post.created_at)}
        </p>
      </div>

      <section id="comments" className="mt-6">
        {comments.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-[var(--color-muted)]">
            还没有评论。
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Link to={`/@${c.handle}`} className="shrink-0">
                  <Avatar name={c.display_name} src={c.avatar_url} size={32} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[12.5px]">
                    <Link
                      to={`/@${c.handle}`}
                      className="font-medium hover:text-[var(--color-ink)]"
                    >
                      {c.display_name}
                    </Link>
                    <span className="font-mono text-[10.5px] text-[var(--color-faint)]">
                      {c.time_label}
                    </span>
                    {me?.id === c.author_id && (
                      <Form method="post" action="/actions/comment">
                        <input type="hidden" name="post_id" value={post.id} />
                        <input type="hidden" name="comment_id" value={c.id} />
                        <input type="hidden" name="intent" value="delete" />
                        <button className="text-[11.5px] text-[var(--color-faint)] hover:text-[var(--color-ink)]">
                          删除
                        </button>
                      </Form>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[14px] leading-[1.75] text-[var(--color-ink-2)]">
                    {c.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {me ? (
          <form method="post" action="/actions/comment" className="mt-6">
            <input type="hidden" name="post_id" value={post.id} />
            <textarea
              name="body"
              required
              maxLength={2000}
              placeholder="说说你的看法……"
              className="field field-area !min-h-[96px]"
            />
            <div className="mt-2 flex justify-end">
              <button className="btn btn-primary btn-sm">评论</button>
            </div>
          </form>
        ) : (
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--color-line-soft)] pt-5">
            <p className="text-[13.5px] text-[var(--color-ink-soft)]">
              登录后可以参与讨论。
            </p>
            <Link to="/login" className="btn btn-primary btn-sm shrink-0">
              登录
            </Link>
          </div>
        )}
      </section>
    </article>
  );
}
````

## File: app/routes/home.tsx
````typescript
import type { Route } from "./+types/home";
import { Link } from "react-router";
import { getMe } from "~/lib/session.server";
import {
  featuredPeople,
  latestPosts,
  latestProjects,
  recommendedPeople,
  topSkills,
  countsForProfile,
} from "~/lib/queries.server";
import { PersonCard, PostCard, ProjectCard } from "~/components/cards";
import { Avatar, CoverArt } from "~/components/media";

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await getMe(context, request);

  const projects = await latestProjects(context, me?.id ?? null, 8);
  const people = await featuredPeople(context, 6);

  if (!me) {
    return {
      me: null,
      projects,
      people,
      posts: await latestPosts(context, null, 5),
      recommended: [],
    };
  }

  return {
    me,
    projects,
    people,
    posts: await latestPosts(context, me.id, 5),
    recommended: await recommendedPeople(context, me.id, 4),
    skills: await topSkills(context, 4),
    stats: await countsForProfile(context, me.id),
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { me, projects, people, posts, recommended, skills, stats } = loaderData;

  if (!me) return <Landing projects={projects} people={people} posts={posts} />;

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_308px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
              个人仪表盘
            </p>
            <h1 className="mt-1.5 text-[34px] font-semibold leading-tight tracking-[-0.02em]">
              欢迎，{me.display_name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/new/project" className="btn btn-primary btn-sm !h-[40px]">
              上传作品
            </Link>
            <Link to={`/@${me.handle}`} className="btn btn-ghost btn-sm !h-[40px]">
              看我的主页
            </Link>
          </div>
        </div>

        {/* 4-up metric strip: one ruled box, hairline dividers */}
        <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-[var(--color-line-soft)] sm:grid-cols-4">
          {[
            { k: "作品", v: String(stats.projects) },
            { k: "动态", v: String(stats.posts) },
            { k: "关注者", v: String(stats.followers) },
            { k: "关注", v: String(stats.following) },
          ].map((m) => (
            <div key={m.k} className="bg-white px-4 py-4">
              <p className="text-[13px] text-[var(--color-ink-soft)]">{m.k}</p>
              <p className="mt-1 text-[26px] font-medium leading-none tracking-[-0.01em]">
                {m.v}
              </p>
            </div>
          ))}
        </div>

        <Link
          to="/new/post"
          className="mt-6 flex items-center gap-3 rounded-[12px] border border-[var(--color-line)] bg-white px-4 py-3 transition hover:border-[var(--color-ink-soft)]"
        >
          <Avatar name={me.display_name} src={me.avatar_url} size={34} />
          <span className="flex-1 text-[16px] text-[var(--color-faint)]">
            你在做什么，{me.display_name}？
          </span>
          <span className="btn btn-primary btn-sm !h-[34px] shrink-0">发布</span>
        </Link>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[20px] font-semibold tracking-[-0.01em]">最新现场动态</h2>
            <Link
              to="/feed"
              className="text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              进入广场 →
            </Link>
          </div>

          {posts.length === 0 ? (
            <EmptyFeed />
          ) : (
            <div className="border-t border-[var(--color-line-soft)]">
              <div className="divide-y divide-[var(--color-line-soft)]">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
              <Link
                to="/feed"
                className="mt-2 flex items-center justify-center rounded-[10px] border border-[var(--color-line-soft)] py-2.5 text-[13px] text-[var(--color-ink-soft)] transition hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              >
                进入广场，看全部动态
              </Link>
            </div>
          )}
        </div>
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-6 space-y-7">
          {skills.length > 0 && (
            <div>
              <p className="mb-2.5 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
                热门方向 ↗
              </p>
              <div className="space-y-3">
                {skills.map((s) => (
                  <Link
                    key={s.skill_name}
                    to={`/discover?skill=${encodeURIComponent(s.skill_name)}`}
                    className="block"
                  >
                    <p className="text-[15px] font-medium hover:opacity-70">
                      <span className="text-[var(--color-faint)]">#</span>{" "}
                      {s.skill_name}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">
                      {s.n} 个作品用到
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <p className="mb-2.5 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
                最近的作品
              </p>
              <div className="space-y-2">
                {projects.slice(0, 3).map((pr) => (
                  <Link
                    key={pr.id}
                    to={`/projects/${pr.slug}`}
                    className="flex items-center gap-2.5 py-1.5 transition hover:opacity-70"
                  >
                    <span className="w-[42px] shrink-0 overflow-hidden rounded-[8px]">
                      <CoverArt seed={pr.slug} src={pr.cover_url} aspect="1 / 1" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium">
                        {pr.title}
                      </span>
                      <span className="block truncate text-[12.5px] text-[var(--color-ink-soft)]">
                        {pr.display_name}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {recommended.length > 0 && (
            <div>
              <p className="mb-2.5 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
                可以关注的 FDE
              </p>
              <div className="space-y-1">
                {recommended.map((p) => (
                  <PersonCard key={p.id} person={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}


function EmptyFeed() {
  return (
    <div className="border-t border-[var(--color-line-soft)] py-16 text-center">
      <p className="text-[16px] font-semibold">广场还没有动态</p>
      <p className="mx-auto mt-1.5 max-w-[380px] text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">
        第一个发帖的人会出现在这里。也可以先去广场看看别人在做什么。
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Link to="/feed" className="btn btn-ghost btn-sm">
          去广场
        </Link>
        <Link to="/new/post" className="btn btn-primary btn-sm">
          我发第一条
        </Link>
      </div>
    </div>
  );
}

function Landing({
  projects,
  people,
  posts,
}: {
  projects: Awaited<ReturnType<typeof latestProjects>>;
  people: Awaited<ReturnType<typeof featuredPeople>>;
  posts: Awaited<ReturnType<typeof latestPosts>>;
}) {
  const heroProjects = projects.slice(0, 3);

  return (
    <div className="pb-8">
      {/* hero: artwork column 437px + headline column, matching Contra's grid */}
      <section className="pt-6">
        <div className="grid items-start gap-[21px] lg:grid-cols-[437px_minmax(0,1fr)]">
          <div className="relative hidden h-[432px] lg:block" aria-hidden="true">
            <div className="absolute inset-0 overflow-hidden rounded-[20px]">
              <CoverArt seed="imfde-hero" aspect="1 / 1" className="h-full" photo={false} />
            </div>
            <p className="absolute left-6 top-5 font-mono text-[11px] tracking-[0.16em] text-[var(--color-ink-soft)] uppercase">
              imfde.ai / @你的名字
            </p>
            <div className="absolute bottom-5 left-5 right-5 rounded-[14px] border border-[var(--color-line-soft)] bg-white/92 p-3.5 backdrop-blur">
              <div className="flex items-center gap-2.5">
                <Avatar name="林舟" size={34} />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold">林舟 · @lin</p>
                  <p className="truncate text-[12.5px] text-[var(--color-muted)]">
                    3 个作品 · 语音与工单
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="overflow-hidden rounded-[8px]">
                    <CoverArt
                      seed={heroProjects[i]?.slug ?? ["agent", "voice", "notes"][i]!}
                      aspect="1 / 1"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h1 className="display max-w-[560px] text-[clamp(34px,4vw,58px)]">
              你的作品，
              <br />
              值得被找到。
            </h1>
            <p className="lead mt-5 max-w-[420px]">
              iMFDE 是 FDE 的主页、作品集和专业网络。分散在 GitHub、LinkedIn
              和聊天记录里的东西，集中到一个能被搜索、被分享的地址。
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/join" className="btn btn-primary">
                建我的主页
              </Link>
              <Link to="/discover" className="btn btn-ghost">
                先看看别人
              </Link>
            </div>

            <p className="mt-5 font-mono text-[11px] tracking-[0.14em] text-[var(--color-faint)] uppercase">
              不经手交易 · 不做信用分 · 只展示可观察的信息
            </p>
          </div>
        </div>
      </section>

      {/* search composer: 680 wide, 20px radius, as measured */}
      <section className="mt-11">
        <form method="get" action="/discover" className="mx-auto max-w-[680px]">
          <div className="search-shell">
            <span className="text-[var(--color-faint)]" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            </span>
            <input
              name="q"
              placeholder="找 FDE：Agent、语音、私有部署"
              aria-label="搜索 FDE"
            />
            <button className="btn btn-primary btn-sm !h-[44px] !px-6 shrink-0">
              搜索
            </button>
          </div>
          {people.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              {people.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  to={`/@${p.handle}`}
                  className="chip hover:bg-[var(--color-sunken-deep)]"
                >
                  {p.display_name}
                </Link>
              ))}
            </div>
          )}
        </form>
      </section>

      <section className="mt-16 grid gap-px overflow-hidden border-y border-[var(--color-line-soft)] bg-[var(--color-line-soft)] sm:grid-cols-3">
        {[
          {
            t: "一个稳定地址",
            d: "imfde.ai/@你的名字。可以被搜索、被分享、被写进简历和邮件签名。",
          },
          {
            t: "作品比简历有说服力",
            d: "项目、Agent、自动化流程，配得上截图、Demo、仓库链接和你的角色说明。",
          },
          {
            t: "同行的视线",
            d: "发动态、关注人、被关注。专业关系从真实做过的事开始，不从粉丝数开始。",
          },
        ].map((x) => (
          <div key={x.t} className="bg-white px-1 py-6 sm:px-6">
            <h3 className="font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
              {x.t}
            </h3>
            <p className="mt-2.5 text-[15px] leading-[1.6] text-[var(--color-ink)]">
              {x.d}
            </p>
          </div>
        ))}
      </section>

      {projects.length > 0 && (
        <section className="mt-14">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="section-title">最近有人在做的</h2>
            <Link
              to="/discover/projects"
              className="text-[14px] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              全部作品 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 lg:grid-cols-4">
            {projects.slice(0, 4).map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      {people.length > 0 && (
        <section className="mt-14">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="section-title">正在现场的人</h2>
            <Link
              to="/discover"
              className="text-[14px] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              全部 FDE →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="mt-16">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="section-title">最新现场动态</h2>
            <Link
              to="/feed"
              className="hidden text-[14px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] sm:block"
            >
              进入广场 →
            </Link>
          </div>
          <div className="border-t border-[var(--color-line-soft)] lg:grid lg:grid-cols-2 lg:gap-x-10">
            {posts.slice(0, 5).map((post) => (
              <PostCard key={post.id} post={post} showActions={false} />
            ))}
          </div>
          <Link
            to="/feed"
            className="mt-3 flex items-center justify-center rounded-[10px] border border-[var(--color-line-soft)] py-2.5 text-[13px] text-[var(--color-ink-soft)] transition hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)] sm:hidden"
          >
            进入广场，看全部动态
          </Link>
        </section>
      )}

      <section className="mt-16 overflow-hidden rounded-[16px] bg-[var(--color-ink)] px-6 py-14 text-center sm:px-10">
        <h2 className="text-[32px] font-semibold tracking-[-0.02em] text-white">
          先把自己放上来。
        </h2>
        <p className="mx-auto mt-2.5 max-w-[460px] text-[15px] leading-relaxed text-white/65">
          注册不需要认证。填一个 handle，写一句话，贴一个作品，就足够开始了。
        </p>
        <Link
          to="/join"
          className="btn mt-7 bg-white text-[var(--color-ink)] hover:bg-white/90"
        >
          免费建主页
        </Link>
      </section>
    </div>
  );
}
````

## File: app/routes/shell.tsx
````typescript
import type { Route } from "./+types/shell";
import { Link, NavLink, Outlet } from "react-router";
import { getMe } from "~/lib/session.server";
import { one } from "~/lib/db.server";
import { AppShell } from "~/components/app-shell";

/**
 * Four things make a profile useful to a stranger: a headline, a face, one
 * piece of work, and one place to find more. The rail shows how many are done
 * instead of a fixed number.
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await getMe(context, request);
  if (!me) return { me: null, setupDone: 0 };

  const row = await one<{
    headline: number;
    avatar_url: number;
    projects: number;
    links: number;
  }>(
    context,
    `SELECT
       (SELECT COUNT(*) FROM profiles
         WHERE user_id = ?1 AND headline IS NOT NULL AND length(headline) > 0) AS headline,
       (SELECT COUNT(*) FROM profiles
         WHERE user_id = ?1 AND avatar_url IS NOT NULL AND length(avatar_url) > 0) AS avatar_url,
       (SELECT COUNT(*) FROM projects WHERE owner_id = ?1 AND visibility = 'public') AS projects,
       (SELECT COUNT(*) FROM external_accounts WHERE user_id = ?1) AS links`,
    me.id,
  );

  const setupDone = row
    ? Number(row.headline > 0) + Number(row.avatar_url > 0) + Number(row.projects > 0) + Number(row.links > 0)
    : 0;

  return { me, setupDone };
}

const GUEST_NAV = [
  { to: "/feed", label: "广场", end: true },
  { to: "/discover", label: "发现 FDE", end: true },
  { to: "/discover/projects", label: "作品", end: true },
];

export default function Shell({ loaderData }: Route.ComponentProps) {
  const me = loaderData?.me ?? null;

  // Signed in: Contra's app view (rail + panel). Signed out: marketing chrome.
  if (me) return <AppShell me={me} setupDone={loaderData.setupDone} />;

  return (
    <div className="min-h-dvh bg-[var(--color-canvas)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-line-soft)] bg-[color-mix(in_srgb,#fff_88%,transparent)] backdrop-blur-xl">
        <div className="frame flex h-[74px] items-center gap-1">
          <Link to="/" className="mr-6 shrink-0">
            <span className="display text-[24px] tracking-[-0.02em]">iMFDE</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {GUEST_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-[16px] font-semibold transition ${
                    isActive
                      ? "text-[var(--color-ink)]"
                      : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/discover"
              className="grid h-10 w-10 place-items-center rounded-full text-[var(--color-ink-soft)] transition hover:bg-[var(--color-paper)] md:hidden"
              aria-label="搜索"
            >
              <SearchIcon />
            </Link>
            <Link to="/login" className="btn btn-ghost hidden sm:inline-flex">
              登录
            </Link>
            <Link to="/join" className="btn btn-primary">
              加入
            </Link>
          </div>
        </div>

        <div className="frame flex gap-1 overflow-x-auto pb-3 md:hidden">
          {GUEST_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `shrink-0 rounded-full px-3 py-1.5 text-[14px] font-medium transition ${
                  isActive
                    ? "bg-[var(--color-paper)] text-[var(--color-ink)]"
                    : "text-[var(--color-ink-soft)]"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </header>

      <main className="frame pb-28 pt-6">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--color-line-soft)]">
        <div className="frame flex flex-wrap items-center justify-between gap-4 py-10">
          <div>
            <p className="display text-[16px]">iMFDE</p>
            <p className="mt-1.5 max-w-[440px] text-[14px] leading-relaxed text-[var(--color-muted)]">
              展示可观察的信息，由访问者自行判断。平台不提供信用分、认证等级，也不经手任何交易。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-[14px] text-[var(--color-muted)]">
            <Link to="/discover" className="hover:text-[var(--color-ink)]">
              发现
            </Link>
            <Link to="/discover/projects" className="hover:text-[var(--color-ink)]">
              作品
            </Link>
            <Link to="/login" className="hover:text-[var(--color-ink)]">
              登录
            </Link>
            <Link to="/join" className="hover:text-[var(--color-ink)]">
              加入
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
````
