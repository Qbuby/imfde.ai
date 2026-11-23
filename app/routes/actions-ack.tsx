import type { Route } from "./+types/actions-ack";
import { requireMe } from "~/lib/session.server";
import { one, run } from "~/lib/db.server";
import { utc8DayKey } from "~/lib/format";

const LIMIT = 2;
type Ctx = Route.ActionArgs["context"];

/** Combined daily ACK quota across posts and comments. */
async function remainingFor(context: Ctx, userId: string) {
  const dayKey = utc8DayKey();
  const row = await one<{ n: number }>(
    context,
    `SELECT (SELECT COUNT(*) FROM acks WHERE user_id=?1 AND day_key=?2)
          + (SELECT COUNT(*) FROM comment_acks WHERE user_id=?1 AND day_key=?2) AS n`,
    userId, dayKey,
  );
  return Math.max(0, LIMIT - (row?.n ?? 0));
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const postId = String(form.get("post_id") ?? "");
  const commentId = String(form.get("comment_id") ?? "");
  const intent = String(form.get("intent") ?? "ack");
  const isComment = Boolean(commentId);

  if (!postId && !commentId) return Response.json({ ok: false, error: "缺少目标" }, { status: 400 });

  let authorId: string;
  if (isComment) {
    const c = await one<{ author_id: string; deleted_at: number | null; post_visibility: string; post_deleted: number | null; author_status: string }>(
      context,
      `SELECT c.author_id, c.deleted_at, po.visibility AS post_visibility, po.deleted_at AS post_deleted, u.status AS author_status
         FROM comments c JOIN posts po ON po.id = c.post_id JOIN users u ON u.id = c.author_id
        WHERE c.id = ?1`,
      commentId,
    );
    if (!c || c.deleted_at !== null || c.post_deleted !== null || c.post_visibility !== "public" || c.author_status !== "active") {
      return Response.json({ ok: false, error: "留言不存在或不可见" }, { status: 404 });
    }
    authorId = c.author_id;
  } else {
    const post = await one<{ author_id: string; visibility: string; deleted_at: number | null; author_status: string }>(
      context,
      `SELECT po.author_id, po.visibility, po.deleted_at, u.status AS author_status
         FROM posts po JOIN users u ON u.id = po.author_id WHERE po.id = ?1`,
      postId,
    );
    if (!post || post.deleted_at !== null || post.visibility !== "public" || post.author_status !== "active") {
      return Response.json({ ok: false, error: "动态不存在或不可见" }, { status: 404 });
    }
    authorId = post.author_id;
  }
  if (authorId === me.id) return Response.json({ ok: false, error: "不能给自己发 ACK" }, { status: 400 });

  const table = isComment ? "comment_acks" : "acks";
  const column = isComment ? "comment_id" : "post_id";
  const id = isComment ? commentId : postId;

  if (intent === "unack") {
    await run(context, `DELETE FROM ${table} WHERE user_id = ?1 AND ${column} = ?2`, me.id, id);
    return Response.json({ ok: true, acked: false, remaining: await remainingFor(context, me.id) });
  }

  const existing = await one<{ id: string }>(context,
    `SELECT id FROM ${table} WHERE user_id = ?1 AND ${column} = ?2`, me.id, id);
  if (existing) return Response.json({ ok: true, acked: true, remaining: await remainingFor(context, me.id) });

  const dayKey = utc8DayKey();
  const used = await one<{ n: number }>(
    context,
    `SELECT (SELECT COUNT(*) FROM acks WHERE user_id=?1 AND day_key=?2)
          + (SELECT COUNT(*) FROM comment_acks WHERE user_id=?1 AND day_key=?2) AS n`,
    me.id, dayKey,
  );
  if ((used?.n ?? 0) >= LIMIT) {
    return Response.json({ ok: false, error: "今日 2 次 ACK 已用完，明天 00:00 刷新", remaining: 0 }, { status: 400 });
  }

  if (isComment) {
    await run(context,
      `INSERT INTO comment_acks (id, user_id, comment_id, day_key, created_at) VALUES (?1, ?2, ?3, ?4, ?5)`,
      crypto.randomUUID(), me.id, commentId, dayKey, Date.now());
  } else {
    await run(context,
      `INSERT INTO acks (id, user_id, post_id, day_key, created_at) VALUES (?1, ?2, ?3, ?4, ?5)`,
      crypto.randomUUID(), me.id, postId, dayKey, Date.now());
  }
  return Response.json({ ok: true, acked: true, remaining: Math.max(0, LIMIT - ((used?.n ?? 0) + 1)) });
}
