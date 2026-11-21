import type { Route } from "./+types/post";
import { useEffect, useRef, useState } from "react";
import { Link, useFetcher, useNavigate } from "react-router";
import * as Popover from "@radix-ui/react-popover";
import { motion, useAnimationControls } from "motion/react";
import { toast } from "sonner";
import { getMe } from "~/lib/session.server";
import { many, one } from "~/lib/db.server";
import { Avatar } from "~/components/media";
import { FollowButton } from "~/components/cards";
import { AuthorHoverCard } from "~/components/author-hover-card";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { SlidingNumber } from "~/components/motion/sliding-number";
import { fireLikeBurst } from "~/lib/burst";
import {
  ArrowLeft,
  Bookmark,
  Check,
  Heart,
  Link2,
  MessageCircle,
  Repeat2,
} from "lucide-react";
import { relativeTime } from "~/lib/format";
import { PostBody } from "~/components/post-body";

const KIND_LABEL: Record<string, string> = {
  show: "Show Work",
  build: "Build in Public",
  thought: "Thoughts",
  discussion: "Discussion",
};

interface PostDetail {
  id: string;
  kind: string;
  body: string;
  created_at: number;
  author_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  headline: string | null;
  project_slug: string | null;
  project_title: string | null;
  likes: number;
  visibility: string;
  author_visibility: string;
  repost_of_id: string | null;
  r_body: string | null;
  r_handle: string | null;
  r_display_name: string | null;
  r_avatar_url: string | null;
  r_created_at: number | null;
  r_project_slug: string | null;
  r_project_title: string | null;
  r_time_label: string;
  author_following: number;
  author_headline: string | null;
  author_hide_follows: number;
  author_projects: number;
  author_followers: number;
  reposts: number;
  bookmarked: number;
  reposted: number;
  liked: number;
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const me = await getMe(context, request);

  const post = await one<PostDetail>(
    context,
    `SELECT po.id, po.kind, po.body, po.created_at, po.author_id,
            po.visibility,
            u.handle, p.display_name, p.avatar_url, p.headline,
            p.visibility AS author_visibility, p.hide_follows AS author_hide_follows,
            (SELECT COUNT(*) FROM projects ap WHERE ap.owner_id = po.author_id
              AND ap.visibility = 'public') AS author_projects,
            (SELECT COUNT(*) FROM follows af WHERE af.followed_id = po.author_id) AS author_followers,
            pr.slug AS project_slug, pr.title AS project_title,
            (SELECT COUNT(*) FROM reactions r
              WHERE r.target_type='post' AND r.target_id = po.id AND r.type='like') AS likes,
            (SELECT COUNT(*) FROM posts rp
              WHERE rp.repost_of_id = po.id AND rp.deleted_at IS NULL) AS reposts,
            (SELECT COUNT(*) FROM bookmarks b
              WHERE b.user_id = ?2 AND b.target_type = 'post' AND b.target_id = po.id) AS bookmarked,
            (SELECT COUNT(*) FROM posts myrp
              WHERE myrp.repost_of_id = po.id AND myrp.author_id = ?2
                AND myrp.body = '' AND myrp.deleted_at IS NULL) AS reposted,
            (SELECT COUNT(*) FROM reactions lr
              WHERE lr.target_type='post' AND lr.target_id = po.id AND lr.type='like'
                AND lr.user_id = ?2) AS liked,
            po.repost_of_id,
            op.body AS r_body, op.created_at AS r_created_at,
            ou.handle AS r_handle, opf.display_name AS r_display_name,
            opf.avatar_url AS r_avatar_url,
            rpr.slug AS r_project_slug, rpr.title AS r_project_title,
            (SELECT COUNT(*) FROM follows f
               WHERE f.follower_id = ?2 AND f.followed_id = po.author_id) AS author_following
       FROM posts po
       JOIN users u ON u.id = po.author_id
       JOIN profiles p ON p.user_id = po.author_id
       LEFT JOIN projects pr
              ON pr.id = po.project_id
             AND (pr.visibility <> 'private' OR pr.owner_id = ?2)
       LEFT JOIN posts op
              ON op.id = po.repost_of_id
             AND op.deleted_at IS NULL
             AND op.visibility = 'public'
       LEFT JOIN users ou
              ON ou.id = op.author_id AND ou.status = 'active'
       LEFT JOIN profiles opf
              ON opf.user_id = op.author_id
             AND (opf.visibility <> 'private' OR op.author_id = ?2)
       LEFT JOIN projects rpr
              ON rpr.id = op.project_id
             AND (rpr.visibility <> 'private' OR rpr.owner_id = ?2)
      WHERE po.id = ?1 AND po.deleted_at IS NULL AND u.status = 'active'`,
    params.id,
    me?.id ?? "·none·",
  );

