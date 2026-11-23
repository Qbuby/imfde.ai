import type { Route } from "./+types/actions-avatar-reset";
import { requireMe } from "~/lib/session.server";
import { stmt } from "~/lib/db.server";

/** Clears a custom avatar back to the initial-letter badge. */
export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ ok: false, error: "只支持 POST" }, { status: 405 });
  }
  const me = await requireMe(context, request);
  await stmt(
    context,
    `UPDATE profiles SET avatar_url = NULL, updated_at = ?1 WHERE user_id = ?2`,
    Date.now(),
    me.id,
  ).run();
  return Response.json({ ok: true });
}
