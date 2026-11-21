import { useEffect, useId, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Search, Compass, Layers, Home, MessageSquareText, Plus, User } from "lucide-react";
import type { Me } from "~/lib/session.server";

/**
 * Cmd/Ctrl+K command palette. Keyboard-only by design: ↑/↓ move, Enter runs,
 * ESC is handled by Radix. Everything is local navigation, so it adds no
 * server round trip beyond following the chosen link.
 */
export function CommandPalette({
  me,
  trigger,
  enableShortcut = false,
}: {
  me: Me;
  trigger?: React.ReactNode;
  /** Only one mounted palette may own the global Cmd+K shortcut. */
  enableShortcut?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const navigate = useNavigate();
  // two palettes can be mounted (mobile + desktop rail); ids must be unique
  const inputId = `cmdk-input-${useId()}`;

  const commands = useMemo(
    () => [
      { icon: Home, label: "首页", hint: "仪表盘", to: "/" },
      { icon: MessageSquareText, label: "广场", hint: "全站动态", to: "/feed" },
      { icon: Compass, label: "发现 FDE", hint: "按名字或技能", to: "/discover" },
      { icon: Layers, label: "作品", hint: "浏览公开作品", to: "/discover/projects" },
      { icon: Plus, label: "上传作品", hint: "新建作品", to: "/new/project" },
      { icon: User, label: "我的主页", hint: `@${me.handle}`, to: `/@${me.handle}` },
    ],
    [me.handle],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? commands.filter((c) => c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q)) : commands;
    if (!q) return base;
    return [
      ...base,
      {
        icon: Search,
        label: `搜索「${query.trim()}」`,
        hint: "按关键词找 FDE",
        to: `/discover?q=${encodeURIComponent(query.trim())}`,
      },
      {
        icon: Layers,
        label: `搜作品「${query.trim()}」`,
        hint: "按关键词找作品",
        to: `/discover/projects?q=${encodeURIComponent(query.trim())}`,
      },
    ];
  }, [commands, query]);

  useEffect(() => {
    if (!enableShortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enableShortcut]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
    }
  }, [open]);

  useEffect(() => setCursor(0), [query]);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(20,23,31,0.28)] backdrop-blur-[3px]" />
        <Dialog.Content
          onOpenAutoFocus={(e) => {
            // keep focus in the input, not on the dialog frame
            e.preventDefault();
            document.getElementById(inputId)?.focus();
          }}
          className="frost fixed left-1/2 top-[14vh] z-50 w-[min(94vw,560px)] -translate-x-1/2 overflow-hidden rounded-[16px] border border-[#e2e5ea] bg-white/96 shadow-[var(--shadow-lift)]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 440, damping: 32 }}
          >
          <Dialog.Title className="sr-only">快捷命令</Dialog.Title>
          <div className="flex items-center gap-3 border-b border-[var(--color-line-soft)] px-4">
            <Search size={17} strokeWidth={1.65} className="text-[var(--color-faint)]" aria-hidden />
            <input
              id={inputId}
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setCursor((c) => Math.min(c + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setCursor((c) => Math.max(c - 1, 0));
                } else if (e.key === "Enter" && results[cursor]) {
                  e.preventDefault();
                  go(results[cursor].to);
                }
              }}
              placeholder="输入命令或关键词…"
              className="h-12 flex-1 border-0 bg-transparent text-[14px] outline-none placeholder:text-[var(--color-faint)]"
            />
            <kbd className="micro-mono rounded-[4px] border border-[var(--color-line)] px-1.5 py-0.5">
              ESC
            </kbd>
          </div>

          <div className="max-h-[320px] overflow-y-auto p-2">
            {results.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-[var(--color-faint)]">
                没有匹配的命令
              </p>
            ) : (
              results.map((cmd, i) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={`${cmd.label}-${i}`}
                    type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(cmd.to)}
                    className="relative flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left"
                  >
                    {i === cursor && (
                      <motion.span
                        layoutId="cmdk-active-row"
                        className="absolute inset-0 rounded-[10px] bg-[#f1f3f5]"
                        transition={{ type: "spring", stiffness: 540, damping: 38 }}
                      />
                    )}
                    <Icon size={16} strokeWidth={1.65} className="relative z-10 text-[var(--color-ink-soft)]" aria-hidden />
                    <span className="relative z-10 min-w-0 flex-1 truncate text-[13.5px]">{cmd.label}</span>
                    <span className="micro-mono relative z-10 shrink-0">{cmd.hint}</span>
                  </button>
                );
              })
            )}
          </div>
          <div className="flex items-center gap-4 border-t border-[var(--color-line-soft)] px-4 py-2 text-[11px] text-[var(--color-faint)]">
            <span>↑↓ 选择</span>
            <span>↵ 打开</span>
            <span className="ml-auto">ImFDE 快捷面板</span>
          </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