  if (!post) throw new Response("Not Found", { status: 404 });
  if (post.visibility === "private" && post.author_id !== me?.id) {
    throw new Response("Not Found", { status: 404 });
  }
  if (post.author_visibility === "private" && post.author_id !== me?.id) {
    throw new Response("Not Found", { status: 404 });
  }

  const comments = await many<{
    id: string;
    body: string;
    created_at: number;
    author_id: string;
    handle: string;
    display_name: string;
    avatar_url: string | null;
  }>(
    context,
    `SELECT c.id, c.body, c.created_at, c.author_id,
            u.handle, p.display_name, p.avatar_url
       FROM comments c
       JOIN users u ON u.id = c.author_id
       JOIN profiles p ON p.user_id = c.author_id
      WHERE c.post_id = ?1 AND c.deleted_at IS NULL
      ORDER BY c.created_at ASC`,
    post.id,
  );


  return {
    me,
    post: {
      ...post,
      time_label: relativeTime(post.created_at),
      // computed here so hydration never sees a different clock than SSR
      r_time_label: post.r_created_at
        ? relativeTime(post.r_created_at)
        : relativeTime(post.created_at),
    },
    comments: comments.map((c) => ({ ...c, time_label: relativeTime(c.created_at) })),
  };
}

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data?.post) return [{ title: "动态不存在 — ImFDE" }];
  const body = (data.post.body.trim() || data.post.r_body || "转发动态").slice(0, 150);
  return [
    { title: `${data.post.display_name}：${(data.post.body.trim() || data.post.r_body || "转发动态").slice(0, 40)} — ImFDE` },
    { name: "description", content: body },
    { property: "og:title", content: `${data.post.display_name} on ImFDE` },
    { property: "og:description", content: body },
    { property: "og:type", content: "article" },
  ];
};

