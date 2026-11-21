import type { Route } from "./+types/discover-projects";
import { Link, useSearchParams } from "react-router";
import { Search } from "lucide-react";
import { searchProjects } from "~/lib/queries.server";
import { getMe } from "~/lib/session.server";
import { ProjectCard } from "~/components/cards";
import { PageHead } from "~/components/page-head";

const ACCESS_MODES = [
  { v: "all", label: "全部" },
  { v: "在线体验", label: "在线体验" },
  { v: "开源代码", label: "开源代码" },
  { v: "私有部署", label: "私有部署" },
  { v: "仅 Demo 展示", label: "仅 Demo" },
];

const KINDS = [
  { v: "all", label: "全部" },
  { v: "project", label: "项目" },
  { v: "agent", label: "Agent" },
  { v: "tool", label: "工具" },
  { v: "automation", label: "自动化" },
  { v: "case", label: "案例" },
  { v: "oss", label: "开源" },
];

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || undefined;
  const kind = url.searchParams.get("kind") || "all";
  const sort = url.searchParams.get("sort") || undefined;
  const accessMode = url.searchParams.get("access") || "all";

  const me = await getMe(context, request);
  const projects = await searchProjects(context, {
    q,
    kind,
    sort,
    limit: 30,
    viewerId: me?.id ?? null,
    accessMode,
  });
  return { projects, q: q ?? "", kind, sort: sort ?? "", accessMode };
}

export default function DiscoverProjects({ loaderData }: Route.ComponentProps) {
  const { projects, q, kind, sort, accessMode } = loaderData;
  const [params] = useSearchParams();

  const withParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const s = next.toString();
    return `/discover/projects${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <PageHead
        title="有人真的把它跑起来了"
        description="项目、Agent、自动化流程。每一条都由作者自己写，链接指向他们愿意公开的地方。"
      />

      <form method="get" className="mt-6 max-w-[560px]">
        <div className="flex h-[48px] items-center gap-2 rounded-full border border-[#e2e5ea] bg-[#f7f9f9] pl-4 pr-1.5 transition focus-within:border-[#0f1419] focus-within:bg-white">
          <Search size={18} className="shrink-0 text-[#8b93a3]" strokeWidth={1.65} aria-hidden />
          <input name="q" defaultValue={q} placeholder="搜作品标题或简介" aria-label="搜索作品"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#8b93a3]" />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="access" value={accessMode} />
          {sort && <input type="hidden" name="sort" value={sort} />}
          <button className="h-[36px] shrink-0 rounded-full bg-[#0f1419] px-5 text-[13px] font-semibold text-white hover:bg-[#272c30]">搜索</button>
        </div>
      </form>

      {/* flat type tabs */}
      <div className="mt-5 border-b border-[#eff3f4]">
        <div className="flex flex-wrap items-center gap-1">
          {KINDS.map((k) => (
            <Link key={k.v} to={withParam("kind", k.v === "all" ? "" : k.v)} preventScrollReset
              className={`relative px-3 py-2 text-[13px] font-medium transition ${kind === k.v ? "text-[#0f1419]" : "text-[#536471] hover:text-[#0f1419]"}`}>
              {k.label}
              {kind === k.v && <span className="absolute inset-x-3 bottom-0 h-[2px] rounded bg-[#0f1419]" />}
            </Link>
          ))}
          <span className="ml-auto text-[12.5px] text-[#8b93a3] tabular-nums">{projects.length} 件</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {ACCESS_MODES.map((a) => (
          <Link key={a.v} to={withParam("access", a.v === "all" ? "" : a.v)} preventScrollReset
            className={`rounded-full border px-3 py-1 text-[12px] transition ${accessMode === a.v ? "border-[#0f1419] bg-[#0f1419] text-white" : "border-[#eff3f4] bg-white text-[#536471] hover:border-[#cfd4dc]"}`}>
            {a.label}
          </Link>
        ))}
        <span className="ml-2 flex items-center gap-1">
          {[{v:"new",label:"最新"},{v:"likes",label:"赞最多"}].map((so) => (
            <Link key={so.v} to={withParam("sort", so.v === "new" ? "" : so.v)} preventScrollReset
              className={`px-2 py-1 text-[12px] transition ${(sort || "new") === so.v ? "font-semibold text-[#0f1419]" : "text-[#8b93a3] hover:text-[#0f1419]"}`}>
              {so.label}
            </Link>
          ))}
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[16px] font-semibold text-[#0f1419]">还没有这样的作品</p>
          <p className="mt-1.5 text-[13.5px] text-[#536471]">换个类型或关键词试试。</p>
          <Link to="/new/project" className="mt-5 inline-block text-[13px] font-medium text-[#0f1419] hover:underline">上传第一个 →</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  );
}
