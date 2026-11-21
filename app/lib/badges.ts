/**
 * Low-saturation semantic micro-badges. One shared shape for post kinds and
 * work kinds: a soft tint, a readable label and a 5px colour dot. Used in the
 * feed timeline, post detail, gallery covers and project detail so the same
 * kind reads the same everywhere.
 */
export type BadgeStyle = {
  bg: string;
  text: string;
  dot: string;
  label: string;
};

export const POST_KIND_STYLE: Record<string, BadgeStyle> = {
  show: { bg: "bg-[#ecfdf5]", text: "text-[#047857]", dot: "bg-[#10b981]", label: "Show Work" },
  build: { bg: "bg-[#fffbeb]", text: "text-[#b45309]", dot: "bg-[#f59e0b]", label: "Build in Public" },
  thought: { bg: "bg-[#f0f9ff]", text: "text-[#0369a1]", dot: "bg-[#0ea5e9]", label: "Thoughts" },
  discussion: { bg: "bg-[#fff1f2]", text: "text-[#be123c]", dot: "bg-[#f43f5e]", label: "Discussion" },
};

export const PROJECT_KIND_STYLE: Record<string, BadgeStyle> = {
  agent: { bg: "bg-[#f5f3ff]", text: "text-[#6d28d9]", dot: "bg-[#8b5cf6]", label: "Agent" },
  oss: { bg: "bg-[#ecfdf5]", text: "text-[#047857]", dot: "bg-[#10b981]", label: "开源" },
  automation: { bg: "bg-[#fffbeb]", text: "text-[#b45309]", dot: "bg-[#f59e0b]", label: "自动化" },
  tool: { bg: "bg-[#f0f9ff]", text: "text-[#0369a1]", dot: "bg-[#0ea5e9]", label: "工具" },
  case: { bg: "bg-[#fff1f2]", text: "text-[#be123c]", dot: "bg-[#f43f5e]", label: "案例" },
  project: { bg: "bg-[#f3f4f6]", text: "text-[#374151]", dot: "bg-[#6b7280]", label: "项目" },
};

export function badgeFor(
  table: Record<string, BadgeStyle>,
  kind: string,
): BadgeStyle {
  return table[kind] ?? { bg: "bg-[#f3f4f6]", text: "text-[#374151]", dot: "bg-[#6b7280]", label: kind };
}
