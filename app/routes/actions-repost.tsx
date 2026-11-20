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
    repost_of_id: string | null;
    body: string;
    author_visibility: string;
    author_status: string;
  }>(
    context,
    `SELECT po.id, po.author_id, po.kind, po.visibility, po.deleted_at,
            po.repost_of_id, po.body,
            p.visibility AS author_visibility, u.status AS author_status
       FROM posts po
       JOIN profiles p ON p.user_id = po.author_id
       JOIN users u    ON u.id = po.author_id
      WHERE po.id = ?1`,
    postId,
  );

  // nothing to quote: gone, private, or the author keeps a private profile
  if (
    !original ||
    original.deleted_at !== null ||
    original.visibility === "private" ||
    original.author_status !== "active" ||
    (original.author_visibility === "private" && original.author_id !== me.id)
  ) {
    return Response.json({ ok: false }, { status: 404 });
  }

  /**
   * Reposting a bare repost would produce a quote of a quote with no text at
   * all — the reader would land on an empty shell. Point at the original
   * source instead, walking nested reposts until something has content.
   */
  let target = original;
  for (let depth = 0; depth < 5 && target.repost_of_id && target.body.trim() === ""; depth++) {
    const parent = await one<typeof target>(
      context,
      `SELECT po.id, po.author_id, po.kind, po.visibility, po.deleted_at,
              po.repost_of_id, po.body,
              p.visibility AS author_visibility, u.status AS author_status
         FROM posts po
         JOIN profiles p ON p.user_id = po.author_id
         JOIN users u    ON u.id = po.author_id
        WHERE po.id = ?1`,
      target.repost_of_id,
    );
    if (
      !parent ||
      parent.deleted_at !== null ||
      parent.visibility === "private" ||
      parent.author_status !== "active"
    ) {
      break;
    }
    target = parent;
  }

  // a bare repost keeps the original's kind so the chip still reads correctly
  const kind = KINDS.includes(target.kind) ? target.kind : "thought";

  const id = await insertPost(context, {
    authorId: me.id,
    kind,
    body,
    repostOfId: target.id,
    tags: extractTags(body),
  });

  // never notify yourself
  if (target.author_id !== me.id) {
    await run(
      context,
      `INSERT INTO notifications
         (id, recipient_id, actor_id, type, target_type, target_id, created_at)
       VALUES (?1, ?2, ?3, 'repost', 'post', ?4, ?5)`,
      crypto.randomUUID(),
      target.author_id,
      me.id,
      target.id,
      Date.now(),
    );
  }

  return Response.json({ ok: true, id });
}
