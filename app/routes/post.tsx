import type { Route } from "./+types/post";
import { Form, Link, useFetcher } from "react-router";
import { getMe } from "~/lib/session.server";
import { many, one } from "~/lib/db.server";
import { Avatar } from "~/components/media";
import { FollowButton } from "~/components/cards";
import { CopyLinkButton } from "~/components/copy-link";
import { Heart } from "lucide-react";
import { absoluteDate, compact, relativeTime } from "~/lib/format";
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
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const me = await getMe(context, request);

  const post = await one<PostDetail>(
    context,
    `SELECT po.id, po.kind, po.body, po.created_at, po.author_id,
            u.handle, p.display_name, p.avatar_url, p.headline,
            p.visibility AS author_visibility,
            pr.slug AS project_slug, pr.title AS project_title,
            (SELECT COUNT(*) FROM reactions r
              WHERE r.target_type='post' AND r.target_id = po.id AND r.type='like') AS likes,
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
       LEFT JOIN projects pr ON pr.id = po.project_id
       LEFT JOIN posts op    ON op.id = po.repost_of_id AND op.deleted_at IS NULL
       LEFT JOIN users ou    ON ou.id = op.author_id
       LEFT JOIN profiles opf ON opf.user_id = op.author_id
       LEFT JOIN projects rpr ON rpr.id = op.project_id
      WHERE po.id = ?1 AND po.deleted_at IS NULL`,
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

  const liked = me
    ? await one<{ n: number }>(
        context,
        `SELECT COUNT(*) AS n FROM reactions
          WHERE user_id = ?1 AND target_type='post' AND target_id = ?2 AND type='like'`,
        me.id,
        post.id,
      )
    : null;

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
    liked: Boolean(liked?.n),
  };
}

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data?.post) return [{ title: "动态不存在 — iMFDE" }];
  const body = (data.post.body.trim() || data.post.r_body || "").slice(0, 150);
  return [
    { title: `${data.post.display_name}：${data.post.body.slice(0, 40)} — iMFDE` },
    { name: "description", content: body },
    { property: "og:title", content: `${data.post.display_name} on iMFDE` },
    { property: "og:description", content: body },
    { property: "og:type", content: "article" },
  ];
};

