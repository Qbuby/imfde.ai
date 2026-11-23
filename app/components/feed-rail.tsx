import { Link } from "react-router";
import * as HoverCard from "@radix-ui/react-hover-card";
import type { RadarItem } from "~/lib/queries.server";
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

/**
 * Hourly radar card. Each row is an external link (platform-side record, not a
 * self-description). Signed-in users get a quiet "聊一下" that pre-fills the
 * composer — nothing is published automatically.
 */
function RadarCard({
  title,
  heading,
  items,
  signedIn,
  onDiscuss,
}: {
  title: string;
  heading: string;
  items: RadarItem[];
  signedIn: boolean;
  onDiscuss?: (item: RadarItem) => void;
}) {
  const updated = items[0]?.fetched_at;
  return (
    <section className="rounded-[16px] bg-[#f7f9f9] p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[14px] font-bold text-[#0f1419]">{title}</h2>
        {updated && (
          <span className="font-sans text-[11.5px] text-[#8b93a3] tabular-nums">
            {relativeTime(updated)}更新
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-[12.5px] leading-relaxed text-[#536471]">暂未抓取到新线索，每小时自动更新。</p>
      ) : (
        <div className="mt-2 space-y-0.5">
          {items.map((item) => (
            <div key={item.id} className="rounded-[10px] px-2 py-2 transition hover:bg-white">
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex items-start gap-1 text-[13.5px] font-semibold leading-snug text-[#0f1419] hover:underline"
              >
                <span className="min-w-0 flex-1">{item.title}</span>
                <span className="mt-0.5 shrink-0 text-[11px] text-[#8b93a3]" aria-hidden>↗</span>
              </a>
              <p className="mt-1 text-[12px] leading-relaxed text-[#536471]">{item.summary}</p>
              <div className="mt-1.5 flex items-end justify-between gap-2">
                <p className="min-w-0 flex-1 font-sans text-[11.5px] text-[#8b93a3]">
                  #{item.tag} · {item.source}{item.meta ? ` · ${item.meta}` : ""}
                </p>
                {signedIn && onDiscuss && (
                  <button
                    type="button"
                    onClick={() => onDiscuss(item)}
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-medium text-[#536471] transition hover:bg-[#eef2ff] hover:text-[#4f46e5]"
                  >
                    聊一下
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <span className="sr-only">{heading}</span>
    </section>
  );
}

export function OpportunitiesRail({ items, signedIn, onDiscuss }: { items: RadarItem[]; signedIn: boolean; onDiscuss?: (item: RadarItem) => void }) {
  return <RadarCard title="FDE 实时机会" heading="来自外部公开来源，平台不核实" items={items} signedIn={signedIn} onDiscuss={onDiscuss} />;
}

export function ToolsRail({ items, signedIn, onDiscuss }: { items: RadarItem[]; signedIn: boolean; onDiscuss?: (item: RadarItem) => void }) {
  return <RadarCard title="FDE 新工具" heading="来自外部公开来源，平台不核实" items={items} signedIn={signedIn} onDiscuss={onDiscuss} />;
}
