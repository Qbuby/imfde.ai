import type { Route } from "./+types/discover";
import { Link, useSearchParams } from "react-router";
import { Search } from "lucide-react";
import { searchPeople } from "~/lib/queries.server";
import type { PersonRow } from "~/lib/queries.server";
import { getMe } from "~/lib/session.server";
import { FollowButton } from "~/components/cards";
import { Avatar, CoverArt } from "~/components/media";
import { PageHead } from "~/components/page-head";
import { AnimatedBackground } from "~/components/motion/animated-background";
import { Spotlight } from "~/components/motion/spotlight";
import { compact } from "~/lib/format";

const KINDS = [
  { v: "", label: "全部" },
  { v: "individual", label: "独立 FDE" },
  { v: "team", label: "团队" },
];

const SORTS = [
  { v: "", label: "关注最多" },
  { v: "projects", label: "作品最多" },
  { v: "new", label: "最近更新" },
];

const QUICK_SKILLS = ["Agent", "RAG", "语音", "私有部署", "自动化", "开源"];

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || undefined;
  const kind = url.searchParams.get("kind") || undefined;
  const skill = url.searchParams.get("skill") || undefined;
  const sort = url.searchParams.get("sort") || undefined;

  const me = await getMe(context, request);
  const people = await searchPeople(context, {
    q,
    kind,
    skill,
    sort,
    limit: 30,
    viewerId: me?.id ?? null,
  });

  return {
    people,
    viewerId: me?.id ?? null,
    q: q ?? "",
    kind: kind ?? "",
    skill: skill ?? "",
    sort: sort ?? "",
  };
}

export default function Discover({ loaderData }: Route.ComponentProps) {
  const { people, viewerId, q, kind, skill, sort } = loaderData;
  const [params] = useSearchParams();

  const withParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const s = next.toString();
    return `/discover${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <PageHead
        label="Discover"
        title="找到正在现场做事的人"
        description="按名字、方向或技能找。页面上看到的都是原始信息，平台不做排名，也不给任何人打等级。"
      />

      {/* search */}
      <form method="get" className="mt-6 max-w-[720px]">
        <div className="search-shell">
          <span className="text-[var(--color-faint)]" aria-hidden>
            <Search size={18} strokeWidth={1.65} />
          </span>
          <input
            name="q"
            defaultValue={q}
            placeholder="搜名字、handle 或一句话介绍"
            aria-label="搜索 FDE"
          />
          {kind && <input type="hidden" name="kind" value={kind} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          {skill && <input type="hidden" name="skill" value={skill} />}
          <button className="btn btn-primary btn-sm !h-[42px] !px-5 shrink-0">搜索</button>
        </div>
      </form>

      {/* quick skill filters */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {QUICK_SKILLS.map((s) => {
          const active = skill === s;
          return (
            <Link
              key={s}
              to={withParam("skill", active ? "" : s)}
              preventScrollReset
              className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition ${
                active
                  ? "bg-[#14171f] text-white"
                  : "bg-[#f6f6f6] text-[#4a5264] hover:bg-[#e9eaec]"
              }`}
            >
              #{s}
            </Link>
          );
        })}
        {skill && (
          <Link to="/discover" className="ml-1 text-[12px] text-[var(--color-faint)] hover:underline">
            清除
          </Link>
        )}
      </div>

      {/* kind + sort, spring pill slots */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <PillSlot>
          <AnimatedBackground
            defaultValue={kind || "all"}
            className="rounded-full bg-[#14171f]"
            transition={{ type: "spring", stiffness: 460, damping: 34 }}
          >
            {KINDS.map((k) => (
              <Link
                key={k.v || "all"}
                data-id={k.v || "all"}
                to={withParam("kind", k.v)}
                preventScrollReset
                className="rounded-full px-3 py-1 text-[12.5px] text-[#4a5264] data-[checked=true]:text-white"
              >
                {k.label}
              </Link>
            ))}
          </AnimatedBackground>
        </PillSlot>
        <PillSlot>
          <AnimatedBackground
            defaultValue={sort || "followers"}
            className="rounded-full bg-[#14171f]"
            transition={{ type: "spring", stiffness: 460, damping: 34 }}
          >
            {SORTS.map((s) => (
              <Link
                key={s.v || "followers"}
                data-id={s.v || "followers"}
                to={withParam("sort", s.v)}
                preventScrollReset
                className="rounded-full px-3 py-1 text-[12.5px] text-[#4a5264] data-[checked=true]:text-white"
              >
                {s.label}
              </Link>
            ))}
          </AnimatedBackground>
        </PillSlot>
        <span className="font-mono text-[11px] text-[var(--color-faint)] tabular-nums">
          {people.length} 位
        </span>
      </div>

      {/* talent gallery */}
      {people.length === 0 ? (
        <div className="mt-10 rounded-[16px] border border-[var(--color-line)] bg-white py-16 text-center">
          <p className="text-[16px] font-semibold">没找到</p>
          <p className="mt-1.5 text-[13.5px] text-[var(--color-ink-soft)]">
            换个关键词，或者去掉筛选条件。
          </p>
          <Link to="/discover" className="btn btn-ghost btn-sm mt-5">清空筛选</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => (
            <TalentCard key={p.id} person={p} viewerId={viewerId} />
          ))}
        </div>
      )}
    </div>
  );
}

