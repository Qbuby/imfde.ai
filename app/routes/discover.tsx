import type { Route } from "./+types/discover";
import { Link, useSearchParams } from "react-router";
import { Search } from "lucide-react";
import { searchPeople } from "~/lib/queries.server";
import { getMe } from "~/lib/session.server";
import { PersonCard } from "~/components/cards";
import { PageHead } from "~/components/page-head";

const KINDS = [
  { v: "", label: "全部" },
  { v: "individual", label: "独立 FDE" },
  { v: "team", label: "团队 / Studio" },
];

const SORTS = [
  { v: "", label: "关注最多" },
  { v: "projects", label: "作品最多" },
  { v: "new", label: "最近更新" },
];

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
        description="按名字、方向或技能找。页面上看到的都是原始信息：作品数、关注者、他们自己写的话。平台不做排名，也不给任何人打等级。"
      />

      <form method="get" className="mt-7 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <input
            name="q"
            defaultValue={q}
            placeholder="搜名字、handle 或一句话介绍"
            className="field !h-[46px] pl-10"
            aria-label="搜索 FDE"
          />
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-faint)]">
            <Search size={16} strokeWidth={1.65} aria-hidden />
          </span>
        </div>
        {kind && <input type="hidden" name="kind" value={kind} />}
        {sort && <input type="hidden" name="sort" value={sort} />}
        <button className="btn btn-primary">搜索</button>
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <FilterRow label="类型">
          {KINDS.map((k) => (
            <FilterChip
              key={k.v || "all"}
              to={withParam("kind", k.v)}
              active={kind === k.v}
            >
              {k.label}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label="排序">
          {SORTS.map((s) => (
            <FilterChip
              key={s.v || "default"}
              to={withParam("sort", s.v)}
              active={sort === s.v}
            >
              {s.label}
            </FilterChip>
          ))}
        </FilterRow>
      </div>

      {skill && (
        <div className="mt-4 flex items-center gap-2 text-[12.5px] text-[var(--color-muted)]">
          技能筛选：<span className="chip chip-teal">{skill}</span>
          <Link to={withParam("skill", "")} className="text-[var(--color-ink-soft)] hover:underline">
            清除
          </Link>
        </div>
      )}

      <div className="mt-8 border-t border-[var(--color-line-soft)]">
        <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-line-soft)] py-2.5">
          <span className="font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
            {kind === "team"
              ? "团队 / Studio"
              : kind === "individual"
                ? "独立 FDE"
                : "全部 FDE"}
          </span>
          <span className="font-mono text-[11px] text-[var(--color-faint)] tabular-nums">
            {people.length} 位
          </span>
        </div>
        {people.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[16px] font-semibold">没找到</p>
            <p className="mt-1.5 text-[13.5px] text-[var(--color-ink-soft)]">
              换个关键词，或者去掉筛选条件。
            </p>
            <Link to="/discover" className="btn btn-ghost btn-sm mt-5">
              清空筛选
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line-soft)]">
            {people.map((p) => (
              <PersonCard key={p.id} person={p} viewerId={viewerId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 font-mono text-[11px] tracking-[0.1em] text-[var(--color-faint)] uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterChip({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      preventScrollReset
      className={`chip transition ${
        active
          ? "!bg-[var(--color-ink)] !text-white"
          : "hover:!bg-[var(--color-sunken-deep)]"
      }`}
    >
      {children}
    </Link>
  );
}
