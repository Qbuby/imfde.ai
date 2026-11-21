import { NavLink, useLocation } from "react-router";
import { AnimatedBackground } from "~/components/motion/animated-background";

const TABS = [
  { to: "/settings/profile", id: "profile", label: "主页" },
  { to: "/settings/accounts", id: "accounts", label: "外部账号" },
  { to: "/settings/privacy", id: "privacy", label: "隐私" },
] as const;

/**
 * Shared settings navigation. Uses one AnimatedBackground so the active pill
 * springs between tabs; the selected tab is visible on SSR via NavLink state.
 */
export function SettingsTabs() {
  const { pathname } = useLocation();
  const active = TABS.find((t) => pathname.startsWith(t.to))?.id ?? "profile";

  return (
    <nav
      aria-label="设置导航"
      className="mb-7 inline-flex items-center rounded-full border border-[#e3e5ea] bg-[#f7f7f9] p-1"
    >
      <AnimatedBackground
        defaultValue={active}
        className="rounded-full bg-[#14171f]"
        transition={{ type: "spring", stiffness: 460, damping: 34 }}
      >
        {TABS.map((t) => (
          <NavLink
            key={t.id}
            to={t.to}
            data-id={t.id}
            end
            className="relative z-10 rounded-full px-3.5 py-1.5 text-[12.5px] text-[#4a5264] transition-colors data-[checked=true]:text-white"
          >
            {t.label}
          </NavLink>
        ))}
      </AnimatedBackground>
    </nav>
  );
}