export default function Post({ loaderData }: Route.ComponentProps) {
  const { me, post, comments } = loaderData;
  const navigate = useNavigate();
  const likeFetcher = useFetcher();
  const bookmarkFetcher = useFetcher();
  const repostFetcher = useFetcher();
  const quoteFetcher = useFetcher();
  const commentFetcher = useFetcher();
  const heartRef = useRef<HTMLButtonElement>(null);
  const heartControls = useAnimationControls();
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const [reposted, setReposted] = useState(Boolean(post.reposted));
  const [repostOpen, setRepostOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(Boolean(post.bookmarked));
  const [copied, setCopied] = useState(false);
  const [localComments, setLocalComments] = useState(comments);

  const likeIntent = likeFetcher.formData?.get("intent");
  const isLiked = likeIntent ? likeIntent === "like" : Boolean(post.liked);
  const likeCount =
    likeIntent === "like" && !post.liked
      ? post.likes + 1
      : likeIntent === "unlike" && post.liked
        ? post.likes - 1
        : post.likes;

  useEffect(() => {
    const data = repostFetcher.data as { ok?: boolean; reposted?: boolean } | undefined;
    if (!data?.ok) return;
    setReposted(Boolean(data.reposted));
    setRepostOpen(false);
    toast.success(data.reposted ? "已转发到广场" : "已取消转发");
  }, [repostFetcher.data]);

  useEffect(() => {
    if ((quoteFetcher.data as { ok?: boolean } | undefined)?.ok) {
      setRepostOpen(false);
      toast.success("引用已发布");
    }
  }, [quoteFetcher.data]);

  useEffect(() => {
    const data = bookmarkFetcher.data as { ok?: boolean; bookmarked?: boolean } | undefined;
    if (!data?.ok) return;
    setBookmarked(Boolean(data.bookmarked));
    toast.success(data.bookmarked ? "已加入收藏" : "已取消收藏");
  }, [bookmarkFetcher.data]);

  useEffect(() => {
    const data = commentFetcher.data as { ok?: boolean; error?: string; id?: string } | undefined;
    if (!data) return;
    if (data.ok && data.id) {
      setLocalComments((list) => [
        ...list,
        {
          id: data.id!,
          body: commentRef.current?.value ?? "",
          created_at: Date.now(),
          author_id: me?.id ?? "",
          handle: me?.handle ?? "",
          display_name: me?.display_name ?? "",
          avatar_url: me?.avatar_url ?? null,
          time_label: "刚刚",
        },
      ]);
      if (commentRef.current) commentRef.current.value = "";
      toast.success("评论已发布");
    } else if (data.error) {
      toast.error(data.error);
    }
  }, [commentFetcher.data, me]);

  function like() {
    if (!isLiked) {
      heartControls.start({
        scale: [1, 1.35, 0.9, 1],
        transition: { duration: 0.34, times: [0, 0.35, 0.7, 1] },
      });
      fireLikeBurst(heartRef.current);
    }
  }

  async function share() {
    const url = new URL(`/posts/${post.id}`, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("链接已复制");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("复制失败");
    }
  }

  return (
    <article className="max-w-[760px]">
      <div className="sticky top-0 z-20 -mx-5 mb-6 flex h-[52px] items-center gap-3 border-b border-[#eef0f2] bg-white/85 px-5 backdrop-blur-md md:-mx-10 md:px-10">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/feed"))}
          className="grid h-8 w-8 place-items-center rounded-full text-[#4a5264] transition hover:bg-[#f6f6f6] hover:text-[#14171f]"
          aria-label="返回"
        >
          <ArrowLeft size={17} strokeWidth={1.65} aria-hidden />
        </button>
        <span className="text-[15px] font-semibold text-[#14171f]">动态</span>
        <span className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={share}
            aria-label="复制链接"
            className="grid h-8 w-8 place-items-center rounded-full text-[#4a5264] transition hover:bg-[#f6f6f6]"
          >
            {copied ? <Check size={16} strokeWidth={1.65} aria-hidden /> : <Link2 size={16} strokeWidth={1.65} aria-hidden />}
          </button>
          {me?.id === post.author_id && (
            <Link to={`/posts/${post.id}/edit`} className="text-[12.5px] text-[#4a5264] hover:text-[#14171f]">
              编辑
            </Link>
          )}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <AuthorHoverCard
          author={{
            author_id: post.author_id,
            author_headline: post.author_headline,
            author_hide_follows: post.author_hide_follows,
            author_projects: post.author_projects,
            author_followers: post.author_followers,
          }}
          handle={post.handle}
          displayName={post.display_name}
          avatarUrl={post.avatar_url}
          signedIn={Boolean(me)}
          following={Boolean(post.author_following)}
        >
          <Link to={`/@${post.handle}`} className="flex min-w-0 items-center gap-3 transition hover:opacity-80">
            <Avatar name={post.display_name} src={post.avatar_url} size={44} />
            <div>
              <p className="text-[15px] font-medium">{post.display_name}</p>
              <p className="font-mono text-[11.5px] tracking-wide text-[var(--color-faint)]">
                @{post.handle} · {post.time_label}
              </p>
            </div>
          </Link>
        </AuthorHoverCard>
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          {me?.id !== post.author_id && (
            <FollowButton
              targetId={post.author_id}
              following={Boolean(post.author_following)}
              signedIn={Boolean(me)}
              size="sm"
              tone="quiet"
            />
          )}
          <span className="chip chip-teal !h-[26px]">{KIND_LABEL[post.kind] ?? post.kind}</span>
        </span>
      </div>

      {post.body.trim() !== "" && (
        <PostBody body={post.body} className="mt-5 text-[17px] leading-[1.8] text-[var(--color-ink)]" />
      )}

      {post.repost_of_id && post.r_body !== null && (
        <div className="mt-4 rounded-[12px] border border-[var(--color-line)] p-4">
          <div className="flex items-center gap-2">
            <Avatar name={post.r_display_name ?? "?"} src={post.r_avatar_url} size={24} />
            <Link to={`/@${post.r_handle}`} className="text-[13.5px] font-semibold hover:opacity-70">
              {post.r_display_name}
            </Link>
            <span className="font-mono text-[11px] text-[var(--color-faint)]">
              @{post.r_handle} · {post.r_time_label}
            </span>
          </div>
          <PostBody body={post.r_body} className="mt-2 text-[14.5px] leading-[1.65] text-[var(--color-ink-soft)]" />
          {post.r_project_slug && (
            <Link to={`/projects/${post.r_project_slug}`} className="mt-2 block text-[12.5px] text-[var(--color-faint)] hover:text-[var(--color-ink)]">
              作品：{post.r_project_title}
            </Link>
          )}
        </div>
      )}

      {post.repost_of_id && post.r_body === null && (
        <div className="mt-4 rounded-[12px] border border-dashed border-[var(--color-line)] px-4 py-3 text-[13px] text-[var(--color-faint)]">
          原动态已删除或不可见
        </div>
      )}

      {post.project_slug && (
        <Link to={`/projects/${post.project_slug}`} className="mt-5 flex items-center gap-2.5 rounded-[var(--radius-field)] border border-[var(--color-line)] bg-[var(--color-sunken)] px-4 py-3 text-[13.5px] transition hover:border-[var(--color-ink-soft)]">
          <span className="chip !h-[22px] !text-[10.5px]">作品</span>
          <span className="truncate">{post.project_title}</span>
          <span className="ml-auto shrink-0 text-[var(--color-faint)]">→</span>
        </Link>
      )}

      <div className="mt-6 flex items-center justify-between border-y border-[#eef0f2] py-2">
        <button type="button" aria-label="评论" onClick={() => commentRef.current?.focus()} className="action-btn action-link">
          <MessageCircle size={16} strokeWidth={1.65} aria-hidden />
          <SlidingNumber value={localComments.length} />
        </button>

        <Popover.Root open={repostOpen} onOpenChange={setRepostOpen}>
          <Popover.Trigger asChild>
            <button aria-label="转发" className={`action-btn action-repost ${reposted ? "bg-[rgba(16,185,129,0.10)] text-[#10b981]" : ""}`}>
              <Repeat2 size={16} strokeWidth={1.65} aria-hidden />
              <SlidingNumber value={post.reposts + (reposted ? 1 : 0)} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content side="bottom" align="start" sideOffset={6} className="pop-in z-50 w-[320px] rounded-[14px] border border-[rgba(20,23,31,0.10)] bg-white p-3 shadow-[0_12px_32px_rgba(16,24,40,0.12)] outline-none">
              <div className="mb-2.5 flex items-center justify-between border-b border-[#eef0f2] pb-2.5">
                <span className="text-[12px] font-medium">转发到广场</span>
                {me && (
                  <repostFetcher.Form method="post" action="/actions/repost">
                    <input type="hidden" name="post_id" value={post.id} />
                    <input type="hidden" name="body" value="" />
                    <input type="hidden" name="intent" value={reposted ? "unrepost" : "repost"} />
                    <button disabled={repostFetcher.state !== "idle"} className={`rounded-full px-3 py-1 text-[12px] font-medium transition disabled:opacity-50 ${reposted ? "text-[#10b981] hover:bg-[rgba(16,185,129,0.10)]" : "text-[var(--color-ink-soft)] hover:bg-[var(--color-paper)]"}`}>
                      {reposted ? "取消转发" : "直接转发"}
                    </button>
                  </repostFetcher.Form>
                )}
              </div>
              {me ? (
                <quoteFetcher.Form method="post" action="/actions/repost" className="space-y-2">
                  <input type="hidden" name="post_id" value={post.id} />
                  <input type="hidden" name="intent" value="repost" />
                  <textarea name="body" rows={2} placeholder="加一句你的看法进行引用…" className="field field-area !min-h-[64px] !text-[13px]" />
                  <div className="flex justify-end">
                    <button disabled={quoteFetcher.state !== "idle"} className="btn btn-primary btn-sm disabled:opacity-50">引用转发</button>
                  </div>
                </quoteFetcher.Form>
              ) : (
                <Link to="/login?next=%2Fposts" className="text-[12px] text-[var(--color-ink-soft)] hover:underline">登录后参与转发</Link>
              )}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {me ? (
          <likeFetcher.Form method="post" action="/actions/like">
            <input type="hidden" name="target_type" value="post" />
            <input type="hidden" name="target_id" value={post.id} />
            <input type="hidden" name="intent" value={isLiked ? "unlike" : "like"} />
            <button
              ref={heartRef}
              type="submit"
              onClick={like}
              aria-pressed={isLiked}
              aria-label={isLiked ? "取消赞" : "赞"}
              className={`action-btn action-like ${isLiked ? "text-[#f43f5e]" : ""}`}
            >
              <motion.span animate={heartControls} className="grid place-items-center">
                <Heart size={16} strokeWidth={1.65} fill={isLiked ? "currentColor" : "none"} aria-hidden />
              </motion.span>
              <SlidingNumber value={likeCount} />
            </button>
          </likeFetcher.Form>
        ) : (
          <Link to={`/login?next=${encodeURIComponent(`/posts/${post.id}`)}`} aria-label="登录后点赞" className="action-btn action-like">
            <Heart size={16} strokeWidth={1.65} aria-hidden />
            <SlidingNumber value={post.likes} />
          </Link>
        )}

        {me ? (
          <bookmarkFetcher.Form method="post" action="/actions/bookmark">
            <input type="hidden" name="target_type" value="post" />
            <input type="hidden" name="target_id" value={post.id} />
            <input type="hidden" name="intent" value={bookmarked ? "unbookmark" : "bookmark"} />
            <button aria-pressed={bookmarked} aria-label={bookmarked ? "取消收藏" : "收藏"} className={`action-btn action-link ${bookmarked ? "text-[var(--color-link)]" : ""}`}>
              <Bookmark size={16} strokeWidth={1.65} fill={bookmarked ? "currentColor" : "none"} aria-hidden />
            </button>
          </bookmarkFetcher.Form>
        ) : (
          <Link to={`/login?next=${encodeURIComponent(`/posts/${post.id}`)}`} aria-label="登录后收藏" className="action-btn action-link">
            <Bookmark size={16} strokeWidth={1.65} aria-hidden />
          </Link>
        )}

        <button type="button" onClick={share} aria-label="复制链接" className={`action-btn ${copied ? "text-[var(--color-repost)]" : ""}`}>
          {copied ? <Check size={16} strokeWidth={1.65} aria-hidden /> : <Link2 size={16} strokeWidth={1.65} aria-hidden />}
        </button>
      </div>

      <section id="comments" className="mt-6">
        {localComments.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-[var(--color-muted)]">还没有评论。</p>
        ) : (
          <div className="space-y-4">
            {localComments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Link to={`/@${c.handle}`} className="shrink-0">
                  <Avatar name={c.display_name} src={c.avatar_url} size={32} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[12.5px]">
                    <Link to={`/@${c.handle}`} className="font-medium hover:text-[var(--color-ink)]">{c.display_name}</Link>
                    <span className="font-mono text-[10.5px] text-[var(--color-faint)]">{c.time_label}</span>
                    {me?.id === c.author_id && (
                      <ConfirmDialog
                        action="/actions/comment"
                        hidden={{ intent: "delete", post_id: post.id, comment_id: c.id, response: "json" }}
                        title="删除这条评论？"
                        description="删除后不会再显示，且无法恢复。"
                        trigger={
                          <button type="button" className="text-[11.5px] text-[var(--color-faint)] hover:text-[var(--color-ink)]">删除</button>
                        }
                      />
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[14px] leading-[1.75] text-[var(--color-ink-2)]">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {me ? (
          <commentFetcher.Form method="post" action="/actions/comment" className="mt-6">
            <input type="hidden" name="post_id" value={post.id} />
            <input type="hidden" name="response" value="json" />
            <textarea
              ref={commentRef}
              name="body"
              required
              maxLength={2000}
              id="comment-input"
              placeholder="说说你的看法……"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              className="field field-area !min-h-[96px]"
            />
            <div className="mt-2 flex justify-end">
              <button
                disabled={commentFetcher.state !== "idle"}
                className="btn btn-primary btn-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {commentFetcher.state !== "idle" ? "发送中…" : "评论"}
              </button>
            </div>
          </commentFetcher.Form>
        ) : (
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--color-line-soft)] pt-5">
            <p className="text-[13.5px] text-[var(--color-ink-soft)]">登录后可以参与讨论。</p>
            <Link to="/login" className="btn btn-primary btn-sm shrink-0">登录</Link>
          </div>
        )}
      </section>
    </article>
  );
}
