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
