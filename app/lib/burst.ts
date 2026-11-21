import confetti from "canvas-confetti";

/**
 * One canvas-confetti instance for the whole page. The canvas is created on
 * demand by the library and removed when the burst finishes, so no card ever
 * mounts its own <canvas>. Safe to call on the server (no-ops there).
 */
export function fireLikeBurst(el: HTMLElement | null) {
  if (typeof window === "undefined" || !el) return;
  const rect = el.getBoundingClientRect();
  void confetti({
    particleCount: 14,
    spread: 64,
    startVelocity: 24,
    gravity: 0.9,
    decay: 0.88,
    scalar: 0.65,
    ticks: 55,
    origin: {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    },
    colors: ["#f43f5e", "#fb7185", "#f59e0b", "#10b981", "#0ea5e9"],
    disableForReducedMotion: true,
  });
}
