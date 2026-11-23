import { NavLink, Outlet, Form } from "react-router";
import { motion } from "motion/react";
import {
  Bell,
  Home,
  Layers,
  LogOut,
  MessageSquareText,
  Plus,
  Search,
  SlidersHorizontal,
  User,
  Users,
} from "lucide-react";
import { Avatar } from "./media";
import { AdSlot } from "./ad-slot";
import type { AdItem } from "~/lib/queries.server";
import { BrandLogo, BrandMark } from "./brand-logo";
import { QuickPostModal } from "./quick-post";
import { CommandPalette } from "./command-palette";
import type { Me } from "~/lib/session.server";

const RAIL_ICONS = {
  home: Home,
  square: MessageSquareText,
  discover: Users,
  work: Layers,
  messages: Bell,
  profile: User,
} as const;

/**
 * Signed-in workspace: a compact 256px rail on a warm canvas, with the white
 * reading panel taking the rest. Motion is limited to the active pill, which
 * is visible on SSR (NavLink renders the class server-side) and only *slides*
 * after hydration — the first paint never depends on JS.
 */
export const RAIL_ITEMS = [
  { icon: "home", label: "首页", to: "/", end: true },
  { icon: "square", label: "广场", to: "/feed", end: true },
  { icon: "discover", label: "发现 FDE", to: "/discover", end: true },
  { icon: "work", label: "作品", to: "/discover/projects", end: true },
  { icon: "messages", label: "消息", to: "/notifications", end: false },
] as const;

const TAB_BAR_ITEMS = [
  { icon: Home, label: "首页", to: "/", end: true },
  { icon: MessageSquareText, label: "广场", to: "/feed", end: false },
  { icon: Users, label: "发现", to: "/discover", end: false },
  { icon: Layers, label: "作品", to: "/discover/projects", end: false },
  { icon: Bell, label: "消息", to: "/notifications", end: false },
] as const;

