import { Link, useFetcher, useLocation } from "react-router";

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

