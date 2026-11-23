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

export function AppShell({ me, setupDone, unreadCount = 0 }: { me: Me; setupDone: number; unreadCount?: number }) {
  return (
    <div className="min-h-dvh bg-[var(--color-canvas-warm)]">
      {/* ── mobile top bar ─────────────────────────────────────────── */}
      <div className="frost flex items-center gap-3 border-b border-[#eff3f4] px-4 py-3 md:hidden">
        <NavLink to="/" aria-label="ImFDE 首页">
          <BrandLogo size="md" />
        </NavLink>
        <CommandPalette
          me={me}
          trigger={
            <button
              aria-label="快捷搜索"
              className="ml-auto grid h-9 w-9 place-items-center rounded-full text-[var(--color-ink-soft)] transition hover:bg-[var(--color-paper)]"
            >
              <Search size={17} strokeWidth={1.65} aria-hidden />
            </button>
          }
        />
        <QuickPostModal
          me={me}
          trigger={
            <button className="btn btn-primary btn-sm !h-9 group">
              <Plus size={15} strokeWidth={1.8} className="transition-transform duration-200 ease-out group-hover:rotate-90" aria-hidden />
              写点什么
            </button>
          }
        />
        <NavLink to={`/@${me.handle}`} aria-label="我的主页">
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
        </aside>

        {/* ── reading panel ─────────────────────────────────────────── */}
        <div className="min-w-0 flex-1 pb-4 pr-0 md:pr-4">
          <div className="surface-panel min-h-[calc(100dvh-16px)] px-5 pb-10 pt-6 md:px-10 md:pt-9 lg:px-14">
            <div className="mb-6 flex gap-1 overflow-x-auto md:hidden">
              {RAIL_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `shrink-0 rounded-full px-3 py-1.5 text-[14px] font-medium ${
                      isActive
                        ? "bg-[var(--color-ink-2)] text-white"
                        : "text-[var(--color-ink-soft)]"
                    }`
                  }
                >
                  {item.label}
                  {item.icon === "messages" && unreadCount > 0 && (
                    <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#f43f5e] px-1 font-sans text-[11px] font-semibold text-white tabular-nums">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
            <Outlet />
          </div>
        </div>
      </div>
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
