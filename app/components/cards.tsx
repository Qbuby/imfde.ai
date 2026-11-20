import { useEffect, useRef, useState } from "react";
import { Link, useFetcher, useLocation, useNavigate } from "react-router";
import * as Popover from "@radix-ui/react-popover";
import { motion, useAnimationControls } from "motion/react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Heart,
  Link2,
  MessageCircle,
  Repeat2,
} from "lucide-react";
import { Avatar, CoverArt } from "./media";
import { compact } from "~/lib/format";
import { extractTags } from "~/lib/tags";
import { AuthorHoverCard } from "./author-hover-card";
import { Spotlight } from "./motion/spotlight";
import { SlidingNumber } from "./motion/sliding-number";
import { Confetti, type ConfettiRef } from "./magicui/confetti";
import { FollowButton } from "./follow-button";
import type { FeedPostRow, PersonRow, ProjectCardRow } from "~/lib/queries.server";
import { PostBody, TagLinks } from "./post-body";

export { FollowButton } from "./follow-button";

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

/* ── ProjectCard: Contra gallery card ────────────────────────────────── */

export function ProjectCard({
  project,
  variant = "grid",
  viewerId = null,
  hero = false,
}: {
  project: ProjectCardRow;
  variant?: "grid" | "row";
  viewerId?: string | null;
  hero?: boolean;
}) {
  const href = `/projects/${project.slug}`;
  const author = {
    author_id: project.author_id,
    author_headline: project.author_headline,
    author_hide_follows: project.author_hide_follows,
    author_projects: project.author_projects,
    author_followers: project.author_followers,
  };

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
    <article className={`group ${hero ? "col-span-full" : ""}`}>
      <Link to={href} className="block">
        <div
          className={`cover-inner-stroke relative overflow-hidden rounded-[16px] border border-[var(--hairline)] ${
            hero ? "aspect-[16/9]" : "aspect-[4/3]"
          }`}
        >
          <Spotlight size={260} className="text-white/25" />
          <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.05]">
            <CoverArt seed={project.slug} src={project.cover_url} aspect={hero ? "16 / 9" : "4 / 3"} />
          </div>
          {/* bottom action bar slides up on hover */}
          <div className="frost absolute inset-x-3 bottom-3 z-10 flex translate-y-3 items-center gap-2 rounded-[10px] border border-white/60 px-3 py-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="text-[12px] font-medium">查看详情</span>
            <ArrowUpRight size={13} strokeWidth={1.65} className="ml-auto" aria-hidden />
          </div>
          {/* frosted kind badge */}
          <span className="frost absolute left-3 top-3 rounded-full border border-white/60 px-2.5 py-1 font-mono text-[10.5px] font-medium tracking-wide text-[var(--color-ink)] tabular-nums">
            {KIND_LABEL[project.kind] ?? project.kind}
          </span>
          {/* hover action */}
          <span className="frost absolute right-3 top-3 flex items-center gap-1 rounded-full border border-white/60 px-2.5 py-1 text-[11px] font-medium text-[var(--color-ink)] opacity-0 transition group-hover:opacity-100">
            查看详情 <ArrowUpRight size={12} strokeWidth={1.65} aria-hidden />
          </span>
        </div>
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <Link to={href} className="min-w-0">
          <h3 className={`truncate font-semibold group-hover:underline ${hero ? "text-[20px]" : "text-[15px]"}`}>
            {project.title}
          </h3>
        </Link>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-[var(--color-faint)] tabular-nums">
          <SlidingNumber value={project.likes} /> 赞
        </span>
      </div>
      <p className={`mt-1 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)] ${hero ? "line-clamp-2 max-w-[720px]" : "line-clamp-2"}`}>
        {project.summary}
      </p>
      {hero && (
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[var(--color-muted)]">
          {project.description || "由作者本人填写的作品说明。"}
        </p>
      )}

      <div className="mt-2.5 flex items-center gap-2 text-[12.5px] text-[var(--color-faint)]">
        <AuthorHoverCard
          author={author}
          handle={project.handle}
          displayName={project.display_name}
          avatarUrl={project.avatar_url}
          signedIn={Boolean(viewerId)}
        >
          <Link to={`/@${project.handle}`} className="flex min-w-0 items-center gap-1.5 hover:text-[var(--color-ink)]">
            <Avatar name={project.display_name} src={project.avatar_url} size={20} />
            <span className="truncate">{project.display_name}</span>
          </Link>
        </AuthorHoverCard>
        <span>·</span>
        <span className="shrink-0">{KIND_LABEL[project.kind] ?? project.kind}</span>
      </div>
    </article>
  );
}

