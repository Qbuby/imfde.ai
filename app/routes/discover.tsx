import type { Route } from "./+types/discover";
import { Link, useSearchParams } from "react-router";
import { Search } from "lucide-react";
import { searchPeople } from "~/lib/queries.server";
import type { PersonRow } from "~/lib/queries.server";
import { getMe } from "~/lib/session.server";
import { FollowButton } from "~/components/cards";
import { Avatar, CoverArt } from "~/components/media";
import { PageHead } from "~/components/page-head";
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
        title="找到正在现场做事的人"
        description="按名字、方向或技能找。页面上看到的都是原始信息，平台不做排名，也不给任何人打等级。"
      />

      <form method="get" className="mt-6 max-w-[560px]">
        <div className="flex h-[48px] items-center gap-2 rounded-full border border-[#e2e5ea] bg-[#f7f9f9] pl-4 pr-1.5 transition focus-within:border-[#0f1419] focus-within:bg-white">
          <Search size={18} className="shrink-0 text-[#8b93a3]" strokeWidth={1.65} aria-hidden />
          <input name="q" defaultValue={q} placeholder="搜名字、handle 或一句话介绍" aria-label="搜索 FDE"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#8b93a3]" />
          {kind && <input type="hidden" name="kind" value={kind} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          {skill && <input type="hidden" name="skill" value={skill} />}
          <button className="h-[36px] shrink-0 rounded-full bg-[#0f1419] px-5 text-[13px] font-semibold text-white hover:bg-[#272c30]">搜索</button>
        </div>
      </form>

      {/* single flat filter row, no pills-in-pills */}
      <div className="mt-5 border-b border-[#eff3f4] pb-3">
        <div className="flex flex-wrap items-center gap-1">
          {KINDS.map((k) => (
            <Link key={k.v || "all"} to={withParam("kind", k.v)} preventScrollReset
              className={`rounded-[6px] px-3 py-1.5 text-[13px] font-medium transition ${kind === k.v ? "bg-[#f7f9f9] text-[#0f1419]" : "text-[#536471] hover:text-[#0f1419]"}`}>
              {k.label}
            </Link>
          ))}
          <span className="ml-auto text-[12.5px] text-[#8b93a3] tabular-nums">{people.length} 位</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {QUICK_SKILLS.map((sk) => (
            <Link key={sk} to={withParam("skill", skill === sk ? "" : sk)} preventScrollReset
              className={`rounded-full border px-2.5 py-1 text-[12px] transition ${skill === sk ? "border-[#0f1419] bg-[#0f1419] text-white" : "border-[#eff3f4] bg-white text-[#536471] hover:border-[#cfd4dc]"}`}>
              #{sk}
            </Link>
          ))}
          <span className="ml-2 flex items-center gap-1">
            {SORTS.map((so) => (
              <Link key={so.v || "followers"} to={withParam("sort", so.v)} preventScrollReset
                className={`px-2 py-1 text-[12px] transition ${sort === so.v ? "font-semibold text-[#0f1419]" : "text-[#8b93a3] hover:text-[#0f1419]"}`}>
                {so.label}
              </Link>
            ))}
          </span>
        </div>
      </div>

      {people.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[16px] font-semibold text-[#0f1419]">没找到</p>
          <p className="mt-1.5 text-[13.5px] text-[#536471]">换个关键词，或者去掉筛选条件。</p>
          <Link to="/discover" className="mt-5 inline-block text-[13px] font-medium text-[#0f1419] hover:underline">清空筛选 →</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => <TalentCard key={p.id} person={p} viewerId={viewerId} />)}
        </div>
      )}
    </div>
  );
}

function TalentCard({ person, viewerId }: { person: PersonRow; viewerId: string | null }) {
  const works = person.preview_projects;
  return (
    <article className="rounded-[14px] border border-[#e6e8ec] bg-white p-4 transition-colors hover:border-[#c8cdd5]">
      <div className="flex items-start gap-3">
        <Link to={`/@${person.handle}`} className="group/avatar flex min-w-0 flex-1 items-center gap-3">
          <span className="block transition-transform duration-200 ease-out group-hover/avatar:scale-[1.07] group-hover/avatar:-rotate-3">
            <Avatar name={person.display_name} src={person.avatar_url} size={44} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[15px] font-semibold text-[#0f1419]">{person.display_name}</p>
              {person.kind === "team" && <span className="rounded-[6px] bg-[#f7f9f9] px-2 py-0.5 text-[11px] text-[#536471]">团队</span>}
            </div>
            <p className="truncate font-mono text-[11.5px] text-[#8b93a3]">@{person.handle}{person.location ? ` · ${person.location}` : ""}</p>
          </div>
        </Link>
        {viewerId !== person.id && (
          <FollowButton targetId={person.id} following={Boolean(person.following)} signedIn={Boolean(viewerId)} size="sm" />
        )}
      </div>

      {person.headline && <p className="mt-3 line-clamp-2 text-[13.5px] leading-[1.5] text-[#536471]">{person.headline}</p>}
      {person.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {person.skills.map((s) => <span key={s} className="rounded-full bg-[#f7f9f9] px-2.5 py-0.5 text-[11.5px] font-medium text-[#536471]">{s}</span>)}
        </div>
      )}

      {works.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {works.map((w) => (
            <Link key={w.id} to={`/projects/${w.slug}`} className="group/thumb relative block aspect-[16/10] overflow-hidden rounded-[10px] border border-[rgba(0,0,0,0.06)]">
              <CoverArt seed={w.slug} src={w.cover_url} aspect="16 / 10"
                className="h-full w-full transition-transform duration-500 ease-out group-hover/thumb:scale-[1.03]" />
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 via-black/30 to-transparent px-2 pb-1.5 pt-4 text-[11px] font-medium text-white">{w.title}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-[#eff3f4] pt-3 font-mono text-[11.5px] text-[#536471] tabular-nums">
        <span>{person.projects} 作品{person.hide_follows ? "" : ` · ${compact(person.followers)} 关注者`}</span>
        <Link to={`/@${person.handle}`} className="font-sans text-[12px] font-medium text-[#0f1419] hover:underline">查看主页 →</Link>
      </div>
    </article>
  );
}
