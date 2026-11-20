import { Link, NavLink, Outlet, Form } from "react-router";
import { Avatar } from "./media";
import type { Me } from "~/lib/session.server";

/**
 * Signed-in shell, rebuilt from a live measurement of Contra's workspace view
 * at 1536×730:
 *
 *   body          bg #fbfcfd
 *   rail          288px wide content in a 336px column, items 40px tall,
 *                 8px radius, 15px/400 labels, 24px gaps between groups
 *   primary CTA   full-rail 288×40, #222834, radius 24
 *   panel         1209×722 at x=312, white, radius 20, 8px top padding
 *   group labels  10px, letter-spacing 1.2px, #4a5264, uppercase
 */

export const RAIL_ITEMS = [
  { key: "home", label: "首页", to: "/", end: true },
  { key: "square", label: "广场", to: "/feed", end: true },
  { key: "discover", label: "发现 FDE", to: "/discover", end: true },
  { key: "work", label: "作品", to: "/discover/projects", end: true },
  { key: "messages", label: "消息", to: "/notifications", end: false },
] as const;

export const RAIL_GROUPS = [
  {
    label: "发现",
    items: [
      { key: "people", label: "FDE", to: "/discover", end: true },
      { key: "topics", label: "方向", to: "/discover/projects", end: false },
    ],
  },
] as const;

export function AppShell({ me, setupDone }: { me: Me; setupDone: number }) {
  return (
    <div className="min-h-dvh bg-[#fbfcfd]">
      {/* ── mobile top bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 md:hidden">
        <Link to="/" className="display text-[22px] tracking-[-0.02em]">
          iMFDE
        </Link>
        <Link to="/new/post" className="btn btn-primary btn-sm ml-auto">
          写点什么
        </Link>
        <Link to={`/@${me.handle}`}>
          <Avatar name={me.display_name} src={me.avatar_url} size={34} />
        </Link>
      </div>

      <div className="flex">
        {/* ── rail: 288px content inside a 336px gutter ─────────────── */}
        <aside className="sticky top-0 hidden h-dvh w-[336px] shrink-0 flex-col px-3 pb-3 pt-4 md:flex">
          <div className="flex h-8 items-center gap-2 px-3">
            <Link to="/" className="display text-[24px] tracking-[-0.02em]">
              iMFDE
            </Link>
            <span className="ml-auto flex items-center gap-1">
              <Link
                to="/notifications"
                className="grid h-8 w-8 place-items-center rounded-[4px] text-[var(--color-ink-soft)] transition hover:bg-white"
                aria-label="通知"
              >
                <BellIcon />
              </Link>
              <Link
                to={`/@${me.handle}`}
                className="rounded-full border border-[var(--color-line)]"
                aria-label="我的主页"
              >
                <Avatar name={me.display_name} src={me.avatar_url} size={28} />
              </Link>
            </span>
          </div>

          {/* full-width primary action: 288×40, radius 24 */}
          <Link
            to="/new/post"
            className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-[24px] bg-[var(--color-ink-2)] text-[14px] font-semibold text-white transition hover:bg-[#2f3746]"
          >
            <PlusIcon />
            写点什么
          </Link>

          <nav className="mt-4 space-y-1">
            {RAIL_ITEMS.map((item) => (
              <RailLink {...item} />
            ))}
            <Link
              to="/settings/profile"
              className="flex h-10 items-center gap-3 rounded-[8px] px-3 text-[15px] text-[var(--color-ink)] transition hover:bg-white"
            >
              <span className="grid h-[18px] w-[18px] place-items-center text-[var(--color-ink-soft)]">
                <GearIcon />
              </span>
              {setupDone === 4 ? "主页已完整" : "完成设置"}
              <span className="ml-auto font-mono text-[13px] text-[var(--color-faint)]">
                {setupDone}/4
              </span>
            </Link>
          </nav>

          {RAIL_GROUPS.map((group) => (
            <div key={group.label} className="mt-6">
              <p className="mb-1 flex items-center gap-2 px-3 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
                {group.label}
                <span className="h-px flex-1 bg-[var(--color-line)]" />
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <RailLink {...item} />
                ))}
              </div>
            </div>
          ))}

          <div className="mt-6">
            <p className="mb-1 px-3 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
              我的
            </p>
            <div className="space-y-1">
              <RailLink
                key="profile"
                label="我的主页"
                to={`/@${me.handle}`}
                end={false}
              />
              <Form method="post" action="/logout">
                <button className="flex h-10 w-full items-center gap-3 rounded-[8px] px-3 text-left text-[15px] text-[var(--color-ink)] transition hover:bg-white">
                  <span className="grid h-[18px] w-[18px] place-items-center text-[var(--color-ink-soft)]">
                    <LogoutIcon />
                  </span>
                  退出
                </button>
              </Form>
            </div>
          </div>

          {/* bottom promo, as the rail's card sits flush above the fold */}
          <Link
            to="/new/project"
            className="mt-auto block rounded-[12px] bg-[var(--color-ink-2)] p-3.5 text-white"
          >
            <p className="text-[14px] font-semibold leading-snug">把作品放上来</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-white/65">
              一个标题、一句话就能开始。
            </p>
            <p className="mt-2 text-[12.5px] font-semibold text-white/90">
              上传作品 →
            </p>
          </Link>
        </aside>

        {/* ── white panel: radius 20, 8px inset from the top ────────── */}
        <div className="min-w-0 flex-1 pb-3 md:pr-3">
          <div className="min-h-[calc(100dvh-8px)] rounded-[20px] border border-[var(--color-line-soft)] bg-white px-5 pb-8 pt-6 md:px-14 md:pt-10">
            <div className="mb-6 flex gap-1 overflow-x-auto md:hidden">
              {RAIL_ITEMS.map((item) => (
                <NavLink
                  key={item.key}
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
                </NavLink>
              ))}
              <NavLink
                to="/settings/profile"
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-3 py-1.5 text-[14px] font-medium ${
                    isActive
                      ? "bg-[var(--color-ink-2)] text-white"
                      : "text-[var(--color-ink-soft)]"
                  }`
                }
              >
                设置
              </NavLink>
              <Form method="post" action="/logout" className="shrink-0">
                <button className="rounded-full px-3 py-1.5 text-[14px] font-medium text-[var(--color-ink-soft)]">
                  退出
                </button>
              </Form>
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

function RailLink({
  label,
  to,
  end = false,
}: {
  label: string;
  to: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex h-10 items-center gap-3 rounded-[8px] px-3 text-[15px] transition ${
          isActive
            ? "bg-white font-medium text-[var(--color-ink)] shadow-[0_1px_2px_rgba(16,24,40,0.06)]"
            : "text-[var(--color-ink)] hover:bg-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="grid h-[18px] w-[18px] place-items-center text-[var(--color-ink-soft)]">
            {isActive ? <DotIcon /> : <RingIcon />}
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}

/* ── icons: 18px, 1.6 stroke, quiet like the measured rail ───────────── */

function RingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="7.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function DotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="7.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9.5a6 6 0 0112 0v3.2l1.6 3.1c.3.6-.1 1.2-.8 1.2H5.2c-.7 0-1.1-.6-.8-1.2L6 12.7V9.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9.6 19.4a2.5 2.5 0 004.8 0" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 8V5a1 1 0 00-1-1H6a1 1 0 00-1 1v14a1 1 0 001 1h8a1 1 0 001-1v-3"
        stroke="currentColor" strokeWidth="1.6" />
      <path d="M11 12h9m0 0l-3-3m3 3l-3 3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}