export default function Post({ loaderData }: Route.ComponentProps) {
  const { me, post, comments, liked } = loaderData;
  const likeFetcher = useFetcher();
  const likeIntent = likeFetcher.formData?.get("intent");
  const isLiked = likeIntent ? likeIntent === "like" : liked;
  const likeCount =
    likeIntent === "like" && !liked
      ? post.likes + 1
      : likeIntent === "unlike" && liked
        ? post.likes - 1
        : post.likes;

  return (
    <article className="max-w-[760px]">
      <div className="flex items-center gap-3">
        <Link
          to={`/@${post.handle}`}
          className="flex min-w-0 items-center gap-3 transition hover:opacity-80"
        >
          <Avatar name={post.display_name} src={post.avatar_url} size={44} />
          <div>
            <p className="text-[15px] font-medium">{post.display_name}</p>
            <p className="font-mono text-[11.5px] tracking-wide text-[var(--color-faint)]">
              @{post.handle} · {post.time_label}
            </p>
          </div>
        </Link>
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
          <CopyLinkButton
            path={`/posts/${post.id}`}
            label=""
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full text-[var(--color-faint)] transition hover:text-[var(--color-ink)]"
          />
          <span className="chip chip-teal !h-[26px]">
            {KIND_LABEL[post.kind] ?? post.kind}
          </span>
          {me?.id === post.author_id && (
            <Link
              to={`/posts/${post.id}/edit`}
              className="chip !h-[26px] hover:!bg-[var(--color-sunken-deep)]"
            >
              编辑
            </Link>
          )}
        </span>
      </div>

      {post.body.trim() !== "" && (
        <PostBody
          body={post.body}
          className="mt-5 text-[17px] leading-[1.8] text-[var(--color-ink)]"
        />
      )}

      {post.repost_of_id && post.r_body !== null && (
        <div className="mt-4 rounded-[12px] border border-[var(--color-line)] p-4">
          <div className="flex items-center gap-2">
            <Avatar name={post.r_display_name ?? "?"} src={post.r_avatar_url} size={24} />
            <Link
              to={`/@${post.r_handle}`}
              className="text-[13.5px] font-semibold hover:opacity-70"
            >
              {post.r_display_name}
            </Link>
            <span className="font-mono text-[11px] text-[var(--color-faint)]">
              @{post.r_handle} · {post.r_time_label}
            </span>
          </div>
          <PostBody
            body={post.r_body}
            className="mt-2 text-[14.5px] leading-[1.65] text-[var(--color-ink-soft)]"
          />
          {post.r_project_slug && (
            <Link
              to={`/projects/${post.r_project_slug}`}
              className="mt-2 block text-[12.5px] text-[var(--color-faint)] hover:text-[var(--color-ink)]"
            >
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
        <Link
          to={`/projects/${post.project_slug}`}
          className="mt-5 flex items-center gap-2.5 rounded-[var(--radius-field)] border border-[var(--color-line)] bg-[var(--color-sunken)] px-4 py-3 text-[13.5px] transition hover:border-[var(--color-ink-soft)]"
        >
          <span className="chip !h-[22px] !text-[10.5px]">作品</span>
          <span className="truncate">{post.project_title}</span>
          <span className="ml-auto shrink-0 text-[var(--color-faint)]">→</span>
        </Link>
      )}

      <div className="mt-6 flex items-center gap-1 border-y border-[var(--color-line-soft)] py-2.5">
        {me ? (
          <likeFetcher.Form method="post" action="/actions/like">
            <input type="hidden" name="target_type" value="post" />
            <input type="hidden" name="target_id" value={post.id} />
            <input type="hidden" name="intent" value={isLiked ? "unlike" : "like"} />
            <button
              aria-pressed={isLiked}
              aria-label={isLiked ? "取消赞" : "赞"}
              className={`flex min-h-[32px] items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] transition hover:bg-[var(--color-sunken)] ${
                isLiked ? "text-[var(--color-watermelon)]" : "text-[var(--color-muted)]"
              }`}
            >
              <Heart
                size={15}
                strokeWidth={1.65}
                fill={isLiked ? "currentColor" : "none"}
                className={isLiked ? "like-pop" : ""}
                aria-hidden
              />
              <span className="tabular-nums">{likeCount > 0 ? compact(likeCount) : "赞"}</span>
            </button>
          </likeFetcher.Form>
        ) : (
          <Link
            to={`/login?next=${encodeURIComponent(`/posts/${post.id}`)}`}
            aria-label="登录后点赞"
            className="flex min-h-[32px] items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] text-[var(--color-muted)] transition hover:bg-[var(--color-sunken)]"
          >
            <Heart size={15} strokeWidth={1.65} aria-hidden />
            <span className="tabular-nums">{post.likes > 0 ? compact(post.likes) : "赞"}</span>
          </Link>
        )}
        <span className="text-[13px] text-[var(--color-muted)]">
          {comments.length} 条评论
        </span>
        <p className="ml-auto text-[12px] text-[var(--color-faint)]">
          {absoluteDate(post.created_at)}
        </p>
      </div>

      <section id="comments" className="mt-6">
        {comments.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-[var(--color-muted)]">
            还没有评论。
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Link to={`/@${c.handle}`} className="shrink-0">
                  <Avatar name={c.display_name} src={c.avatar_url} size={32} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[12.5px]">
                    <Link
                      to={`/@${c.handle}`}
                      className="font-medium hover:text-[var(--color-ink)]"
                    >
                      {c.display_name}
                    </Link>
                    <span className="font-mono text-[10.5px] text-[var(--color-faint)]">
                      {c.time_label}
                    </span>
                    {me?.id === c.author_id && (
                      <Form method="post" action="/actions/comment">
                        <input type="hidden" name="post_id" value={post.id} />
                        <input type="hidden" name="comment_id" value={c.id} />
                        <input type="hidden" name="intent" value="delete" />
                        <button className="text-[11.5px] text-[var(--color-faint)] hover:text-[var(--color-ink)]">
                          删除
                        </button>
                      </Form>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[14px] leading-[1.75] text-[var(--color-ink-2)]">
                    {c.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {me ? (
          <form method="post" action="/actions/comment" className="mt-6">
            <input type="hidden" name="post_id" value={post.id} />
            <textarea
              name="body"
              required
              maxLength={2000}
              placeholder="说说你的看法……"
              className="field field-area !min-h-[96px]"
            />
            <div className="mt-2 flex justify-end">
              <button className="btn btn-primary btn-sm">评论</button>
            </div>
          </form>
        ) : (
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--color-line-soft)] pt-5">
            <p className="text-[13.5px] text-[var(--color-ink-soft)]">
              登录后可以参与讨论。
            </p>
            <Link to="/login" className="btn btn-primary btn-sm shrink-0">
              登录
            </Link>
          </div>
        )}
      </section>
    </article>
  );
}
