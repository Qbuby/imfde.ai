import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, Heart, MessageCircle, Repeat2, Bookmark, Link2 } from "lucide-react";
import { Avatar, CoverArt } from "./media";

const TABS = [
  { id: "profile", label: "① 个人作品集主页" },
  { id: "work", label: "② Agent 作品详情" },
  { id: "feed", label: "③ FDE 实时广场" },
] as const;

/**
 * Three-state product preview for the landing hero. State starts on the first
 * tab, which is rendered on the server — the stage is fully visible on first
 * paint, and AnimatePresence only animates subsequent switches.
 */
export function PreviewStage() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("profile");

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition ${
              active === t.id
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                : "border-[var(--color-line)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="surface-panel relative h-[340px] overflow-hidden p-5 sm:h-[380px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
            className="h-full"
          >
            {active === "profile" && <ProfilePreview />}
            {active === "work" && <WorkPreview />}
            {active === "feed" && <FeedPreview />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProfilePreview() {
  return (
    <div className="grid h-full grid-cols-[150px_minmax(0,1fr)] gap-4">
      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-[10px]">
          <CoverArt seed="preview-cover" aspect="2 / 1" photo={false} />
        </div>
        <div className="-mt-6 px-2">
          <Avatar name="林舟" size={48} ring />
          <p className="mt-2 text-[13px] font-semibold">林舟</p>
          <p className="micro-mono">@linzhou</p>
        </div>
        <p className="mt-1 text-[10.5px] leading-relaxed text-[var(--color-ink-soft)]">
          把企业系统接到大模型上的 FDE
        </p>
        <div className="mt-auto grid grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-[var(--color-line)] bg-[var(--color-line)]">
          {[["12", "作品"], ["380", "关注者"]].map(([n, l]) => (
            <div key={l} className="bg-white px-2 py-2">
              <p className="font-mono text-[13px] font-medium tabular-nums">{n}</p>
              <p className="text-[9px] text-[var(--color-muted)]">{l}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 font-mono text-[9.5px] tracking-[1px] text-[var(--color-ink-soft)] uppercase">作品集</p>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="col-span-2 overflow-hidden rounded-[10px] border border-[var(--hairline)]">
            <CoverArt seed="preview-hero" aspect="16 / 7" />
            <div className="bg-white px-2.5 py-2">
              <p className="text-[11.5px] font-semibold">工单自动归档 Agent</p>
              <p className="mt-0.5 text-[10px] text-[var(--color-faint)]">接 Zendesk webhook，按意图分派</p>
            </div>
          </div>
          {["voice", "notes"].map((s) => (
            <div key={s} className="overflow-hidden rounded-[10px] border border-[var(--hairline)]">
              <CoverArt seed={`preview-${s}`} aspect="4 / 3" />
              <p className="truncate bg-white px-2 py-1.5 text-[10.5px] font-medium">{s === "voice" ? "会议转写流水线" : "私有部署笔记"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkPreview() {
  return (
    <div className="flex h-full flex-col">
      <div className="relative overflow-hidden rounded-[12px] border border-[var(--hairline)]">
        <CoverArt seed="preview-agent" aspect="16 / 7" />
        <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2 py-0.5 font-mono text-[9px] backdrop-blur">Agent</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="chip chip-teal !h-[20px] !text-[9.5px]">内测</span>
        <span className="chip chip-outline !h-[20px] !text-[9.5px]">私有部署</span>
      </div>
      <h3 className="mt-2 text-[18px] font-semibold tracking-[-0.03em]">工单自动归档 Agent</h3>
      <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--color-ink-soft)]">
        接 Zendesk webhook，做意图分类，写入标签并路由到对应队列。两周内测覆盖 6 类常见工单。
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="surface-panel p-2.5">
          <p className="font-mono text-[9px] tracking-[1px] text-[var(--color-ink-soft)] uppercase">我负责的部分</p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-[var(--color-ink-2)]">独立完成架构、后端和部署</p>
          <p className="mt-1 text-[8.5px] text-[var(--color-faint)]">作者自述，未经平台核实</p>
        </div>
        <div className="surface-panel p-2.5">
          <p className="font-mono text-[9px] tracking-[1px] text-[var(--color-ink-soft)] uppercase">限制与前提</p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-[var(--color-ink-2)]">只支持英文工单，需私有部署</p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
        <span className="btn btn-primary btn-sm !h-[28px] !px-3 !text-[10.5px]">在线 Demo <ArrowUpRight size={12} aria-hidden /></span>
        <span className="btn btn-ghost btn-sm !h-[28px] !px-3 !text-[10.5px]">代码仓库 <ArrowUpRight size={12} aria-hidden /></span>
      </div>
    </div>
  );
}

function FeedPreview() {
  const rows = [
    { name: "林舟", handle: "linzhou", seed: "l", text: "两周内测，覆盖 6 类工单，现在卡在 #语音转写 的延迟上。", tag: "#语音转写" },
    { name: "陈默", handle: "chenmo", seed: "c", text: "客户故事里真正有价值的是「哪个环节被删掉了」。#判断", tag: "#判断" },
  ];
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2 border-b border-[var(--color-line)] pb-2">
        <span className="rounded-full bg-[var(--color-ink)] px-2.5 py-1 text-[10.5px] font-medium text-white">全站最新</span>
        <span className="text-[10.5px] text-[var(--color-muted)]">关注</span>
        <span className="text-[10.5px] text-[var(--color-muted)]">收藏</span>
      </div>
      {rows.map((r) => (
        <div key={r.handle} className="grid grid-cols-[34px_minmax(0,1fr)] gap-2.5 border-b border-[var(--color-line-soft)] py-3">
          <Avatar name={r.name} size={34} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11.5px] font-semibold">{r.name}</span>
              <span className="micro-mono">@{r.handle}</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-ink)]">
              {r.text.split(r.tag)[0]}
              <span className="text-[var(--color-link)]">{r.tag}</span>
            </p>
            <div className="mt-2 flex max-w-[260px] items-center justify-between text-[var(--color-faint)]">
              <span className="flex items-center gap-1 text-[var(--color-like)]"><Heart size={13} strokeWidth={1.65} fill="currentColor" /> 24</span>
              <span className="flex items-center gap-1 text-[var(--color-link)]"><MessageCircle size={13} strokeWidth={1.65} /> 8</span>
              <span className="flex items-center gap-1 text-[var(--color-repost)]"><Repeat2 size={13} strokeWidth={1.65} /> 5</span>
              <span className="flex items-center gap-1"><Bookmark size={13} strokeWidth={1.65} /></span>
              <span className="flex items-center gap-1"><Link2 size={13} strokeWidth={1.65} /></span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
