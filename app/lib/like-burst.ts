import confetti from "canvas-confetti";

/**
 * One canvas-confetti instance for the whole page. Every like button calls
 * this with its own DOM node; the burst originates at the heart icon, and no
 * <canvas> is mounted per card. Safe to call on the server (no-ops there).
 */
export function fireLikeBurst(button: HTMLElement | null) {
  if (typeof window === "undefined" || !button) return;
  const rect = button.getBoundingClientRect();
  const x = rect.width ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect.height ? rect.top + rect.height / 2 : window.innerHeight / 2;

  void confetti({
    particleCount: 14,
    spread: 60,
    startVelocity: 24,
    gravity: 0.9,
    scalar: 0.72,
    ticks: 180,
    disableForReducedMotion: true,
    origin: {
      x: Math.min(1, Math.max(0, x / window.innerWidth)),
      y: Math.min(1, Math.max(0, y / window.innerHeight)),
    },
    colors: ["#f43f5e", "#f59e0b", "#10b981", "#0ea5e9", "#8f6fdb"],
  });
}
