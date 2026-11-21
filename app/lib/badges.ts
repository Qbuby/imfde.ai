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

/** One-line editorial blurbs for the community's hot topics. */
export const TOPIC_BLURBS: Record<string, string> = {
  Eval: "真实难例集与基准线对比，拒绝玄学调参",
  RAG: "解析、切块、混合检索与引用核查",
  私有部署: "断网机房、显存稳定与老系统兼容",
  语音交互: "VAD、打断延迟与真实噪声通话",
  Agent: "工具调用、状态机与人工兜底边界",
  工作流自动化: "把重复流程跑顺并留痕",
  现场踩坑: "那些 Demo 里绝对不会出现的问题",
  MCP: "内部系统只读桥接与权限隔离",
  多模态OCR: "盖章、手写与倾斜扫描件的字段还原",
  可观测性: "调用链、成本与异常的第一现场",
  LiveKit: "实时音视频管道与端到端延迟",
  混合检索: "关键词与向量各取所长",
};
