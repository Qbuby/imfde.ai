import { Link } from "react-router";
import * as HoverCard from "@radix-ui/react-hover-card";
import type { IntelItem } from "~/lib/queries.server";
import { relativeTime } from "~/lib/format";

/** Compact signed-in rail trio: ACK quota / my posts / bookmarks. */
export function RailTrio({ handle, remaining }: { handle: string; remaining: number }) {
  const base = "inline-flex h-[32px] items-center gap-1.5 rounded-full border border-[#e2e5ea] bg-white px-3 text-[12.5px] font-medium text-[#0f1419] transition hover:border-[#0f1419]";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <HoverCard.Root openDelay={160} closeDelay={100}>
        <HoverCard.Trigger asChild>
          <span className={`${base} cursor-default`}>
            {remaining > 0 && <span className="h-[5px] w-[5px] rounded-full bg-[#4f46e5]" />}
            {remaining}/2 ACK
          </span>
        </HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Content side="bottom" align="start" sideOffset={6} className="pop-in z-50 w-[280px] rounded-[12px] border border-[#e2e5ea] bg-white p-3.5 shadow-[0_14px_36px_rgba(15,20,25,0.10)]">
            <p className="text-[13px] font-semibold text-[#0f1419]">每天 2 次同行致敬</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#536471]">
              用于标记真正有干货的实践分享。次日 00:00 刷新，不合成任何评分。
            </p>
            <HoverCard.Arrow className="fill-white" />
          </HoverCard.Content>
        </HoverCard.Portal>
      </HoverCard.Root>
      <Link to={`/@${handle}?tab=posts`} className={base}>我的动态</Link>
      <Link to="/feed?tab=bookmarks" className="grid h-[32px] w-[32px] place-items-center rounded-full border border-[#e2e5ea] bg-white text-[#536471] transition hover:border-[#0f1419] hover:text-[#0f1419]" aria-label="我的收藏" title="我的收藏">
        <BookmarkIcon />
      </Link>
    </div>
  );
}

function BookmarkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 2.5h8v11l-4-3-4 3v-11Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/** One compact intel card shared by JobsRail / GigsRail. */
function IntelRailCard({
  title, to, items, now,
}: {
  title: string;
  to: string;
  items: IntelItem[];
  now: number;
}) {
  const updated = items[0]?.fetched_at;
  return (
    <section className="rounded-[16px] bg-[#f7f9f9] p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[14px] font-bold text-[#0f1419]">{title}</h2>
        <Link to={to} className="shrink-0 text-[12px] text-[#536471] transition hover:text-[#0f1419]">全部 →</Link>
      </div>
      {updated && <p className="mt-0.5 font-sans text-[11.5px] text-[#8b93a3] tabular-nums">{relativeTime(updated, now)}更新</p>}
      {items.length === 0 ? (
        <p className="mt-2 text-[12.5px] leading-relaxed text-[#536471]">暂未抓取到新线索，每小时自动更新。</p>
      ) : (
        <div className="mt-2 space-y-0.5">
          {items.slice(0, 3).map((item) => (
            <Link key={item.id} to={`/radar/item/${item.id}`} className="block rounded-[10px] px-2 py-1.5 transition hover:bg-white">
              <div className="flex items-start gap-2">
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#0f1419]">{item.title}</span>
                <span className={`shrink-0 rounded-[5px] px-1.5 py-0.5 text-[10.5px] font-medium ${item.region === "domestic" ? "bg-[#eef2ff] text-[#4f46e5]" : "bg-[#f0f2f5] text-[#697386]"}`}>
                  {item.region === "domestic" ? "国内" : "海外"}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-[#536471]">{item.summary}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 truncate font-sans text-[11.5px] text-[#8b93a3]">
                {item.budget && <span className="font-semibold text-[#0f1419]">{item.budget}</span>}
                {item.location && <span className="truncate">{item.location}</span>}
                <span className="truncate">{item.source}</span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function JobsRail({ items, now }: { items: IntelItem[]; now: number }) {
  return <IntelRailCard title="招聘信息" to="/radar/jobs" items={items} now={now} />;
}

export function GigsRail({ items, now }: { items: IntelItem[]; now: number }) {
  return <IntelRailCard title="接单机会" to="/radar/gigs" items={items} now={now} />;
}
