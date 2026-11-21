import type { Route } from "./+types/notifications";
import { Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { many, run } from "~/lib/db.server";
import { useState } from "react";
import { AnimatedBackground } from "~/components/motion/animated-background";
import { Heart, Repeat2, MessageCircle, UserPlus, AtSign, Bell } from "lucide-react";
import { relativeTime } from "~/lib/format";
import { PageHead } from "~/components/page-head";

const NOTIF_ICON: Record<string, { icon: typeof Heart; cls: string }> = {
  like: { icon: Heart, cls: "bg-[#fff1f2] text-[#f43f5e]" },
  repost: { icon: Repeat2, cls: "bg-[#ecfdf5] text-[#10b981]" },
  comment: { icon: MessageCircle, cls: "bg-[#f0f9ff] text-[#0ea5e9]" },
  follow: { icon: UserPlus, cls: "bg-[#f5f3ff] text-[#7c3aed]" },
  mention: { icon: AtSign, cls: "bg-[#fffbeb] text-[#d97706]" },
};

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
    post_excerpt: string | null;
    project_title: string | null;
  }>(
    context,
    `SELECT n.id, n.type, n.target_type, n.target_id, n.read_at, n.created_at,
            u.handle AS actor_handle, p.display_name AS actor_name,
            p.avatar_url AS actor_avatar,
            po.id AS post_id, pr.slug AS project_slug,
            substr(po.body, 1, 90) AS post_excerpt, pr.title AS project_title
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
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const shown = filter === "unread" ? items.filter((n) => !n.read_at) : items;

  return (
    <div>
      <PageHead
        label="Activity"
        title="通知"
        actions={
          unread > 0 ? (
            <form method="post">
              <button className="btn btn-ghost btn-sm">全部标为已读</button>
            </form>
          ) : undefined
        }
      />

      <div className="mt-5 inline-flex items-center rounded-full border border-[#e3e5ea] bg-[#f7f7f9] p-1">
        <AnimatedBackground
          defaultValue="all"
          onValueChange={(id) => id && setFilter(id as typeof filter)}
          className="rounded-full bg-[#14171f]"
          transition={{ type: "spring", stiffness: 460, damping: 34 }}
        >
          <button data-id="all" type="button" className="rounded-full px-3 py-1 text-[12.5px] text-[#4a5264] data-[checked=true]:text-white">全部</button>
          <button data-id="unread" type="button" className="rounded-full px-3 py-1 text-[12.5px] text-[#4a5264] data-[checked=true]:text-white">未读 · {unread}</button>
        </AnimatedBackground>
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 border-t border-[var(--color-line-soft)] py-16">
          <p className="text-[16px] font-semibold">还没有通知</p>
          <p className="mt-1.5 text-[13.5px] text-[var(--color-ink-soft)]">
            有人关注你、赞你的作品或评论你的动态时，会出现在这里。
          </p>
        </div>
      ) : (
        <div className="mt-8 divide-y divide-[var(--color-line-soft)] border-t border-[var(--color-line-soft)]">
          {shown.map((n) => {
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
                className={`flex items-center gap-3 px-1 py-3.5 transition hover:bg-[var(--color-paper)] ${
                  n.read_at ? "opacity-55" : ""
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${NOTIF_ICON[n.type]?.cls ?? "bg-[#f7f7f9] text-[#677084]"}`}
                >
                  {(() => {
                    const Icon = NOTIF_ICON[n.type]?.icon ?? Bell;
                    return <Icon size={15} strokeWidth={1.7} aria-hidden />;
                  })()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px]">
                    <span className="font-medium">{n.actor_name ?? "某人"}</span>{" "}
                    <span className="text-[var(--color-muted)]">
                      {TEXT[n.type] ?? n.type}
                    </span>
                  </p>
                  {(n.post_excerpt || n.project_title) && (
                    <p className="mt-1 truncate rounded-[8px] bg-[#f7f7f9] px-2.5 py-1.5 text-[12.5px] text-[#4a5264]">
                      {n.post_excerpt || n.project_title}
                    </p>
                  )}
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
