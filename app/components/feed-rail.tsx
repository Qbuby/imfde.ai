import { Link } from "react-router";
import * as HoverCard from "@radix-ui/react-hover-card";
import { Avatar } from "./media";
import type { ActivePrompt, HotTag } from "~/lib/queries.server";
import { TOPIC_BLURBS } from "~/lib/badges";

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

function daysLeft(endsAt: number, createdAt: number) {
  const now = Date.now();
  if (now >= endsAt) return "已结束";
  const ms = endsAt - now;
  const total = Math.max(1, endsAt - createdAt);
  const ratio = Math.min(100, Math.max(8, ((now - createdAt) / total) * 100));
  return { label: ms < 86400000 ? `剩余 ${Math.max(1, Math.ceil(ms / 3600000))} 小时` : `剩余 ${Math.ceil(ms / 86400000)} 天`, ratio };
}

/** 同题切磋 rail card — open technical prompts, no prize, no ranking. */
export function PromptsRail({ prompts, activeSlug }: { prompts: ActivePrompt[]; activeSlug?: string }) {
  if (!prompts.length) return null;
  return (
    <section className="rounded-[16px] bg-[#f7f9f9] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-[#0f1419]">同题切磋</h2>
        {activeSlug && <Link to="/feed" className="text-[12px] text-[#536471] hover:text-[#0f1419]">清除筛选</Link>}
      </div>
      <div className="mt-2 space-y-1.5">
        {prompts.map((p) => {
          const remaining = daysLeft(p.ends_at, p.created_at);
          const meta = typeof remaining === "string" ? { label: remaining, ratio: 100 } : remaining;
          return (
            <Link key={p.id} to={`/feed?prompt=${p.slug}`} className={`block rounded-[10px] p-2 transition hover:bg-white ${activeSlug === p.slug ? "bg-white" : ""}`}>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[6px] bg-[#eef2ff] text-[#4f46e5]"><PromptIcon /></span>
                <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#0f1419]">{p.title}</p>
                <span className="flex -space-x-1.5">
                  {p.participants.slice(0, 3).map((x) => (
                    <span key={x.handle} className="rounded-full ring-2 ring-[#f7f9f9]"><Avatar name={x.display_name} src={x.avatar_url} size={22} /></span>
                  ))}
                </span>
              </div>
              <p className="mt-1 font-sans text-[11.5px] text-[#536471] tabular-nums">{p.submissions} 条参与 · {meta.label}</p>
              <span className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-[#e5e7eb]">
                <span className="block h-full rounded-full bg-[#0f1419]" style={{ width: `${meta.ratio}%` }} />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function PromptIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2 3h8M2 6h8M2 9h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Topic rail with one-line editorial blurbs. */
export function TopicsRail({ tags }: { tags: HotTag[] }) {
  if (!tags.length) return null;
  return (
    <section className="rounded-[16px] bg-[#f7f9f9] p-4">
      <h2 className="text-[14px] font-bold text-[#0f1419]">热门话题</h2>
      <div className="mt-2 space-y-0.5">
        {tags.map((t) => (
          <Link key={t.tag} to={`/feed?tag=${encodeURIComponent(t.tag)}`} className="block rounded-[8px] px-2 py-1.5 transition hover:bg-white">
            <span className="flex items-center justify-between text-[13.5px]">
              <span className="font-medium text-[#0f1419]">#{t.tag}</span>
              <span className="font-sans text-[11.5px] text-[#8b93a3] tabular-nums">{t.n}</span>
            </span>
            {TOPIC_BLURBS[t.tag] && <span className="mt-0.5 block text-[12px] leading-relaxed text-[#536471]">{TOPIC_BLURBS[t.tag]}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
