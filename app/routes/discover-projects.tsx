import type { Route } from "./+types/discover-projects";
import { Link, useSearchParams } from "react-router";
import { Search } from "lucide-react";
import { searchProjects } from "~/lib/queries.server";
import { getMe } from "~/lib/session.server";
import { ProjectCard } from "~/components/cards";
import { PageHead } from "~/components/page-head";

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

  const me = await getMe(context, request);
  const projects = await searchProjects(context, {
    q,
    kind,
    sort,
    limit: 30,
    viewerId: me?.id ?? null,
  });
  return { projects, q: q ?? "", kind, sort: sort ?? "" };
}

export default function DiscoverProjects({ loaderData }: Route.ComponentProps) {
  const { projects, q, kind, sort } = loaderData;
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
        label="Work"
        title="有人真的把它跑起来了"
        description="项目、Agent、自动化流程。每一条都由作者自己写，链接指向他们愿意公开的地方。"
      />

      <form method="get" className="mt-7 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <input
            name="q"
            defaultValue={q}
            placeholder="搜作品标题或简介"
            className="field !h-[46px] pl-10"
            aria-label="搜索作品"
          />
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-faint)]">
            <Search size={16} strokeWidth={1.65} aria-hidden />
          </span>
        </div>
        <input type="hidden" name="kind" value={kind} />
        {sort && <input type="hidden" name="sort" value={sort} />}
        <button className="btn btn-primary">搜索</button>
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-mono text-[11px] tracking-[0.1em] text-[var(--color-faint)] uppercase">
          类型
        </span>
        {KINDS.map((k) => (
          <Link
            key={k.v}
            to={withParam("kind", k.v === "all" ? "" : k.v)}
            preventScrollReset
            className={`chip transition ${
              kind === k.v
                ? "!bg-[var(--color-ink)] !text-white"
                : "hover:!bg-[var(--color-sunken-deep)]"
            }`}
          >
            {k.label}
          </Link>
        ))}
        <span className="ml-3 mr-1 font-mono text-[11px] tracking-[0.1em] text-[var(--color-faint)] uppercase">
          排序
        </span>
        {[
          { v: "", label: "最新" },
          { v: "likes", label: "赞最多" },
        ].map((s) => (
          <Link
            key={s.v || "new"}
            to={withParam("sort", s.v)}
            preventScrollReset
            className={`chip transition ${
              sort === s.v
                ? "!bg-[var(--color-ink)] !text-white"
                : "hover:!bg-[var(--color-sunken-deep)]"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="mt-8 border-t border-[var(--color-line-soft)]">
        <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-line-soft)] py-2.5">
          <span className="font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
            作品
          </span>
          <span className="font-mono text-[11px] text-[var(--color-faint)] tabular-nums">
            {projects.length} 件
          </span>
        </div>
        {projects.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[16px] font-semibold">还没有这样的作品</p>
            <p className="mt-1.5 text-[13.5px] text-[var(--color-ink-soft)]">
              换个类型或关键词试试。
            </p>
            <Link to="/new/project" className="btn btn-primary btn-sm mt-5">
              上传第一个
            </Link>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-8 pt-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
