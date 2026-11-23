import type { Route } from "./+types/radar-detail";
import { Link } from "react-router";
import { PageHead } from "~/components/page-head";
import { CopyLinkButton } from "~/components/copy-link";
import { intelById } from "~/lib/queries.server";
import { relativeTime, absoluteDate } from "~/lib/format";

export async function loader({ params, context }: Route.LoaderArgs) {
  const item = await intelById(context, String(params.id ?? ""));
  if (!item) throw new Response("Not Found", { status: 404 });
  return { item, now: Date.now() };
}

export default function RadarDetail({ loaderData }: Route.ComponentProps) {
  const { item, now } = loaderData;
  const back = item.kind === "job" ? "/radar/jobs" : "/radar/gigs";
  const paragraphs = item.detail_md.split(/\n+/).filter(Boolean);

  return (
    <div className="mx-auto max-w-[760px]">
      <nav className="mb-4 text-[13px] text-[#536471]">
        <Link to={back} className="hover:text-[#0f1419]">← {item.kind === "job" ? "招聘信息" : "接单机会"}</Link>
      </nav>
      <PageHead title={item.title} />

      <div className="mt-5 flex flex-wrap items-center gap-2 text-[12.5px] text-[#536471]">
        <span className={`rounded-[5px] px-1.5 py-0.5 font-medium ${item.region === "domestic" ? "bg-[#eef2ff] text-[#4f46e5]" : "bg-[#f0f2f5] text-[#697386]"}`}>
          {item.region === "domestic" ? "国内" : "海外"}
        </span>
        {item.company && <span>{item.company}</span>}
        {item.location && <span>· {item.location}</span>}
        {item.budget && <span className="font-semibold text-[#0f1419]">· {item.budget}</span>}
        <span>· #{item.tag}</span>
      </div>
      <p className="mt-2 font-sans text-[12px] text-[#8b93a3] tabular-nums">
        {item.source} · {relativeTime(item.fetched_at, now)}收录{item.published_at ? ` · 发布于 ${absoluteDate(item.published_at)}` : ""}
      </p>

      <p className="mt-5 text-[15.5px] leading-[1.7] text-[#2c353d]">{item.summary}</p>

      <article className="mt-6 space-y-4 border-t border-[#eff3f4] pt-6">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-wrap text-[14.5px] leading-[1.8] text-[#2c353d]">{p}</p>
        ))}
      </article>

      <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-[#eff3f4] pt-5">
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[#0f1419] px-6 text-[14px] font-semibold text-white transition hover:bg-[#272c30]"
        >
          {item.kind === "job" ? "前往原帖 / 投递" : "前往原帖 / 接单"} <span aria-hidden>↗</span>
        </a>
        <Link
          to={`/feed?discuss=${encodeURIComponent(item.id)}`}
          className="inline-flex h-11 items-center rounded-full border border-[#e2e5ea] bg-white px-6 text-[14px] font-medium text-[#0f1419] transition hover:border-[#0f1419]"
        >
          发到广场聊一下
        </Link>
        <CopyLinkButton path={`/radar/item/${item.id}`} label="复制链接" className="btn btn-ghost btn-sm" />
      </div>
      <p className="mt-4 text-[11.5px] text-[#8b93a3]">外部公开信息整理，投递或合作前请以原页面为准</p>
    </div>
  );
}
