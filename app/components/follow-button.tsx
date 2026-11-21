import { useState } from "react";
import { Link, useFetcher, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";

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
  const [hovered, setHovered] = useState(false);
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
  const justFollowed = isFollowing && !following;

  return (
    <fetcher.Form method="post" action="/actions/follow" className={className}>
      <input type="hidden" name="target_id" value={targetId} />
      <input type="hidden" name="intent" value={isFollowing ? "unfollow" : "follow"} />
      <motion.button
        type="submit"
        disabled={fetcher.state !== "idle"}
        whileTap={{ scale: 0.93 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={
          size === "sm"
            ? `h-[28px] rounded-full border px-3 text-[12.5px] transition-colors duration-200 disabled:opacity-60 ${
                isFollowing
                  ? hovered
                    ? "border-[#fecdd3] bg-[#fff1f2] text-[#e11d48]"
                    : "border-[var(--color-line)] text-[var(--color-faint)]"
                  : tone === "quiet"
                    ? "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                    : "border-[var(--color-ink-soft)] text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[#f7f9f9]"
              }`
            : `btn btn-sm ${isFollowing ? (hovered ? "btn-ghost !border-[#fecdd3] !bg-[#fff1f2] !text-[#e11d48]" : "btn-ghost") : "btn-primary"}`
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          {!isFollowing ? (
            <motion.span key="follow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-1.5">
              关注
            </motion.span>
          ) : hovered ? (
            <motion.span key="unfollow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-1.5">
              取消关注
            </motion.span>
          ) : (
            <motion.span key="following" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-1.5">
              {justFollowed && (
                <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 520, damping: 20 }}>
                  <Check size={13} strokeWidth={2.2} aria-hidden />
                </motion.span>
              )}
              已关注
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </fetcher.Form>
  );
}
