import { useEffect, useRef, useState } from "react";
import { Link, useFetcher, useLocation } from "react-router";
import { motion, useAnimationControls } from "motion/react";
import { toast } from "sonner";
import { SlidingNumber } from "./motion/sliding-number";

/** Original mono-line ACK mark: a rounded signal chevron with a crisp check. */
export function AckIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1.6 13.4 4v4.1c0 3-2.2 5.3-5.4 6.3C4.8 13.4 2.6 11.1 2.6 8.1V4L8 1.6Z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
      <path d="m5.6 8 1.7 1.7 3.2-3.4" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AckButton({
  postId,
  acks,
  acked,
  viewerId,
  authorId,
}: {
  postId: string;
  acks: number;
  acked: boolean;
  viewerId: string | null;
  authorId: string;
}) {
  const fetcher = useFetcher<{ ok?: boolean; acked?: boolean; remaining?: number; error?: string }>();
  const location = useLocation();
  const [optimistic, setOptimistic] = useState(acked);
  const controls = useAnimationControls();
  const prevData = useRef(fetcher.data);
  const next = location.pathname + location.search;
  const isSelf = viewerId === authorId;
  const active = optimistic ? acks + 1 : acks;

  useEffect(() => {
    if (fetcher.data === prevData.current || !fetcher.data) return;
    prevData.current = fetcher.data;
    if (fetcher.data.ok) {
      setOptimistic(Boolean(fetcher.data.acked));
      if (fetcher.data.acked) {
        toast.success(`已送出 1 枚 ACK（今日剩余 ${fetcher.data.remaining}/2）`);
      } else {
        toast.success("已撤回 ACK");
      }
    } else if (fetcher.data.error) {
      setOptimistic(acked); // roll back on quota error
      toast.error(fetcher.data.error);
    }
  }, [fetcher.data, acked]);

  const count = (
    <span className="inline-flex items-center gap-1.5">
      <motion.span animate={controls} className="grid place-items-center">
        <AckIcon />
      </motion.span>
      {active > 0 ? <SlidingNumber value={active} /> : null}
    </span>
  );

  // Own post: read-only count, no clickable error state.
  if (isSelf) {
    return (
      <span className="action-btn cursor-default" title="同行送出的 ACK 数" aria-label={`ACK ${acks}`}>
        {count}
      </span>
    );
  }

  if (!viewerId) {
    return (
      <Link to={`/login?next=${encodeURIComponent(next)}`} className="action-btn" aria-label="登录后送 ACK">
        {count}
      </Link>
    );
  }

  // Explicit FormData avoids a React-controlled hidden input flipping its
  // value between click and submit serialisation.
  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={optimistic ? "取消 ACK" : "送 ACK"}
      title="同行致敬，每天限量 2 次"
      onClick={() => {
        const intent = optimistic ? "unack" : "ack";
        if (!optimistic) controls.start({ scale: [1, 1.32, 0.94, 1], transition: { type: "spring", stiffness: 520, damping: 16 } });
        setOptimistic(!optimistic);
        const fd = new FormData();
        fd.set("post_id", postId);
        fd.set("intent", intent);
        fetcher.submit(fd, { method: "post", action: "/actions/ack" });
      }}
      className={`action-btn ${optimistic ? "bg-[#eef2ff] text-[#4f46e5] hover:bg-[#e0e7ff] hover:text-[#4f46e5]" : "hover:bg-[#eef2ff] hover:text-[#4f46e5]"}`}
    >
      {count}
    </button>
  );
}
