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
  const asJson = form.get("response") === "json";

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
    if (asJson) return Response.json({ ok: true, deleted: true });
    return redirect(`/posts/${postId}`);
  }

  if (!body || body.length > 2000) {
    if (asJson) {
      return Response.json(
        { ok: false, error: "评论不能为空且不超过 2000 字" },
        { status: 400 },
      );
    }
    return redirect(`/posts/${postId}?error=comment`);
  }

  const post = await one<{ author_id: string }>(
    context,
    `SELECT author_id FROM posts WHERE id = ?1 AND deleted_at IS NULL`,
    postId,
  );
  if (!post) {
    if (asJson) return Response.json({ ok: false }, { status: 404 });
    throw new Response("Not Found", { status: 404 });
  }

  // Optional parent_id: must be an undeleted comment on the same post.
  const parentRaw = String(form.get("parent_id") ?? "").trim();
  let parent: { author_id: string; parent_id: string | null } | null = null;
  let effectiveParent: string | null = null;
  if (parentRaw) {
    parent = await one<{ author_id: string; parent_id: string | null }>(context,
      `SELECT author_id, parent_id FROM comments WHERE id = ?1 AND post_id = ?2 AND deleted_at IS NULL`,
      parentRaw, postId);
    if (!parent) {
      if (asJson) return Response.json({ ok: false, error: "要回复的留言不存在" }, { status: 404 });
      throw new Response("Not Found", { status: 404 });
    }
    // Second-level replies are grouped under their top-level ancestor.
    effectiveParent = parent.parent_id ?? parentRaw;
  }

  const commentId = crypto.randomUUID();
  await run(
    context,
    `INSERT INTO comments (id, post_id, author_id, parent_id, body, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    commentId,
    postId,
    me.id,
    effectiveParent,
    body,
    Date.now(),
  );

  const replyTarget = parent?.author_id ?? post.author_id;
  if (replyTarget !== me.id) {
    await run(
      context,
      `INSERT INTO notifications (id, recipient_id, actor_id, type, target_type, target_id, created_at)
       VALUES (?1, ?2, ?3, 'comment', 'post', ?4, ?5)`,
      crypto.randomUUID(),
      replyTarget,
      me.id,
      postId,
      Date.now(),
    );
  }

  if (asJson) return Response.json({ ok: true, id: commentId });
  return redirect(`/posts/${postId}#comments`);
}
