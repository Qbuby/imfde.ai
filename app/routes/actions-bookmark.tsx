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