export function AppShell({ me, setupDone, unreadCount = 0, ads }: {
  me: Me;
  setupDone: number;
  unreadCount?: number;
  ads?: Record<"left_rail" | "right_rail" | "feed_inline", AdItem[]>;
}) {
  return (
    <div className="min-h-dvh bg-[var(--color-canvas-warm)]">
      {/* ── mobile top bar ─────────────────────────────────────────── */}
      <div className="frost flex items-center gap-1.5 border-b border-[#eff3f4] px-3 py-2.5 md:hidden">
        <NavLink to="/" aria-label="ImFDE 首页" className="shrink-0">
          <BrandLogo size="sm" />
        </NavLink>
        <CommandPalette
          me={me}
          trigger={
            <button
              aria-label="快捷搜索"
              className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--color-ink-soft)] transition hover:bg-[var(--color-paper)]"
            >
              <Search size={17} strokeWidth={1.65} aria-hidden />
            </button>
          }
        />
        <QuickPostModal
          me={me}
          trigger={
            <button aria-label="写点什么" className="btn btn-primary btn-sm !h-11 !min-w-0 !gap-0 !px-3 group">
              <Plus size={17} strokeWidth={1.8} className="transition-transform duration-200 ease-out group-hover:rotate-90" aria-hidden />
              <span className="hidden sm:inline">写点什么</span>
            </button>
          }
        />
        <NavLink to={`/@${me.handle}`} aria-label="我的主页" className="grid h-11 w-11 shrink-0 place-items-center">
          <Avatar name={me.display_name} src={me.avatar_url} size={32} />
        </NavLink>
      </div>

      <div className="flex">
        {/* ── rail: 256px, icon-only on md, full on lg ─────────────── */}
        <aside className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col px-3 pb-4 pt-4 md:flex lg:w-[256px]">
          <div className="flex h-9 items-center gap-2 px-2">
            <NavLink to="/" aria-label="ImFDE 首页" className="flex items-center justify-center lg:justify-start lg:w-full">
              <span className="lg:hidden">
                <BrandMark size={24} />
              </span>
              <span className="hidden lg:inline-flex">
                <BrandLogo size="md" />
              </span>
            </NavLink>
            <CommandPalette
              me={me}
              enableShortcut
              trigger={
                <button
                  aria-label="快捷搜索 Cmd+K"
                  className="ml-auto hidden items-center gap-1.5 rounded-full border border-[var(--color-line)] px-2.5 py-1 text-[11.5px] text-[var(--color-faint)] transition hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)] lg:flex"
                >
                  <Search size={13} strokeWidth={1.65} aria-hidden />
                  <span className="font-mono">⌘K</span>
                </button>
              }
            />
          </div>

          <QuickPostModal
            me={me}
            trigger={
              <button className="group mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-[24px] bg-[var(--color-ink-2)] text-[14px] font-semibold text-white transition hover:bg-[#2f3746] active:scale-[0.96]">
                <Plus size={16} strokeWidth={1.8} className="transition-transform duration-200 ease-out group-hover:rotate-90" aria-hidden />
                <span className="hidden lg:inline">写点什么</span>
              </button>
            }
          />

          <nav className="mt-4 space-y-1">
            {RAIL_ITEMS.map((item) => (
              <RailLink key={item.to} {...item} unread={item.icon === "messages" ? unreadCount : 0} />
            ))}
            <NavLink
              to="/settings/profile"
              className={({ isActive }) =>
                `relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] transition ${
                  isActive
                    ? "font-medium text-[var(--color-ink)]"
                    : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="rail-active-pill"
                      className="absolute inset-0 rounded-[10px] border border-[#e2e5ea] bg-white"
                      transition={{ type: "spring", stiffness: 480, damping: 36 }}
                    />
                  )}
                  <SlidersHorizontal size={17} strokeWidth={1.65} className="relative z-10 shrink-0" aria-hidden />
                  <span className="relative z-10 hidden truncate lg:inline">
                    {setupDone === 4 ? "主页已完整" : "完成设置"}
                  </span>
                  <span className="relative z-10 ml-auto hidden font-sans text-[12px] text-[var(--color-faint)] tabular-nums lg:inline">
                    {setupDone}/4
                  </span>
                </>
              )}
            </NavLink>
          </nav>

          <div className="mt-6 border-t border-[var(--color-line)] pt-5">
            <div className="space-y-1">
              <RailLink
                key="profile"
                icon="profile"
                label="我的主页"
                to={`/@${me.handle}`}
                end={false}
              />
              <Form method="post" action="/logout">
                <button className="flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-left text-[14px] text-[var(--color-ink-soft)] transition hover:text-[var(--color-ink)]">
                  <LogOut size={17} strokeWidth={1.65} className="shrink-0" aria-hidden />
                  <span className="hidden lg:inline">退出</span>
                </button>
              </Form>
            </div>
          </div>

          <NavLink
            to="/new/project"
            className="mt-auto hidden rounded-[14px] border border-[#e2e5ea] bg-white p-3.5 transition hover:border-[#0f1419] lg:block"
          >
            <p className="text-[13.5px] font-semibold leading-snug">把作品放上来</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-ink-soft)]">
              一个标题、一句话就能开始。
            </p>
            <p className="mt-2 text-[12px] font-semibold text-[var(--color-ink)]">
              上传作品 →
            </p>
          </NavLink>
          <div className="mt-3 lg:block">
            <AdSlot variant="left" ad={ads?.left_rail?.[0]} />
          </div>
        </aside>

        {/* ── reading panel ─────────────────────────────────────────── */}
        <div className="min-w-0 flex-1 pb-4 pr-0 md:pr-4">
          <div className="surface-panel min-h-[calc(100dvh-16px)] px-5 pb-24 pt-6 md:pb-10 md:px-10 md:pt-9 lg:px-14">
            <Outlet />
          </div>
        </div>
      </div>

      {/* ── mobile bottom tab bar ───────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#eff3f4] bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="主导航">
        {TAB_BAR_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
                isActive ? "text-[#0f1419]" : "text-[#8b93a3]"
              }`
            }
          >
            <item.icon size={20} strokeWidth={1.65} aria-hidden />
            <span>{item.label}</span>
            {item.icon === Bell && unreadCount > 0 && (
              <span className="absolute right-[calc(50%-18px)] top-1.5 h-2 w-2 rounded-full bg-[#f43f5e]" aria-label={`${unreadCount} 条未读`} />
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function RailLink({
  icon,
  label,
  to,
  end = false,
  unread = 0,
}: {
  icon?: keyof typeof RAIL_ICONS;
  label: string;
  to: string;
  end?: boolean;
  unread?: number;
}) {
  const Icon = RAIL_ICONS[icon ?? "home"];
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      className={({ isActive }) =>
        `group relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] transition ${
          isActive
            ? "font-medium text-[var(--color-ink)]"
            : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="rail-active-pill"
              className="absolute inset-0 rounded-[10px] border border-[#e2e5ea] bg-white"
              transition={{ type: "spring", stiffness: 480, damping: 36 }}
            />
          )}
          <Icon
            size={17}
            strokeWidth={1.65}
            className={`relative z-10 shrink-0 ${icon === "messages" ? "group-hover:animate-[bell-wiggle_420ms_ease-in-out]" : ""}`}
            aria-hidden
          />
          <span className="relative z-10 hidden truncate lg:inline">{label}</span>
          {unread > 0 && (
            <span className="relative z-10 ml-auto hidden min-w-[18px] items-center justify-center rounded-full bg-[#f43f5e] px-1 font-sans text-[11px] font-semibold leading-[18px] text-white tabular-nums lg:inline-flex">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
          {unread > 0 && icon === "messages" && (
            <span className="absolute right-[11px] top-[9px] z-10 h-2 w-2 rounded-full bg-[#f43f5e] ring-2 ring-[var(--color-canvas-warm)] lg:hidden" />
          )}
        </>
      )}
    </NavLink>
  );
}
