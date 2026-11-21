import type { Route } from "./+types/discover-projects";
import { Link, useSearchParams } from "react-router";
import { Search } from "lucide-react";
import { searchProjects } from "~/lib/queries.server";
import { getMe } from "~/lib/session.server";
import { ProjectCard } from "~/components/cards";
import { PageHead } from "~/components/page-head";
import { AnimatedBackground } from "~/components/motion/animated-background";
import { BorderBeam } from "~/components/magicui/border-beam";
import { InView } from "~/components/motion/in-view";

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
        label="Work"
        title="有人真的把它跑起来了"
        description="项目、Agent、自动化流程。每一条都由作者自己写，链接指向他们愿意公开的地方。"
      />

      <form method="get" className="mt-6 max-w-[720px]">
        <div className="search-shell">
          <span className="text-[var(--color-faint)]" aria-hidden>
            <Search size={18} strokeWidth={1.65} />
          </span>
          <input name="q" defaultValue={q} placeholder="搜作品标题或简介" aria-label="搜索作品" />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="access" value={accessMode} />
          {sort && <input type="hidden" name="sort" value={sort} />}
          <button className="btn btn-primary btn-sm !h-[42px] !px-5 shrink-0">搜索</button>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="font-mono text-[11px] tracking-[0.1em] text-[var(--color-faint)] uppercase">类型</span>
        <span className="inline-flex items-center rounded-full border border-[#e3e5ea] bg-[#f7f7f9] p-1">
          <AnimatedBackground
            defaultValue={kind}
            className="rounded-full bg-[#14171f]"
            transition={{ type: "spring", stiffness: 460, damping: 34 }}
          >
            {KINDS.map((k) => (
              <Link
                key={k.v}
                data-id={k.v}
                to={withParam("kind", k.v === "all" ? "" : k.v)}
                preventScrollReset
                className="rounded-full px-2.5 py-1 text-[12px] text-[#4a5264] data-[checked=true]:text-white"
              >
                {k.label}
              </Link>
            ))}
          </AnimatedBackground>
        </span>
        <span className="font-mono text-[11px] tracking-[0.1em] text-[var(--color-faint)] uppercase">访问方式</span>
        <span className="inline-flex items-center rounded-full border border-[#e3e5ea] bg-[#f7f7f9] p-1">
          <AnimatedBackground
            defaultValue={accessMode}
            className="rounded-full bg-[#14171f]"
            transition={{ type: "spring", stiffness: 460, damping: 34 }}
          >
            {ACCESS_MODES.map((a) => (
              <Link
                key={a.v}
                data-id={a.v}
                to={withParam("access", a.v === "all" ? "" : a.v)}
                preventScrollReset
                className="rounded-full px-2.5 py-1 text-[12px] text-[#4a5264] data-[checked=true]:text-white"
              >
                {a.label}
              </Link>
            ))}
          </AnimatedBackground>
        </span>
        <span className="inline-flex items-center rounded-full border border-[#e3e5ea] bg-[#f7f7f9] p-1">
          <AnimatedBackground
            defaultValue={sort || "new"}
            className="rounded-full bg-[#14171f]"
            transition={{ type: "spring", stiffness: 460, damping: 34 }}
          >
            {[
              { v: "new", label: "最新" },
              { v: "likes", label: "赞最多" },
            ].map((s) => (
              <Link
                key={s.v}
                data-id={s.v}
                to={withParam("sort", s.v === "new" ? "" : s.v)}
                preventScrollReset
                className="rounded-full px-2.5 py-1 text-[12px] text-[#4a5264] data-[checked=true]:text-white"
              >
                {s.label}
              </Link>
            ))}
          </AnimatedBackground>
        </span>
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
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => {
              const hero =
                !q && kind === "all" && accessMode === "all" && projects.length >= 2 && i === 0 && p.featured === 1;
              return (
                <InView key={p.id} once viewOptions={{ amount: 0.15 }}>
                  <div className={hero ? "relative sm:col-span-2 overflow-hidden rounded-[18px]" : ""}>
                    {hero && (
                      <BorderBeam size={140} duration={8} borderWidth={1.5} colorFrom="#0ea5e9" colorTo="#f59e0b" />
                    )}
                    <ProjectCard project={p} hero={hero} />
                  </div>
                </InView>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
