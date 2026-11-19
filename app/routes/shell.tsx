import type { Route } from "./+types/shell";
import { Link, NavLink, Outlet, Form } from "react-router";
import { getMe } from "~/lib/session.server";
import { Avatar } from "~/components/media";

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await getMe(context, request);
  return { me };
}

const NAV = [
  { to: "/", label: "动态", end: true, needsAuth: true },
  { to: "/discover", label: "发现 FDE", end: true },
  { to: "/discover/projects", label: "作品", end: true },
];

export default function Shell({ loaderData }: Route.ComponentProps) {
  const me = loaderData?.me ?? null;
  const nav = me ? NAV : NAV.filter((n) => !n.needsAuth);

  return (
    <div className="min-h-dvh bg-[var(--color-canvas)]">
      {/* nav: 74px tall, links 16/600, actions are 48px pills — measured */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-line-soft)] bg-[color-mix(in_srgb,#fff_88%,transparent)] backdrop-blur-xl">
        <div className="frame flex h-[74px] items-center gap-1">
          <Link to="/" className="mr-6 shrink-0">
            <span className="display text-[24px] tracking-[-0.02em]">iMFDE</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-[16px] font-semibold transition ${
                    isActive
                      ? "text-[var(--color-ink)]"
                      : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                  }`
                }
              >
                {item.label}
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

            {me ? (
              <>
                <Link
                  to="/notifications"
                  className="grid h-10 w-10 place-items-center rounded-full text-[var(--color-ink-soft)] transition hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]"
                  aria-label="通知"
                >
                  <BellIcon />
                </Link>
                <Link to="/new/post" className="btn btn-primary hidden sm:inline-flex">
                  写点什么
                </Link>
                <Link
                  to={`/@${me.handle}`}
                  className="ml-1 rounded-full transition hover:opacity-80"
                  aria-label="我的主页"
                >
                  <Avatar name={me.display_name} src={me.avatar_url} size={40} />
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost hidden sm:inline-flex">
                  登录
                </Link>
                <Link to="/join" className="btn btn-primary">
                  加入
                </Link>
              </>
            )}
          </div>
        </div>

        {/* mobile nav row */}
        <div className="frame flex gap-1 overflow-x-auto pb-3 md:hidden">
          {nav.map((item) => (
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

      <main className="frame pb-28 pt-6">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--color-line-soft)]">
        <div className="frame flex flex-wrap items-center justify-between gap-4 py-10">
          <div>
            <p className="display text-[16px]">iMFDE</p>
            <p className="mt-1.5 max-w-[440px] text-[14px] leading-relaxed text-[var(--color-muted)]">
              展示可观察的信息，由访问者自行判断。平台不提供信用分、认证等级，也不经手任何交易。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-[14px] text-[var(--color-muted)]">
            <Link to="/discover" className="hover:text-[var(--color-ink)]">
              发现
            </Link>
            <Link to="/discover/projects" className="hover:text-[var(--color-ink)]">
              作品
            </Link>
            {me ? (
              <>
                <Link to="/settings/profile" className="hover:text-[var(--color-ink)]">
                  设置
                </Link>
                <Form method="post" action="/logout">
                  <button className="hover:text-[var(--color-ink)]">退出</button>
                </Form>
              </>
            ) : (
              <Link to="/join" className="hover:text-[var(--color-ink)]">
                加入
              </Link>
            )}
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

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9.5a6 6 0 0112 0v3.2l1.6 3.1c.3.6-.1 1.2-.8 1.2H5.2c-.7 0-1.1-.6-.8-1.2L6 12.7V9.5z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9.6 19.4a2.5 2.5 0 004.8 0" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
