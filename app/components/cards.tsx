import { Link, useFetcher } from "react-router";
import { Avatar, CoverArt } from "./media";
import { compact } from "~/lib/format";
import { extractTags } from "~/lib/tags";
import type {
  FeedPostRow,
  PersonRow,
  PostCardRow,
  ProjectCardRow,
} from "~/lib/queries.server";
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
            <span className="ml-auto flex items-center gap-1">
              <HeartIcon />
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
        <span className="ml-auto flex shrink-0 items-center gap-1">
          <HeartIcon />
          {compact(project.likes)}
        </span>
      </div>
    </article>
  );
}

export function PersonCard({ person }: { person: PersonRow }) {
  return (
    <Link
      to={`/@${person.handle}`}
      className="group flex items-center gap-3 px-1 py-3.5 transition hover:bg-[var(--color-paper)]"
    >
      <Avatar name={person.display_name} src={person.avatar_url} size={46} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[15px] font-semibold group-hover:underline">
            {person.display_name}
          </p>
          {person.kind === "team" && (
            <span className="chip chip-outline !h-[19px] !px-1.5 !text-[10.5px]">
              团队
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[13.5px] text-[var(--color-ink-soft)]">
          {person.headline || `@${person.handle}`}
        </p>
        <p className="mt-1 flex items-center gap-2.5 font-mono text-[11.5px] tracking-wide text-[var(--color-faint)]">
          <span>{person.projects} 作品</span>
          <span>{compact(person.followers)} 关注者</span>
        </p>
      </div>
    </Link>
  );
}

export function PostCard({
  post,
  showActions = true,
}: {
  post: PostCardRow;
  showActions?: boolean;
}) {
  const likeFetcher = useFetcher();
  const liked = likeFetcher.formData
    ? likeFetcher.formData.get("intent") === "like"
    : Boolean(post.liked);
  const likeCount = likeFetcher.formData
    ? post.likes + (liked && !post.liked ? 1 : !liked && post.liked ? -1 : 0)
    : post.likes;

  return (
    <article className="border-b border-[var(--color-line-soft)] px-1 py-4 last:border-b-0">
      <header className="flex items-center gap-2.5">
        <Link to={`/@${post.handle}`}>
          <Avatar
            name={post.display_name}
            src={post.avatar_url}
            size={36}
          />
        </Link>
        <div className="min-w-0">
          <Link
            to={`/@${post.handle}`}
            className="block truncate text-[15px] font-semibold hover:opacity-70"
          >
            {post.display_name}
          </Link>
          <p className="font-mono text-[11.5px] tracking-wide text-[var(--color-faint)]">
            @{post.handle} · {post.time_label}
          </p>
        </div>
        <span className="chip chip-dark ml-auto shrink-0 !h-[24px] !text-[11px]">
          {POST_KIND_LABEL[post.kind] ?? post.kind}
        </span>
      </header>

      <Link to={`/posts/${post.id}`} className="mt-2 block">
        <p className="whitespace-pre-wrap text-[15px] leading-[1.55] text-[var(--color-ink)]">
          {post.body}
        </p>
      </Link>

      {post.project_slug ? (
        <Link
          to={`/projects/${post.project_slug}`}
          className="mt-3 flex items-center gap-2 rounded-[var(--radius-field)] border border-[var(--color-line)] bg-[var(--color-sunken)] px-3 py-2.5 text-[12.5px] text-[var(--color-ink-soft)] transition hover:border-[var(--color-ink-soft)]"
        >
          <span className="chip !h-[22px] !text-[10.5px]">作品</span>
          <span className="truncate">{post.project_title}</span>
          <span className="ml-auto shrink-0 text-[var(--color-faint)]">→</span>
        </Link>
      ) : null}

      {showActions ? (
        <footer className="mt-3.5 flex items-center gap-1 text-[13px] text-[var(--color-muted)]">
          <likeFetcher.Form method="post" action="/actions/like">
            <input type="hidden" name="target_type" value="post" />
            <input type="hidden" name="target_id" value={post.id} />
            <input
              type="hidden"
              name="intent"
              value={liked ? "unlike" : "like"}
            />
            <button
              className={`flex items-center gap-1.5 flex items-center gap-1.5 rounded-full transition hover:text-[var(--color-ink)] ${
                liked ? "text-[var(--color-ink)]" : ""
              }`}
              aria-pressed={liked}
            >
              <HeartIcon filled={liked} />
              {likeCount > 0 ? compact(likeCount) : "赞"}
            </button>
          </likeFetcher.Form>

          <Link
            to={`/posts/${post.id}`}
            className="flex items-center gap-1.5 flex items-center gap-1.5 rounded-full transition hover:text-[var(--color-ink)]"
          >
            <CommentIcon />
            {post.comments > 0 ? compact(post.comments) : "评论"}
          </Link>
        </footer>
      ) : null}
    </article>
  );
}

export function FollowButton({
  targetId,
  following,
}: {
  targetId: string;
  following: boolean;
}) {
  const fetcher = useFetcher();
  const isFollowing = fetcher.formData
    ? fetcher.formData.get("intent") === "follow"
    : following;

  return (
    <fetcher.Form method="post" action="/actions/follow">
      <input type="hidden" name="target_id" value={targetId} />
      <input
        type="hidden"
        name="intent"
        value={isFollowing ? "unfollow" : "follow"}
      />
      <button
        className={`btn btn-sm ${isFollowing ? "btn-ghost" : "btn-primary"}`}
      >
        {isFollowing ? "已关注" : "关注"}
      </button>
    </fetcher.Form>
  );
}

/**
 * The full post row used by /feed: tags as links, the reposted original inlined,
 * the attached work previewed, and four actions. Likes and bookmarks are
 * optimistic through fetchers; the loader revalidates afterwards so the stored
 * state wins.
 */
export function FeedCard({
  post,
  signedIn = true,
}: {
  post: FeedPostRow;
  signedIn?: boolean;
}) {
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
  const reposting = repostFetcher.state !== "idle";
  const repostCount = post.reposts + (repostFetcher.data ? 1 : 0);

  return (
    <article className="border-b border-[var(--color-line-soft)] px-1 py-4 last:border-b-0">
      {post.repost && (
        <p className="mb-2 flex items-center gap-1.5 text-[12px] text-[var(--color-faint)]">
          <RepostIcon />
          转发了 @{post.repost.handle} 的动态
        </p>
      )}

      <header className="flex items-center gap-2.5">
        <Link to={`/@${post.handle}`}>
          <Avatar name={post.display_name} src={post.avatar_url} size={36} />
        </Link>
        <div className="min-w-0">
          <Link
            to={`/@${post.handle}`}
            className="block truncate text-[15px] font-semibold hover:opacity-70"
          >
            {post.display_name}
          </Link>
          <p className="font-mono text-[11.5px] tracking-wide text-[var(--color-faint)]">
            @{post.handle} · {post.time_label}
          </p>
        </div>
        <span className="chip chip-dark ml-auto shrink-0 !h-[24px] !text-[11px]">
          {POST_KIND_LABEL[post.kind] ?? post.kind}
        </span>
      </header>

      {post.body.trim() !== "" && (
        // not wrapped in a Link: the body itself contains #tag links, and an
        // anchor inside an anchor makes the HTML parser split the tree
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
              className="mt-2 block text-[12px] text-[var(--color-faint)] hover:text-[var(--color-ink)]"
            >
              作品：{post.repost.project_title}
            </Link>
          )}
        </div>
      )}

      {(() => {
        // a tag already in the text is already a link there; chips are only
        // needed for tags that never appear in the body (e.g. auto-tagged
        // posts created together with a project)
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
            <CoverArt seed={post.project_slug} aspect="1 / 1" />
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
            className={`flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:text-[var(--color-ink)] ${
              liked ? "text-[var(--color-ink)]" : ""
            }`}
          >
            <HeartIcon filled={liked} />
            {likeCount > 0 ? compact(likeCount) : ""}
          </button>
        </likeFetcher.Form>

        <Link
          to={`/posts/${post.id}`}
          aria-label="评论"
          className="flex items-center gap-1.5 rounded-full transition hover:text-[var(--color-ink)]"
        >
          <CommentIcon />
          {post.comments > 0 ? compact(post.comments) : ""}
        </Link>

        {signedIn && (
          <>
            <details className="group relative">
              <summary
                className="flex cursor-pointer list-none items-center gap-1.5 rounded-full transition hover:text-[var(--color-ink)]"
                aria-label="转发"
              >
                <RepostIcon />
                {repostCount > 0 ? compact(repostCount) : ""}
              </summary>
              <repostFetcher.Form
                method="post"
                action="/actions/repost"
                className="mt-2 space-y-2 rounded-[10px] border border-[var(--color-line)] p-2.5"
              >
                <input type="hidden" name="post_id" value={post.id} />
                <textarea
                  name="body"
                  rows={2}
                  maxLength={2000}
                  placeholder="加一句你的看法，或留空直接转发"
                  className="field field-area !min-h-[64px] !text-[13px]"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    name="intent"
                    value="repost"
                    disabled={reposting}
                    className="btn btn-primary btn-sm"
                  >
                    转发
                  </button>
                </div>
              </repostFetcher.Form>
            </details>

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
                className={`flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:text-[var(--color-ink)] ${
                  bookmarked ? "text-[var(--color-ink)]" : ""
                }`}
              >
                <BookmarkIcon filled={bookmarked} />
              </button>
            </bookmarkFetcher.Form>
          </>
        )}
      </footer>
    </article>
  );
}

function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M7.2 3.8h9.6a1.2 1.2 0 011.2 1.2v15.9a.6.6 0 01-.94.5L12 17.1l-5.06 4.3a.6.6 0 01-.94-.5V5a1.2 1.2 0 011.2-1.2z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RepostIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M16.6 3.2l3.4 3.4-3.4 3.4M20 6.6H8.2a3.6 3.6 0 00-3.6 3.6v1.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.4 20.8L4 17.4l3.4-3.4M4 17.4h11.8a3.6 3.6 0 003.6-3.6v-1.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


export function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M12 20.3l-1.3-1.2C6.4 15.3 3.5 12.7 3.5 9.4 3.5 6.7 5.6 4.6 8.3 4.6c1.5 0 3 .7 3.7 1.9.8-1.2 2.3-1.9 3.8-1.9 2.7 0 4.8 2.1 4.8 4.8 0 3.3-2.9 5.9-7.2 9.7L12 20.3z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 12.2c0 3.7-3.6 6.7-8 6.7-1 0-2-.1-2.9-.4L5 20l.9-3.2C4.4 15.5 3.5 13.9 3.5 12.2c0-3.7 3.6-6.7 8-6.7s8.5 3 8.5 6.7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
