import type { Route } from "./+types/notifications";
import { Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { many, run } from "~/lib/db.server";
import { Avatar } from "~/components/media";
import { relativeTime } from "~/lib/format";

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
    <div className="mx-auto max-w-[620px]">
      <header className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Activity</p>
          <h1 className="display mt-2 text-[clamp(24px,3.2vw,32px)]">通知</h1>
        </div>
        {unread > 0 && (
          <form method="post">
            <button className="btn btn-ghost btn-sm">全部标为已读</button>
          </form>
        )}
      </header>

      {items.length === 0 ? (
        <div className="card mt-7 px-6 py-16 text-center">
          <p className="display text-[18px]">还没有通知</p>
          <p className="mt-2 text-[13.5px] text-[var(--color-muted)]">
            有人关注你、赞你的作品或评论你的动态时，会出现在这里。
          </p>
        </div>
      ) : (
        <div className="mt-7 space-y-1.5">
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
                className={`card flex items-center gap-3 p-3.5 transition hover:border-[#d9dde5] ${
                  n.read_at ? "opacity-65" : ""
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
