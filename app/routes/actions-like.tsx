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
