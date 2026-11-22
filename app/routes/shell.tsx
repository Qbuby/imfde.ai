import type { Route } from "./+types/shell";
import { Link, NavLink, Outlet } from "react-router";
import { getMe } from "~/lib/session.server";
import { one } from "~/lib/db.server";
import { AppShell } from "~/components/app-shell";
import { useState } from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";

/**
 * Four things make a profile useful to a stranger: a headline, a face, one
 * piece of work, and one place to find more. The rail shows how many are done
 * instead of a fixed number.
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await getMe(context, request);
  if (!me) return { me: null, setupDone: 0, unreadCount: 0 };

  const row = await one<{
    headline: number;
    avatar_url: number;
    projects: number;
    links: number;
    unread: number;
  }>(
    context,
    `SELECT
       (SELECT COUNT(*) FROM profiles
         WHERE user_id = ?1 AND headline IS NOT NULL AND length(headline) > 0) AS headline,
       (SELECT COUNT(*) FROM profiles
         WHERE user_id = ?1 AND avatar_url IS NOT NULL AND length(avatar_url) > 0) AS avatar_url,
       (SELECT COUNT(*) FROM projects WHERE owner_id = ?1 AND visibility = 'public') AS projects,
       (SELECT COUNT(*) FROM external_accounts WHERE user_id = ?1) AS links,
       (SELECT COUNT(*) FROM notifications
         WHERE recipient_id = ?1 AND read_at IS NULL) AS unread`,
    me.id,
  );

  const setupDone = row
    ? Number(row.headline > 0) + Number(row.avatar_url > 0) + Number(row.projects > 0) + Number(row.links > 0)
    : 0;

  return { me, setupDone, unreadCount: row?.unread ?? 0 };
}

const GUEST_NAV = [
  { to: "/feed", label: "广场", end: true },
  { to: "/discover", label: "发现 FDE", end: true },
  { to: "/discover/projects", label: "作品", end: true },
];

export default function Shell({ loaderData }: Route.ComponentProps) {
  const me = loaderData?.me ?? null;
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  // Signed in: Contra's app view (rail + panel). Signed out: marketing chrome.
  if (me) return <AppShell me={me} setupDone={loaderData.setupDone} />;

  return (
    <div className="min-h-dvh bg-[var(--color-canvas)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-line-soft)] bg-[color-mix(in_srgb,#fff_88%,transparent)] backdrop-blur-xl">
        <div className="frame flex h-[74px] items-center gap-1">
          <Link to="/" className="mr-6 shrink-0">
            <span className="display text-[24px] tracking-[-0.02em]">ImFDE</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" onMouseLeave={() => setHoveredNav(null)}>
            {GUEST_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onMouseEnter={() => setHoveredNav(item.to)}
                className={({ isActive }) =>
                  `relative rounded-full px-3 py-2 text-[16px] font-semibold transition ${
                    isActive
                      ? "text-[var(--color-ink)]"
                      : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {(hoveredNav === item.to || isActive) && (
                      <motion.span
                        layoutId="guest-nav-pill"
                        className="absolute inset-0 rounded-full bg-[#f3f4f6]"
                        transition={{ type: "spring", stiffness: 520, damping: 36 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/discover"
              className="grid h-10 w-10 place-items-center rounded-full text-[var(--color-ink-soft)] transition hover:bg-[var(--color-paper)] md:hidden"
              aria-label="搜索"
            >
              <SearchIcon />
            </Link>
            <Link
              to="/discover"
              className="hidden md:inline-flex h-10 items-center gap-2 rounded-full border border-[#e3e5ea] bg-[#f7f7f9] px-3.5 text-[13px] text-[#677084] transition hover:border-[#4a5264] hover:text-[#14171f]"
            >
              <Search size={14} strokeWidth={1.65} aria-hidden />
              <span>搜 FDE 或作品…</span>
            </Link>
            <Link to="/login" className="btn btn-ghost hidden sm:inline-flex">
              登录
            </Link>
            <Link to="/join" className="btn btn-primary">
              加入
            </Link>
          </div>
        </div>

        <div className="frame flex gap-1 overflow-x-auto pb-3 md:hidden">
          {GUEST_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `shrink-0 rounded-full px-3 py-1.5 text-[14px] font-medium transition ${
                  isActive
                    ? "bg-[var(--color-paper)] text-[var(--color-ink)]"
                    : "text-[var(--color-ink-soft)]"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </header>

      <main className="frame pt-0 pb-28">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--color-line-soft)]">
        <div className="frame flex flex-wrap items-center justify-between gap-4 py-10">
          <div>
            <p className="display text-[16px]">ImFDE</p>
            <p className="mt-1.5 text-[12.5px] text-[var(--color-muted)]">FDE 作品集与交流社区</p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-[14px] text-[var(--color-muted)]">
            <Link to="/feed" className="hover:text-[var(--color-ink)]">
              广场
            </Link>
            <Link to="/discover" className="hover:text-[var(--color-ink)]">
              发现
            </Link>
            <Link to="/discover/projects" className="hover:text-[var(--color-ink)]">
              作品
            </Link>
            <Link to="/login" className="hover:text-[var(--color-ink)]">
              登录
            </Link>
            <Link to="/join" className="hover:text-[var(--color-ink)]">
              加入
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