/* ── PersonCard ──────────────────────────────────────────────────────── */

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
              <span className="chip chip-outline !h-[19px] !px-1.5 !text-[10.5px]">团队</span>
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

/* ── FeedCard: X-style timeline row ──────────────────────────────────── */

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
  const navigate = useNavigate();

  const likeFetcher = useFetcher();
  const likeIntent = likeFetcher.formData?.get("intent");
  const liked = likeIntent ? likeIntent === "like" : Boolean(post.liked);
  const likeCount =
    likeIntent === "like" && !post.liked
      ? post.likes + 1
      : likeIntent === "unlike" && post.liked
        ? post.likes - 1
        : post.likes;

  const heartControls = useAnimationControls();
  const repostControls = useAnimationControls();
  const bookmarkControls = useAnimationControls();
  const confettiRef = useRef<ConfettiRef>(null);

  function popLike() {
    heartControls.start({ scale: [1, 1.32, 0.92, 1], transition: { duration: 0.42 } });
    void confettiRef.current?.fire({
      particleCount: 8,
      spread: 52,
      startVelocity: 20,
      scalar: 0.65,
      colors: ["#f43f5e", "#f59e0b", "#10b981", "#0ea5e9"],
    });
  }
  function popRepost() {
    repostControls.start({ rotate: [0, 180, 360], transition: { duration: 0.5 } });
  }
  function popBookmark() {
    bookmarkControls.start({ scale: [1, 1.2, 0.94, 1], transition: { duration: 0.36 } });
  }

  const bookmarkFetcher = useFetcher();
  const bookmarkIntent = bookmarkFetcher.formData?.get("intent");
  const bookmarked = bookmarkIntent
    ? bookmarkIntent === "bookmark"
    : Boolean(post.bookmarked);

  const repostFetcher = useFetcher();
  const [repostOpen, setRepostOpen] = useState(false);
  const lastReposted = useRef<string | null>(null);
  const repostCount = post.reposts + (repostFetcher.state !== "idle" ? 1 : 0);

  useEffect(() => {
    const data = repostFetcher.data as { ok?: boolean; id?: string } | undefined;
    if (!data?.ok || !data.id || lastReposted.current === data.id) return;
    lastReposted.current = data.id;
    setRepostOpen(false);
    toast.success("已转发到广场");
  }, [repostFetcher.data]);

  const [copied, setCopied] = useState(false);
  async function copyLink() {
    const url = new URL(`/posts/${post.id}`, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("链接已复制");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("复制失败，请手动选择地址栏");
    }
  }

  const placeholderRepost = post.repost_of_id !== null && post.repost === null;
  const author = {
    author_id: post.author_id,
    author_headline: post.author_headline,
    author_hide_follows: post.author_hide_follows,
    author_projects: post.author_projects,
    author_followers: post.author_followers,
  };

  // clicking the card's blank space opens the post, but never hijacks a link,
  // button or an in-progress text selection
  function cardClick(e: React.MouseEvent<HTMLElement>) {
    if ((e.target as HTMLElement).closest("a, button, input, textarea, summary, [role='dialog']")) return;
    if (window.getSelection()?.toString()) return;
    navigate(`/posts/${post.id}`);
  }

  return (
    <article
      onClick={cardClick}
      className={`group grid grid-cols-[42px_minmax(0,1fr)] gap-3 border-b border-[var(--color-line-soft)] px-2 py-4 transition-colors hover:bg-[#fafafa] last:border-b-0 ${className}`}
    >
      {/* avatar axis */}
      <AuthorHoverCard
        author={author}
        handle={post.handle}
        displayName={post.display_name}
        avatarUrl={post.avatar_url}
        signedIn={signedIn}
        following={Boolean(post.author_following)}
      >
        <Link to={`/@${post.handle}`} aria-label={`${post.display_name} 的主页`}>
          <Avatar name={post.display_name} src={post.avatar_url} size={42} />
        </Link>
      </AuthorHoverCard>

      <div className="min-w-0">
        {/* header */}
        <header className="flex items-center gap-2">
          <AuthorHoverCard
            author={author}
            handle={post.handle}
            displayName={post.display_name}
            avatarUrl={post.avatar_url}
            signedIn={signedIn}
            following={Boolean(post.author_following)}
          >
            <Link to={`/@${post.handle}`} className="max-w-[180px] truncate text-[14.5px] font-semibold hover:opacity-70">
              {post.display_name}
            </Link>
          </AuthorHoverCard>
          <span className="micro-mono hidden truncate sm:inline">@{post.handle}</span>
          <span className="micro-mono shrink-0">· {post.time_label}</span>
          <span className="chip chip-dark ml-auto shrink-0 !h-[22px] !text-[10.5px]">
            {POST_KIND_LABEL[post.kind] ?? post.kind}
          </span>
        </header>

        {/* compact follow next to the name */}
        {showFollow && signedIn && !isSelf && (
          <div className="mt-1">
            <FollowButton
              targetId={post.author_id}
              following={Boolean(post.author_following)}
              signedIn
              size="sm"
              tone="quiet"
            />
          </div>
        )}

        {post.body.trim() !== "" && (
          <PostBody
            body={post.body}
            className="mt-1.5 text-[14.5px] leading-[1.6] text-[var(--color-ink)]"
          />
        )}

        {post.repost && (
          <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-[var(--color-faint)]">
            <Repeat2 size={12} strokeWidth={1.65} aria-hidden />
            转发了 @{post.repost.handle} 的动态
          </p>
        )}

        {post.repost && (
          <div className="mt-2 rounded-[12px] border border-[var(--color-line)] p-3">
            <div className="flex items-center gap-2">
              <Avatar name={post.repost.display_name} src={post.repost.avatar_url} size={20} />
              <Link to={`/@${post.repost.handle}`} className="text-[12.5px] font-semibold hover:opacity-70">
                {post.repost.display_name}
              </Link>
              <span className="micro-mono">@{post.repost.handle} · {post.repost.time_label}</span>
            </div>
            <PostBody
              body={post.repost.body}
              className="mt-1.5 text-[13px] leading-[1.6] text-[var(--color-ink-soft)]"
            />
            {post.repost.project_slug && (
              <Link to={`/projects/${post.repost.project_slug}`} className="mt-2 inline-flex items-center gap-1 text-[12px] text-[var(--color-faint)] hover:text-[var(--color-ink)]">
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
          return extra.length ? <TagLinks tags={extra} className="mt-2" /> : null;
        })()}

        {post.project_slug && (
          <Link
            to={`/projects/${post.project_slug}`}
            className="group/proj mt-3 flex items-center gap-3 rounded-[12px] border border-[var(--color-line)] bg-[var(--color-sunken)] p-2 transition hover:border-[var(--color-ink-soft)]"
          >
            <span className="h-[56px] w-[72px] shrink-0 overflow-hidden rounded-[8px] cover-inner-stroke">
              <span className="block h-full w-full transition-transform duration-500 ease-out group-hover/proj:scale-[1.04]">
                <CoverArt seed={post.project_slug} src={post.project_cover_url} aspect="16 / 10" />
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="chip !h-[18px] !px-1.5 !text-[9.5px]">作品</span>
                <span className="truncate text-[13px] font-semibold">{post.project_title}</span>
              </span>
              <span className="mt-0.5 block truncate text-[12px] text-[var(--color-ink-soft)]">
                {post.project_summary}
              </span>
            </span>
            <ArrowUpRight size={15} strokeWidth={1.65} className="shrink-0 text-[var(--color-faint)]" aria-hidden />
          </Link>
        )}

        {/* action bar: evenly distributed, semantic colours */}
        <footer className="mt-3 flex max-w-[420px] items-center justify-between text-[12.5px] text-[var(--color-muted)] tabular-nums">
          <likeFetcher.Form method="post" action="/actions/like">
            <input type="hidden" name="target_type" value="post" />
            <input type="hidden" name="target_id" value={post.id} />
            <input type="hidden" name="intent" value={liked ? "unlike" : "like"} />
            <button
              aria-pressed={liked}
              aria-label={liked ? "取消赞" : "赞"}
              onClick={() => !liked && popLike()}
              className={`action-btn action-like ${liked ? "text-[var(--color-like)]" : ""}`}
            >
              <motion.span animate={heartControls} className="grid place-items-center">
                <Heart size={17} strokeWidth={1.65} fill={liked ? "currentColor" : "none"} aria-hidden />
              </motion.span>
              {likeCount > 0 ? <SlidingNumber value={likeCount} /> : ""}
            </button>
          </likeFetcher.Form>

          <Link to={`/posts/${post.id}`} aria-label="评论" className="action-btn action-link">
            <MessageCircle size={17} strokeWidth={1.65} aria-hidden />
            {post.comments > 0 ? <SlidingNumber value={post.comments} /> : ""}
          </Link>

          {signedIn ? (
            <>
              <Popover.Root open={repostOpen} onOpenChange={setRepostOpen}>
                <Popover.Trigger asChild>
                  <button
                    aria-label="转发"
                    onClick={popRepost}
                    className="action-btn action-repost data-[state=open]:text-[var(--color-repost)]"
                  >
                    <motion.span animate={repostControls} className="grid place-items-center">
                      <Repeat2 size={17} strokeWidth={1.65} aria-hidden />
                    </motion.span>
                    {repostCount > 0 ? <SlidingNumber value={repostCount} /> : ""}
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="pop-in grain z-50 w-[320px] rounded-[12px] border border-[var(--hairline)] bg-white p-3 shadow-[var(--shadow-lift)]"
                  >
                    <repostFetcher.Form method="post" action="/actions/repost" className="space-y-2">
                      <input type="hidden" name="post_id" value={post.id} />
                      <textarea
                        name="body"
                        rows={3}
                        maxLength={2000}
                        placeholder="加一句你的看法，或留空直接转发"
                        className="field field-area !min-h-[72px] !text-[13px]"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11.5px] text-[var(--color-faint)]">留空即纯转发</span>
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
                <input type="hidden" name="intent" value={bookmarked ? "unbookmark" : "bookmark"} />
                <button
                  aria-pressed={bookmarked}
                  aria-label={bookmarked ? "取消收藏" : "收藏"}
                  onClick={popBookmark}
                  className={`action-btn action-link ${bookmarked ? "text-[var(--color-link)]" : ""}`}
                >
                  <motion.span animate={bookmarkControls} className="grid place-items-center">
                    <Bookmark size={17} strokeWidth={1.65} fill={bookmarked ? "currentColor" : "none"} aria-hidden />
                  </motion.span>
                </button>
              </bookmarkFetcher.Form>

              <button
                onClick={copyLink}
                aria-label="复制链接"
                className={`action-btn ${copied ? "text-[var(--color-repost)]" : ""}`}
              >
                {copied ? <Check size={17} strokeWidth={1.65} aria-hidden /> : <Link2 size={17} strokeWidth={1.65} aria-hidden />}
              </button>
            </>
          ) : (
            <>
              <GuestAction icon="repost" label="登录后转发" count={post.reposts} />
              <GuestAction icon="bookmark" label="登录后收藏" />
            </>
          )}
        </footer>
      </div>

      {/* inert until a like fires; canvas is safe on SSR */}
      <Confetti ref={confettiRef} className="pointer-events-none absolute inset-0 z-10" />
    </article>
  );
}

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
      className="action-btn"
    >
      {icon === "repost" ? (
        <Repeat2 size={17} strokeWidth={1.65} aria-hidden />
      ) : (
        <Bookmark size={17} strokeWidth={1.65} aria-hidden />
      )}
      {count > 0 && <span>{compact(count)}</span>}
    </Link>
  );
}
