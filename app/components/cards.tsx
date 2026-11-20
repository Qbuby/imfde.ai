import { useEffect, useRef, useState } from "react";
import { Link, useFetcher, useLocation } from "react-router";
import * as Popover from "@radix-ui/react-popover";
import { toast } from "sonner";
import { Bookmark, Heart, MessageCircle, Repeat2, ArrowUpRight } from "lucide-react";
import { Avatar, CoverArt } from "./media";
import { compact } from "~/lib/format";
import { extractTags } from "~/lib/tags";
import type { FeedPostRow, PersonRow, ProjectCardRow } from "~/lib/queries.server";
import { PostBody, TagLinks } from "./post-body";

const KIND_LABEL: Record<string, string> = {
  project: "项目",
  agent: "Agent",
  tool: "工具",
  automation: "自动化",
  case: "案例",
  oss: "开源",
};

const POST_KIND_LABEL: Record<string, string> = {
  show: "Show Work",
  build: "Build in Public",
  thought: "Thoughts",
  discussion: "Discussion",
};

export function ProjectCard({
  project,
  variant = "grid",
}: {
  project: ProjectCardRow;
  variant?: "grid" | "row";
}) {
  const href = `/projects/${project.slug}`;

  if (variant === "row") {
    return (
      <Link
        to={href}
        className="group flex items-center gap-3 rounded-[10px] px-2 py-2.5 transition hover:bg-[var(--color-paper)]"
      >
        <span className="w-[52px] shrink-0 overflow-hidden rounded-[8px]">
          <CoverArt seed={project.slug} src={project.cover_url} aspect="1 / 1" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-semibold group-hover:underline">
            {project.title}
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-[var(--color-ink-soft)]">
            {project.summary}
          </span>
          <span className="mt-1 flex items-center gap-2 text-[12px] text-[var(--color-faint)]">
            <span>{project.display_name}</span>
            <span>·</span>
            <span>{KIND_LABEL[project.kind] ?? project.kind}</span>
            <span className="ml-auto flex items-center gap-1 tabular-nums">
              <Heart size={13} strokeWidth={1.65} aria-hidden />
              {compact(project.likes)}
            </span>
          </span>
        </span>
      </Link>
    );
  }

  return (
    <article className="group">
      <Link to={href} className="block">
        <div className="overflow-hidden rounded-[12px]">
          <CoverArt seed={project.slug} src={project.cover_url} aspect="4 / 3" />
        </div>
      </Link>
      <Link to={href} className="mt-2.5 block">
        <h3 className="truncate text-[15px] font-semibold group-hover:underline">
          {project.title}
        </h3>
      </Link>
      <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">
        {project.summary}
      </p>
      <div className="mt-2 flex items-center gap-2 text-[12.5px] text-[var(--color-faint)]">
        <Link
          to={`/@${project.handle}`}
          className="flex min-w-0 items-center gap-1.5 hover:text-[var(--color-ink)]"
        >
          <Avatar name={project.display_name} src={project.avatar_url} size={20} />
          <span className="truncate">{project.display_name}</span>
        </Link>
        <span>·</span>
        <span className="shrink-0">{KIND_LABEL[project.kind] ?? project.kind}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1 tabular-nums">
          <Heart size={13} strokeWidth={1.65} aria-hidden />
          {compact(project.likes)}
        </span>
      </div>
    </article>
  );
}

/**
 * Person row: avatar and name are the link, the follow control sits outside it
 * (a button inside an anchor is invalid and breaks hydration).
 */