function PillSlot({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#e3e5ea] bg-[#f7f7f9] p-1">
      {children}
    </span>
  );
}

function TalentCard({ person, viewerId }: { person: PersonRow; viewerId: string | null }) {
  const works = person.preview_projects;
  return (
    <article className="relative overflow-hidden rounded-[16px] border border-[rgba(20,23,31,0.08)] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.04)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-[2px] hover:border-[rgba(20,23,31,0.16)] hover:shadow-[0_4px_12px_rgba(16,24,40,0.06),0_18px_36px_rgba(16,24,40,0.09)]">
      <Spotlight size={240} className="from-sky-400/18 via-violet-400/10 to-transparent" />

      <div className="relative z-10 flex items-start gap-3">
        <Link to={`/@${person.handle}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={person.display_name} src={person.avatar_url} size={46} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[15px] font-semibold text-[#14171f]">{person.display_name}</p>
              {person.kind === "team" && (
                <span className="rounded-full border border-[#e3e5ea] px-1.5 py-0.5 text-[10px] text-[#677084]">团队</span>
              )}
            </div>
            <p className="truncate font-mono text-[11.5px] text-[#8b93a3]">
              @{person.handle}{person.location ? ` · ${person.location}` : ""}
            </p>
          </div>
        </Link>
        {viewerId !== person.id && (
          <FollowButton
            targetId={person.id}
            following={Boolean(person.following)}
            signedIn={Boolean(viewerId)}
            size="sm"
          />
        )}
      </div>

      <p
        className={`relative z-10 mt-3 line-clamp-2 min-h-[40px] text-[13.5px] leading-[1.5] ${
          person.headline ? "text-[#4a5264]" : "text-[#8b93a3]"
        }`}
      >
        {person.headline || "暂无一句话介绍"}
      </p>

      {person.skills.length > 0 && (
        <div className="relative z-10 mt-3 flex flex-wrap gap-1.5">
          {person.skills.map((s) => (
            <span key={s} className="rounded-full bg-[#f4f5f7] px-2.5 py-0.5 text-[11.5px] font-medium text-[#4a5264]">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="relative z-10 mt-4">
        {works.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {works.map((w) => (
              <Link
                key={w.id}
                to={`/projects/${w.slug}`}
                className="group/thumb relative block aspect-[16/10] overflow-hidden rounded-[10px] border border-[rgba(20,23,31,0.06)]"
              >
                <CoverArt
                  seed={w.slug}
                  src={w.cover_url}
                  aspect="16 / 10"
                  className="h-full w-full transition-transform duration-500 ease-out group-hover/thumb:scale-[1.06]"
                />
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/75 via-black/30 to-transparent px-2 pb-1.5 pt-4 text-[11px] font-medium text-white">
                  {w.title}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex h-[74px] items-center justify-between rounded-[10px] border border-dashed border-[#e3e5ea] bg-[#fafafa] px-3.5 text-[12px] text-[#8b93a3]">
            <span>暂无公开作品</span>
            <Link to={`/@${person.handle}`} className="font-medium text-[#4a5264] hover:text-[#14171f]">
              查看主页 ↗
            </Link>
          </div>
        )}
      </div>

      <div className="relative z-10 mt-4 flex items-center gap-4 border-t border-[#eef0f2] pt-3 font-mono text-[11.5px] text-[#677084] tabular-nums">
        <span>{person.projects} 作品</span>
        {person.hide_follows ? null : <span>{compact(person.followers)} 关注者</span>}
      </div>
    </article>
  );
}
