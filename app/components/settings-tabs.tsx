import { NavLink } from "react-router";

const TABS = [
  { to: "/settings/profile", label: "主页" },
  { to: "/settings/accounts", label: "外部账号" },
  { to: "/settings/privacy", label: "隐私" },
] as const;

/** Shared settings navigation — three plain underlined links. */
export function SettingsTabs() {
  return (
    <nav aria-label="设置导航" className="mb-7 flex gap-1 border-b border-[#eff3f4]">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end
          className={({ isActive }) =>
            `relative px-3.5 pb-3 pt-1 text-[13px] font-medium transition ${
              isActive ? "text-[#0f1419]" : "text-[#536471] hover:text-[#0f1419]"
            }`
          }>
          {({ isActive }) => (
            <>
              {t.label}
              {isActive && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded bg-[#0f1419]" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