export function PersonCard({
  person,
  viewerId = null,
}: {
  person: PersonRow;
  viewerId?: string | null;
}) {
  const isSelf = viewerId === person.id;

  return (
    <div className="flex items-center gap-3 px-1 py-3.5 transition hover:bg-[var(--color-paper)]">
      <Link to={`/@${person.handle}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={person.display_name} src={person.avatar_url} size={46} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[15px] font-semibold">{person.display_name}</p>
            {person.kind === "team" && (
              <span className="chip chip-outline !h-[19px] !px-1.5 !text-[10.5px]">
                团队
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[13.5px] text-[var(--color-ink-soft)]">
            {person.headline || `@${person.handle}`}
          </p>
          <p className="mt-1 flex items-center gap-2.5 font-mono text-[11.5px] tracking-wide text-[var(--color-faint)] tabular-nums">
            <span>{person.projects} 作品</span>
            {person.hide_follows ? null : <span>{compact(person.followers)} 关注者</span>}
          </p>
        </div>
      </Link>
      {!isSelf && (
        <FollowButton
          targetId={person.id}
          following={Boolean(person.following)}
          signedIn={Boolean(viewerId)}
          size="sm"
          className="shrink-0"
        />
      )}
    </div>
  );
}

/**
 * The single post row used everywhere: /feed, the home feed, profiles. Tags,
 * the reposted original, the attached work and four actions all live here.
 */
export function FeedCard({
  post,
  viewerId = null,
  showFollow = true,
  className = "",
}: {
  post: FeedPostRow;
  viewerId?: string | null;
  showFollow?: boolean;
  className?: string;
}) {
  const signedIn = Boolean(viewerId);
  const isSelf = viewerId === post.author_id;

  const likeFetcher = useFetcher();
  const likeIntent = likeFetcher.formData?.get("intent");
  const liked = likeIntent ? likeIntent === "like" : Boolean(post.liked);
  const likeCount =
    likeIntent === "like" && !post.liked
      ? post.likes + 1
      : likeIntent === "unlike" && post.liked
        ? post.likes - 1
        : post.likes;

  const bookmarkFetcher = useFetcher();
  const bookmarkIntent = bookmarkFetcher.formData?.get("intent");
  const bookmarked = bookmarkIntent
    ? bookmarkIntent === "bookmark"
    : Boolean(post.bookmarked);

  const repostFetcher = useFetcher();
  const [repostOpen, setRepostOpen] = useState(false);
  const lastReposted = useRef<string | null>(null);
  // optimistic only while in flight; the revalidated loader wins afterwards
  const repostCount = post.reposts + (repostFetcher.state !== "idle" ? 1 : 0);

  useEffect(() => {
    const data = repostFetcher.data as { ok?: boolean; id?: string } | undefined;
    if (!data?.ok || !data.id || lastReposted.current === data.id) return;
    lastReposted.current = data.id;
    setRepostOpen(false);
    toast.success("已转发到广场");
  }, [repostFetcher.data]);

  const placeholderRepost = post.repost_of_id !== null && post.repost === null;

  return (
    <article
      className={`border-b border-[var(--color-line-soft)] px-1 py-4 last:border-b-0 ${className}`}
    >
      {post.repost && (
        <p className="mb-2 flex items-center gap-1.5 text-[12px] text-[var(--color-faint)]">
          <Repeat2 size={13} strokeWidth={1.65} aria-hidden />
          转发了 @{post.repost.handle} 的动态
        </p>
      )}

      <header className="flex items-center gap-2.5">
        <Link to={`/@${post.handle}`} aria-label={`${post.display_name} 的主页`}>
          <Avatar name={post.display_name} src={post.avatar_url} size={36} />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              to={`/@${post.handle}`}
              className="block max-w-full truncate text-[15px] font-semibold hover:opacity-70"
            >
              {post.display_name}
            </Link>
            {showFollow && signedIn && !isSelf && (
              <FollowButton
                targetId={post.author_id}
                following={Boolean(post.author_following)}
                signedIn
                size="sm"
                tone="quiet"
              />
            )}
          </div>
          <p className="font-mono text-[11.5px] tracking-wide text-[var(--color-faint)]">
            @{post.handle} · {post.time_label}
          </p>
        </div>
        <span className="chip chip-dark ml-auto shrink-0 !h-[24px] !text-[11px]">
          {POST_KIND_LABEL[post.kind] ?? post.kind}
        </span>
      </header>

      {post.body.trim() !== "" && (
        // not wrapped in a Link: the body contains #tag links of its own
        <PostBody
          body={post.body}
          className="mt-2 text-[15px] leading-[1.55] text-[var(--color-ink)]"
        />
      )}

      {post.repost && (
        <div className="mt-3 rounded-[12px] border border-[var(--color-line)] p-3">
          <div className="flex items-center gap-2">
            <Avatar
              name={post.repost.display_name}
              src={post.repost.avatar_url}
              size={22}
            />
            <Link
              to={`/@${post.repost.handle}`}
              className="text-[13px] font-semibold hover:opacity-70"
            >
              {post.repost.display_name}
            </Link>
            <span className="font-mono text-[11px] text-[var(--color-faint)]">
              @{post.repost.handle} · {post.repost.time_label}
            </span>
          </div>
          <PostBody
            body={post.repost.body}
            className="mt-1.5 text-[13.5px] leading-[1.6] text-[var(--color-ink-soft)]"
          />
          {post.repost.project_slug && (
            <Link
              to={`/projects/${post.repost.project_slug}`}
              className="mt-2 inline-flex items-center gap-1 text-[12px] text-[var(--color-faint)] hover:text-[var(--color-ink)]"
            >
              作品：{post.repost.project_title}
              <ArrowUpRight size={12} strokeWidth={1.65} aria-hidden />
            </Link>
          )}
        </div>
      )}

      {placeholderRepost && (
        <div className="mt-3 rounded-[12px] border border-dashed border-[var(--color-line)] px-3 py-3 text-[12.5px] text-[var(--color-faint)]">
          原动态已删除或不可见
        </div>
      )}

      {(() => {
        const inline = new Set(extractTags(post.body).map((t) => t.toLowerCase()));
        const extra = post.tags.filter((t) => !inline.has(t.toLowerCase()));
        return extra.length ? <TagLinks tags={extra} className="mt-2.5" /> : null;
      })()}

      {post.project_slug ? (
        <Link
          to={`/projects/${post.project_slug}`}
          className="mt-3 flex items-center gap-2.5 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-sunken)] px-3 py-2.5 transition hover:border-[var(--color-ink-soft)]"
        >
          <span className="h-[34px] w-[34px] shrink-0 overflow-hidden rounded-[6px]">
            <CoverArt
              seed={post.project_slug}
              src={post.project_cover_url}
              aspect="1 / 1"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold">
              {post.project_title}
            </span>
            <span className="block truncate text-[12px] text-[var(--color-ink-soft)]">
              {post.project_summary}
            </span>
          </span>
        </Link>
      ) : null}

      <footer className="mt-3.5 flex items-center gap-1 text-[13px] text-[var(--color-muted)]">
        <likeFetcher.Form method="post" action="/actions/like">
          <input type="hidden" name="target_type" value="post" />
          <input type="hidden" name="target_id" value={post.id} />
          <input type="hidden" name="intent" value={liked ? "unlike" : "like"} />
          <button
            aria-pressed={liked}
            aria-label={liked ? "取消赞" : "赞"}
            className={`flex min-h-[32px] min-w-[32px] items-center gap-1 rounded-full px-1.5 transition hover:text-[var(--color-ink)] ${
              liked ? "text-[var(--color-watermelon)]" : ""
            }`}
          >
            <Heart
              size={16}
              strokeWidth={1.65}
              fill={liked ? "currentColor" : "none"}
              className={liked ? "like-pop" : ""}
              aria-hidden
            />
            <span className="tabular-nums">
              {likeCount > 0 ? compact(likeCount) : ""}
            </span>
          </button>
        </likeFetcher.Form>

        <Link
          to={`/posts/${post.id}`}
          aria-label="评论"
          className="flex min-h-[32px] min-w-[32px] items-center gap-1 rounded-full px-1.5 transition hover:text-[var(--color-ink)]"
        >
          <MessageCircle size={16} strokeWidth={1.65} aria-hidden />
          <span className="tabular-nums">
            {post.comments > 0 ? compact(post.comments) : ""}
          </span>
        </Link>

        {signedIn ? (
          <>
            <Popover.Root open={repostOpen} onOpenChange={setRepostOpen}>
              <Popover.Trigger asChild>
                <button
                  aria-label="转发"
                  className="flex min-h-[32px] min-w-[32px] items-center gap-1 rounded-full px-1.5 transition hover:text-[var(--color-ink)] data-[state=open]:text-[var(--color-ink)]"
                >
                  <Repeat2 size={16} strokeWidth={1.65} aria-hidden />
                  <span className="tabular-nums">
                    {repostCount > 0 ? compact(repostCount) : ""}
                  </span>
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  side="bottom"
                  align="start"
                  sideOffset={6}
                  className="pop-in grain z-50 w-[320px] rounded-[12px] border border-[var(--color-line)] bg-white p-3 shadow-[0_14px_32px_rgba(0,0,0,0.09)]"
                >
                  <repostFetcher.Form
                    method="post"
                    action="/actions/repost"
                    className="space-y-2"
                  >
                    <input type="hidden" name="post_id" value={post.id} />
                    <textarea
                      name="body"
                      rows={3}
                      maxLength={2000}
                      placeholder="加一句你的看法，或留空直接转发"
                      className="field field-area !min-h-[72px] !text-[13px]"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11.5px] text-[var(--color-faint)]">
                        留空即纯转发
                      </span>
                      <button
                        disabled={repostFetcher.state !== "idle"}
                        className="btn btn-primary btn-sm disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {repostFetcher.state !== "idle" ? "转发中…" : "转发"}
                      </button>
                    </div>
                  </repostFetcher.Form>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <bookmarkFetcher.Form method="post" action="/actions/bookmark">
              <input type="hidden" name="target_type" value="post" />
              <input type="hidden" name="target_id" value={post.id} />
              <input
                type="hidden"
                name="intent"
                value={bookmarked ? "unbookmark" : "bookmark"}
              />
              <button
                aria-pressed={bookmarked}
                aria-label={bookmarked ? "取消收藏" : "收藏"}
                className={`flex min-h-[32px] min-w-[32px] items-center justify-center rounded-full px-1.5 transition hover:text-[var(--color-ink)] ${
                  bookmarked ? "text-[var(--color-ink)]" : ""
                }`}
              >
                <Bookmark
                  size={16}
                  strokeWidth={1.65}
                  fill={bookmarked ? "currentColor" : "none"}
                  aria-hidden
                />
              </button>
            </bookmarkFetcher.Form>
          </>
        ) : (
          <>
            <GuestAction icon="repost" label="登录后转发" count={post.reposts} />
            <GuestAction icon="bookmark" label="登录后收藏" />
          </>
        )}
      </footer>
    </article>
  );
}

/** Signed-out stand-in: links to /login with the page to come back to. */
function GuestAction({
  icon,
  label,
  count = 0,
}: {
  icon: "repost" | "bookmark";
  label: string;
  count?: number;
}) {
  const location = useLocation();
  return (
    <Link
      to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
      aria-label={label}
      className="flex min-h-[32px] min-w-[32px] items-center justify-center gap-1 rounded-full px-1.5 transition hover:text-[var(--color-ink)]"
    >
      {icon === "repost" ? (
        <Repeat2 size={16} strokeWidth={1.65} aria-hidden />
      ) : (
        <Bookmark size={16} strokeWidth={1.65} aria-hidden />
      )}
      {count > 0 && <span className="tabular-nums">{compact(count)}</span>}
    </Link>
  );
}

/**
 * Follow control. Signed out it is a link to /login carrying the current page,
 * so the visitor comes back where they were instead of hitting a POST-only
 * action route.
 */
export function FollowButton({
  targetId,
  following,
  signedIn,
  size = "md",
  tone = "solid",
  className = "",
}: {
  targetId: string;
  following: boolean;
  signedIn: boolean;
  size?: "sm" | "md";
  tone?: "solid" | "quiet";
  className?: string;
}) {
  const fetcher = useFetcher();
  const location = useLocation();
  const next = location.pathname + location.search;

  if (!signedIn) {
    return (
      <Link
        to={`/login?next=${encodeURIComponent(next)}`}
        className={`${size === "sm" ? "h-[28px] rounded-full border border-[var(--color-line)] px-3 text-[12.5px]" : "btn btn-primary btn-sm"} ${className}`}
      >
        关注
      </Link>
    );
  }

  const isFollowing = fetcher.formData
    ? fetcher.formData.get("intent") === "follow"
    : following;

  return (
    <fetcher.Form method="post" action="/actions/follow" className={className}>
      <input type="hidden" name="target_id" value={targetId} />
      <input type="hidden" name="intent" value={isFollowing ? "unfollow" : "follow"} />
      <button
        disabled={fetcher.state !== "idle"}
        className={
          size === "sm"
            ? `h-[28px] rounded-full border px-3 text-[12.5px] transition disabled:opacity-60 ${
                isFollowing
                  ? "border-[var(--color-line)] text-[var(--color-faint)] hover:text-[var(--color-ink)]"
                  : tone === "quiet"
                    ? "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                    : "border-[var(--color-ink-soft)] text-[var(--color-ink)]"
              }`
            : `btn btn-sm ${isFollowing ? "btn-ghost" : "btn-primary"}`
        }
      >
        {isFollowing ? "已关注" : "关注"}
      </button>
    </fetcher.Form>
  );
}
