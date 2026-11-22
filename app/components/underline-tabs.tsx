import { Link } from "react-router";

export interface TabItem {
  id: string;
  label: string;
  to: string;
}

/**
 * Sharedunderline tab bar for the three secondary pages. Left-aligned,
 * 2px active underline, identical geometry on /feed, /discover and /discover/projects.
 */
export function UnderlineTabs({
  items,
  active,
  className = "",
  sticky = false,
  right,
}: {
  items: TabItem[];
  active: string;
  className?: string;
  sticky?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div
      className={`${sticky ? "sticky top-0 z-20 bg-white/85 backdrop-blur-md " : ""}border-b border-[#eff3f4] ${className}`}
    >
      <div className="flex items-center gap-1">
        {items.map((t) => (
          <Link
            key={t.id}
            to={t.to}
            preventScrollReset
            className={`relative px-3 pb-3 pt-2 text-[14px] font-medium transition ${
              active === t.id ? "text-[#0f1419]" : "text-[#536471] hover:text-[#0f1419]"
            }`}
          >
            {t.label}
            {active === t.id && (
              <span className="absolute inset-x-2 bottom-0 h-[2px] rounded bg-[#0f1419]" />
            )}
          </Link>
        ))}
        {right && <div className="ml-auto flex items-center text-[12.5px] text-[#8b93a3] tabular-nums">{right}</div>}
      </div>
    </div>
  );
}
