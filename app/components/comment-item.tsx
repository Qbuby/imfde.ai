import { useState } from "react";
import { Link, useFetcher } from "react-router";
import * as Popover from "@radix-ui/react-popover";
import { motion, useAnimationControls } from "motion/react";
import { toast } from "sonner";
import { Bookmark, Heart, Link2, MessageCircle, Repeat2 } from "lucide-react";
import { Avatar } from "./media";
import { AckIcon } from "./ack-button";
import { SlidingNumber } from "./motion/sliding-number";
import { ConfirmDialog } from "./confirm-dialog";

export interface CommentView {
  id: string;
  body: string;
  created_at: number;
  author_id: string;
  parent_id: string | null;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  reply_handle: string | null;
  likes: number;
  liked: number;
  acks: number;
  acked: number;
  replies_count: number;
  reposts: number;
  bookmarked: number;
  time_label: string;
  replyTo?: string;
}

/** A single comment with the same six actions as a feed post. */
export function CommentItem({
  c, postId, viewerId, self,
}: {
  c: CommentView;
  postId: string;
  viewerId: string | null;
  self: boolean;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [ackOn, setAckOn] = useState(Boolean(c.acked));
  const [likeOn, setLikeOn] = useState(Boolean(c.liked));
  const [bookmarkOn, setBookmarkOn] = useState(Boolean(c.bookmarked));
  const likeControls = useAnimationControls();
  const ackControls = useAnimationControls();
  const ackFetcher = useFetcher<any>();
  const likeFetcher = useFetcher<any>();
  const bookmarkFetcher = useFetcher<any>();
  const replyFetcher = useFetcher<any>();
  const [repostOpen, setRepostOpen] = useState(false);
  const repostFetcher = useFetcher<any>();

  const ackCount = c.acks + (ackOn && !c.acked ? 1 : !ackOn && c.acked ? -1 : 0);
  const likeCount = c.likes + (likeOn && !c.liked ? 1 : !likeOn && c.liked ? -1 : 0);

  const submitAck = () => {
    const fd = new FormData();
    fd.set("comment_id", c.id);
    fd.set("intent", ackOn ? "unack" : "ack");
    setAckOn(!ackOn);
    ackFetcher.submit(fd, { method: "post", action: "/actions/ack" });
  };
  const submitLike = () => {
    const fd = new FormData();
    fd.set("target_type", "comment");
    fd.set("target_id", c.id);
    fd.set("intent", likeOn ? "unlike" : "like");
    setLikeOn(!likeOn);
    if (!likeOn) likeControls.start({ scale: [1, 1.3, 0.94, 1], transition: { type: "spring", stiffness: 520, damping: 16 } });
    likeFetcher.submit(fd, { method: "post", action: "/actions/like" });
  };
  const submitBookmark = () => {
    const fd = new FormData();
    fd.set("target_type", "comment");
    fd.set("target_id", c.id);
    fd.set("intent", bookmarkOn ? "unbookmark" : "bookmark");
    setBookmarkOn(!bookmarkOn);
    bookmarkFetcher.submit(fd, { method: "post", action: "/actions/bookmark" });
  };
  const share = () => {
    const url = `${window.location.origin}/posts/${postId}#comment-${c.id}`;
    navigator.clipboard?.writeText(url).then(
      () => toast.success("链接已复制"),
      () => toast.error("复制失败"),
    );
  };

  return (
    <div id={`comment-${c.id}`} className="flex gap-3 scroll-mt-20 rounded-[10px] transition-colors">
      <Link to={`/@${c.handle}`} className="shrink-0">
        <Avatar name={c.display_name} src={c.avatar_url} size={32} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          <Link to={`/@${c.handle}`} className="font-medium hover:text-[var(--color-ink)]">{c.display_name}</Link>
          <span className="font-mono text-[10.5px] text-[var(--color-faint)]">{c.time_label}</span>
          {c.reply_handle && <span className="text-[11.5px] text-[#8b93a3]">回复 @{c.reply_handle}</span>}
          {self && (
            <ConfirmDialog
              action="/actions/comment"
              hidden={{ intent: "delete", post_id: postId, comment_id: c.id, response: "json" }}
              title="删除这条评论？"
              description="删除后不会再显示，且无法恢复。"
              trigger={<button type="button" className="text-[11.5px] text-[var(--color-faint)] hover:text-[var(--color-ink)]">删除</button>}
            />
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-[14px] leading-[1.75] text-[var(--color-ink-2)]">{c.body}</p>

        {/* the same six actions as a feed post */}
        <div className="mt-2 flex max-w-[480px] items-center justify-between gap-0.5 text-[12px] text-[var(--color-muted)] tabular-nums">
          {viewerId && viewerId !== c.author_id ? (
            <button type="button" onClick={submitAck} aria-label={ackOn ? "取消 ACK" : "ACK"} className={`action-btn ${ackOn ? "bg-[#eef2ff] text-[#4f46e5]" : ""}`}>
              <motion.span animate={ackControls} className="grid place-items-center"><AckIcon size={15} /></motion.span>
              {ackCount > 0 ? <SlidingNumber value={ackCount} /> : null}
            </button>
          ) : (
            <span className="action-btn cursor-default"><AckIcon size={15} />{ackCount > 0 ? <SlidingNumber value={ackCount} /> : null}</span>
          )}

          {viewerId ? (
            <button type="button" onClick={() => setReplyOpen((v) => !v)} aria-label="回复" className="action-btn action-link">
              <MessageCircle size={15} strokeWidth={1.65} aria-hidden />
              {c.replies_count > 0 ? <SlidingNumber value={c.replies_count} /> : null}
            </button>
          ) : (
            <Link to={`/login?next=%2Fposts%2F${postId}`} aria-label="回复" className="action-btn action-link"><MessageCircle size={15} strokeWidth={1.65} /></Link>
          )}

          {viewerId ? (
            <Popover.Root open={repostOpen} onOpenChange={setRepostOpen}>
              <Popover.Trigger asChild>
                <button type="button" aria-label="转发" className="action-btn action-repost"><Repeat2 size={15} strokeWidth={1.65} aria-hidden />{c.reposts > 0 ? <SlidingNumber value={c.reposts} /> : null}</button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content side="bottom" align="start" className="pop-in z-50 w-[240px] rounded-[12px] border border-[#e2e5ea] bg-white p-2 shadow-[0_14px_36px_rgba(15,20,25,0.10)]">
                  <repostFetcher.Form method="post" action="/actions/repost">
                    <input type="hidden" name="comment_id" value={c.id} />
                    <button type="submit" className="block w-full rounded-[8px] px-3 py-2 text-left text-[13px] hover:bg-[#f7f9f9]">转发到广场</button>
                  </repostFetcher.Form>
                  <Popover.Arrow className="fill-white" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          ) : (
            <Link to={`/login?next=%2Fposts%2F${postId}`} aria-label="转发" className="action-btn action-repost"><Repeat2 size={15} strokeWidth={1.65} /></Link>
          )}

          {viewerId ? (
            <button type="button" onClick={submitLike} aria-label={likeOn ? "取消赞" : "赞"} className={`action-btn action-like ${likeOn ? "bg-[rgba(0,186,124,0.10)] text-[#00ba7c]" : ""}`}>
              <motion.span animate={likeControls} className="grid place-items-center"><Heart size={15} strokeWidth={1.65} fill={likeOn ? "currentColor" : "none"} aria-hidden /></motion.span>
              {likeCount > 0 ? <SlidingNumber value={likeCount} /> : null}
            </button>
          ) : (
            <Link to={`/login?next=%2Fposts%2F${postId}`} aria-label="赞" className="action-btn action-like"><Heart size={15} strokeWidth={1.65} /></Link>
          )}

          {viewerId ? (
            <button type="button" onClick={submitBookmark} aria-label={bookmarkOn ? "取消收藏" : "收藏"} className={`action-btn action-link ${bookmarkOn ? "text-[#0f1419]" : ""}`}>
              <Bookmark size={15} strokeWidth={1.65} fill={bookmarkOn ? "currentColor" : "none"} aria-hidden />
            </button>
          ) : (
            <Link to={`/login?next=%2Fposts%2F${postId}`} aria-label="收藏" className="action-btn action-link"><Bookmark size={15} strokeWidth={1.65} /></Link>
          )}

          <button type="button" onClick={share} aria-label="分享" className="action-btn"><Link2 size={15} strokeWidth={1.65} aria-hidden /></button>
        </div>

        {replyOpen && viewerId && (
          <replyFetcher.Form
            method="post"
            action="/actions/comment"
            className="mt-2 rounded-[10px] border border-[#eff3f4] bg-[#f7f9f9] p-2"
            onSubmit={() => { /* revalidation refreshes the list */ setReplyOpen(false); }}
          >
            <input type="hidden" name="post_id" value={postId} />
            <input type="hidden" name="parent_id" value={c.id} />
            <input type="hidden" name="response" value="json" />
            <textarea name="body" required maxLength={2000} rows={2} placeholder={`回复 @${c.handle}…`}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
              className="field field-area !min-h-[56px] !bg-white" />
            <div className="mt-1 flex justify-end">
              <button disabled={replyFetcher.state !== "idle"} className="btn btn-primary btn-sm disabled:opacity-60">
                {replyFetcher.state !== "idle" ? "发送中…" : "回复"}
              </button>
            </div>
          </replyFetcher.Form>
        )}
      </div>
    </div>
  );
}
