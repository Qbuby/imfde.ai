import type { Route } from "./+types/actions-ack";
import { requireMe } from "~/lib/session.server";
import { one, run } from "~/lib/db.server";
import { utc8DayKey } from "~/lib/format";

const LIMIT = 2;

/** Remaining ACKs today for a user. */
async function remainingFor(context: Route.ActionArgs["context"], userId: string) {
  const dayKey = utc8DayKey();
  const row = await one<{ n: number }>(
    context,
    `SELECT COUNT(*) AS n FROM acks WHERE user_id = ?1 AND day_key = ?2`,
    userId,
    dayKey,
  );
  return Math.max(0, LIMIT - (row?.n ?? 0));
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const postId = String(form.get("post_id") ?? "");
  const intent = String(form.get("intent") ?? "ack");

  if (!postId) return Response.json({ ok: false, error: "缺少动态" }, { status: 400 });

  const post = await one<{ author_id: string; visibility: string; deleted_at: number | null; author_status: string }>(
    context,
    `SELECT po.author_id, po.visibility, po.deleted_at, u.status AS author_status
       FROM posts po JOIN users u ON u.id = po.author_id
      WHERE po.id = ?1`,
    postId,
  );
  if (!post || post.deleted_at !== null || post.visibility !== "public" || post.author_status !== "active") {
    return Response.json({ ok: false, error: "动态不存在或不可见" }, { status: 404 });
  }
  if (post.author_id === me.id) {
    return Response.json({ ok: false, error: "不能给自己发 ACK" }, { status: 400 });
  }

  if (intent === "unack") {
    await run(context, `DELETE FROM acks WHERE user_id = ?1 AND post_id = ?2`, me.id, postId);
    return Response.json({ ok: true, acked: false, remaining: await remainingFor(context, me.id) });
  }

  const existing = await one<{ id: string }>(
    context,
    `SELECT id FROM acks WHERE user_id = ?1 AND post_id = ?2`,
    me.id,
    postId,
  );
  if (existing) {
    return Response.json({ ok: true, acked: true, remaining: await remainingFor(context, me.id) });
  }

  const dayKey = utc8DayKey();
  const used = await one<{ n: number }>(
    context,
    `SELECT COUNT(*) AS n FROM acks WHERE user_id = ?1 AND day_key = ?2`,
    me.id,
    dayKey,
  );
  if ((used?.n ?? 0) >= LIMIT) {
    return Response.json(
      { ok: false, error: "今日 2 次 ACK 已用完，明天 00:00 刷新", remaining: 0 },
      { status: 400 },
    );
  }

  await run(
    context,
    `INSERT INTO acks (id, user_id, post_id, day_key, created_at) VALUES (?1, ?2, ?3, ?4, ?5)`,
    crypto.randomUUID(),
    me.id,
    postId,
    dayKey,
    Date.now(),
  );
  return Response.json({ ok: true, acked: true, remaining: Math.max(0, LIMIT - ((used?.n ?? 0) + 1)) });
}
