import type { Route } from "./+types/radar-list";
import { Link, useSearchParams } from "react-router";
import { PageHead } from "~/components/page-head";
import { UnderlineTabs } from "~/components/underline-tabs";
import { listIntel } from "~/lib/queries.server";
import { relativeTime } from "~/lib/format";

const TAGS = ["FDE", "Agent", "RAG", "语音交互", "OCR", "私有部署", "MCP"];

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const kind = params.kind === "gigs" ? "gig" : "job";
  const region = (url.searchParams.get("region") ?? "") as "domestic" | "overseas" | "";
  const tag = url.searchParams.get("tag") ?? "";
  const q = url.searchParams.get("q") ?? "";
  const items = await listIntel(context, {
    kind,
    region: region === "domestic" || region === "overseas" ? region : "",
    tag: TAGS.includes(tag) ? tag : "",
    q: q.slice(0, 80),
    limit: 60,
  });
  return { kind, region, tag, q, items, now: Date.now() };
}

export default function RadarList({ loaderData }: Route.ComponentProps) {
  const { kind, region, tag, q, items, now } = loaderData;
  const [params] = useSearchParams();
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    return `/radar/${kind === "job" ? "jobs" : "gigs"}${next.toString() ? `?${next}` : ""}`;
  };

  const tabs = [
    { id: "jobs", label: "招聘信息", to: "/radar/jobs" },
    { id: "gigs", label: "接单机会", to: "/radar/gigs" },
  ];

  return (
    <div>
      <PageHead
        title={kind === "job" ? "招聘信息" : "接单机会"}
        description="外部公开信息整理，投递或合作前请以原页面为准。"
      />
      <div className="mt-5">
        <UnderlineTabs items={tabs} active={kind === "job" ? "jobs" : "gigs"} />
      </div>

      <div className="space-y-3 border-b border-[#eff3f4] px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { v: "", t: "全部地区" },
            { v: "domestic", t: "国内" },
            { v: "overseas", t: "海外" },
          ].map((r) => (
            <Link key={r.v} to={set("region", r.v)} className={`rounded-full px-3 py-1 text-[12.5px] font-medium transition ${region === r.v ? "bg-[#0f1419] text-white" : "bg-[#f7f9f9] text-[#536471] hover:text-[#0f1419]"}`}>
              {r.t}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {TAGS.map((t) => (
            <Link key={t} to={set("tag", t === tag ? "" : t)} className={`rounded-full border px-2.5 py-1 text-[12px] transition ${tag === t ? "border-[#0f1419] bg-[#0f1419] text-white" : "border-[#e2e5ea] text-[#536471] hover:border-[#0f1419]"}`}>
              {t}
            </Link>
          ))}
        </div>
        <form method="get" className="max-w-[420px]">
          <input name="q" defaultValue={q} placeholder="搜标题、公司或方向" className="field" />
        </form>
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-16 text-center text-[13.5px] text-[#536471]">暂未抓取到新线索，每小时自动更新。</p>
      ) : (
        <div className="divide-y divide-[#eff3f4]">
          {items.map((item) => (
            <Link key={item.id} to={`/radar/item/${item.id}`} className="block px-4 py-3.5 transition hover:bg-[#fafafa]">
              <div className="flex items-start gap-2">
                <h2 className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-[#0f1419]">{item.title}</h2>
                <span className={`shrink-0 rounded-[5px] px-1.5 py-0.5 text-[11px] font-medium ${item.region === "domestic" ? "bg-[#eef2ff] text-[#4f46e5]" : "bg-[#f0f2f5] text-[#697386]"}`}>
                  {item.region === "domestic" ? "国内" : "海外"}
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-[#536471]">{item.summary}</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-[#8b93a3]">
                {item.company && <span>{item.company}</span>}
                {item.location && <span>{item.location}</span>}
                {item.budget && <span className="font-semibold text-[#0f1419]">{item.budget}</span>}
                <span>#{item.tag}</span>
                <span>{item.source} · {relativeTime(item.fetched_at, now)}更新</span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
