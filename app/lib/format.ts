/** Small formatting helpers shared by server and client renders. */

export function relativeTime(ms: number, now = Date.now()): string {
  const diff = Math.max(0, now - ms);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;

  if (diff < min) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / min)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))} 个月前`;
  return `${Math.floor(diff / (365 * day))} 年前`;
}

export function absoluteDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

export function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${Math.round(n / 1000)}k`;
}

export function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // CJK: take the first character. Latin: first letters of up to two words.
  if (/[\u4e00-\u9fa5]/.test(trimmed)) return trimmed.slice(0, 1);
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

/** Deterministic 0..1 from a string, so gradients are stable per seed. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // murmur3 finaliser. Plain FNV leaves the high bits poorly mixed, so short
  // seeds that differ by one character (agent-1, agent-2 …) all landed in
  // the same bucket and every card got the same cover.
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Saturated accents for avatars — small areas can take real colour. */
const ACCENTS = [
  "#cbabff",
  "#f3ca4d",
  "#ff989a",
  "#a8d8de",
  "#e4e8f7",
  "#d6e3b4",
  "#f0c9a8",
];

/**
 * Cover duotone in two lightness steps plus one accent mark. Large flat
 * areas need low saturation or adjacent hues turn into mud.
 */
const COVERS: Array<[string, string, string]> = [
  ["#eef1f9", "#dde5f5", "#6a57e3"],
  ["#e9f4f4", "#d6ebee", "#0e8696"],
  ["#fdf3e3", "#f8e7c9", "#b07c1c"],
  ["#fdeeee", "#f9dedf", "#b04a4d"],
  ["#efeafa", "#e3daf7", "#6a57e3"],
  ["#eef3ea", "#dfe9d7", "#4e6b3c"],
  ["#f5eef0", "#ecdfe4", "#8a5568"],
];

export function coverPalette(seed: string): {
  ta: string;
  tb: string;
  mark: string;
} {
  const c = COVERS[Math.floor(hash(seed) * COVERS.length)]!;
  return { ta: c[0], tb: c[1], mark: c[2] };
}

/**
 * Placeholder photography for work that has no cover of its own. Ten openly
 * licensed Unsplash shots (via picsum.photos), chosen for texture and
 * structure rather than subject, so a grid of them reads as a considered
 * series instead of stock filler. The palette above still tints each one, so
 * they stay in the same family as the generated covers.
 */
const COVER_PHOTOS = [
  "/covers/01.webp",
  "/covers/02.webp",
  "/covers/03.webp",
  "/covers/04.webp",
  "/covers/05.webp",
  "/covers/06.webp",
  "/covers/07.webp",
  "/covers/08.webp",
  "/covers/09.webp",
  "/covers/10.webp",
];

export function coverPhoto(seed: string): string {
  return COVER_PHOTOS[Math.floor(hash(seed) * COVER_PHOTOS.length)]!;
}

export function avatarTint(seed: string): string {
  return ACCENTS[Math.floor(hash(seed + "·avatar") * ACCENTS.length)]!;
}

export const SKILL_GROUPS = [
  "Agent 与自动化",
  "模型与推理",
  "数据与管道",
  "前端与体验",
  "后端与服务",
  "云与部署",
  "行业领域",
] as const;

/**
 * URL slugs stay ASCII on purpose. A CJK title would otherwise become a
 * percent-encoded path that breaks when shared, indexed or pasted into chat,
 * so it falls back to a generic stem plus a short suffix.
 */
export function slugify(input: string): string {
  const ascii = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  if (ascii.length >= 2) return ascii;
  return `work-${Math.random().toString(36).slice(2, 8)}`;
}

/** UTC+8 calendar day key (YYYY-MM-DD) for daily quota accounting. */
export function utc8DayKey(ms: number = Date.now()): string {
  const shifted = new Date(ms + 8 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}
