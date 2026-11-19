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
