"use client";
import { useEffect, useRef, useState } from "react";

const SOURCES = [
  "/videos/hero-01.mp4",
  "/videos/hero-02.mp4",
  "/videos/hero-03.mp4",
  "/videos/hero-04.mp4",
  "/videos/hero-05.mp4",
];
const POSTER = "/videos/hero-01-poster.webp";
const DURATION_MS = 5800;

const MEDIA =
  "absolute inset-0 h-full w-full object-cover scale-[1.03] blur-[1.5px] saturate-[0.88] brightness-[1.02] contrast-[1.02] transition-opacity duration-[1300ms] ease-in-out";

/**
 * Progressive-enhancement hero backdrop. SSR emits a static poster;
 * after hydration a single client component cross-fades two <video> slots so
 * at most two clips are ever requested. Honours reduced-motion and tab visibility.
 */
export function HeroVideoBg() {
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  // `turn` counts transitions. A shows sources[turn % 5], B shows sources[(turn+1) % 5].
  // `showB` decides which slot is visible (the other preloads the next clip).
  const [turn, setTurn] = useState(0);
  const [showB, setShowB] = useState(false);
  const timer = useRef<number | null>(null);
  const slotA = useRef<HTMLVideoElement>(null);
  const slotB = useRef<HTMLVideoElement>(null);
  const turnRef = useRef(0);
  turnRef.current = turn;

  useEffect(() => {
    setReady(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const advance = () => {
    clearTimer();
    const nextTurn = turnRef.current + 1;
    turnRef.current = nextTurn;
    setTurn(nextTurn);
    setShowB((b) => !b);
  };

  // The visible slot plays; schedule the fallback timer. onEnded also advances.
  useEffect(() => {
    if (!ready || reduced) return;
    const visible = showB ? slotB.current : slotA.current;
    if (visible) {
      visible.muted = true;
      void visible.play().catch(() => {});
    }
    clearTimer();
    timer.current = window.setTimeout(advance, DURATION_MS);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reduced, showB, turn]);

  useEffect(() => {
    if (!ready || reduced) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        slotA.current?.pause();
        slotB.current?.pause();
        clearTimer();
      } else {
        const visible = showB ? slotB.current : slotA.current;
        if (visible) void visible.play().catch(() => {});
        clearTimer();
        timer.current = window.setTimeout(advance, DURATION_MS);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reduced, showB]);

  // Source assignment: visible slot holds `turn`, the other preloads next.
  const visibleSrc = SOURCES[turn % SOURCES.length];
  const hiddenSrc = SOURCES[(turn + 1) % SOURCES.length];
  const aSrc = showB ? hiddenSrc : visibleSrc;
  const bSrc = showB ? visibleSrc : hiddenSrc;

  // SSR and reduced-motion: static poster only, zero .mp4 requests.
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden>
      {/* Base image always paints, including SSR; videos fade in above it. */}
      <img src={POSTER} alt="" className={`${MEDIA} ${ready && !reduced ? "opacity-[0.22]" : "opacity-[0.68]"}`} />
      {ready && !reduced && (
        <>
          <video
            key={`a-${aSrc}`}
            ref={slotA}
            src={aSrc}
            muted
            playsInline
            loop={false}
            preload="auto"
            onEnded={advance}
            className={`${MEDIA} ${showB ? "opacity-0" : "opacity-[0.68]"}`}
          />
          <video
            key={`b-${bSrc}`}
            ref={slotB}
            src={bSrc}
            muted
            playsInline
            loop={false}
            preload="auto"
            onEnded={advance}
            className={`${MEDIA} ${showB ? "opacity-[0.68]" : "opacity-0"}`}
          />
        </>
      )}
      {/* Guard the transparent nav, keep the central headline legible, and
          dissolve into the page over 288px so no rectangular edge is visible. */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/75 via-white/35 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_52%_42%_at_50%_38%,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.22)_56%,rgba(255,255,255,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-white via-white/85 via-35% to-transparent" />
    </div>
  );
}
