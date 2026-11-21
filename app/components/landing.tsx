import { Link } from "react-router";
import { Search } from "lucide-react";
import { ProjectCard, FeedCard, PersonCard } from "./cards";
import type { FeedPostRow, PersonRow, ProjectCardRow } from "~/lib/queries.server";

export function Landing({
  projects,
  people,
  posts,
}: {
  projects: ProjectCardRow[];
  people: PersonRow[];
  posts: FeedPostRow[];
}) {
  return (
    <div className="overflow-x-hidden pb-10">
      {/* 1 · Centred Contra hero */}
      <section className="mx-auto max-w-[760px] px-5 pt-14 pb-12 text-center sm:pt-20">
        <h1 className="text-[clamp(38px,5vw,60px)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#0f1419]">
          你的作品，值得被找到。
        </h1>
        <p className="mx-auto mt-4 max-w-[520px] text-[17px] leading-[1.6] text-[#536471]">
          FDE 的主页、作品集与专业广场。只展示可观察的事实，不做信用分，不经手交易。
        </p>
        <form action="/discover" method="get" className="mt-8">
          <div className="mx-auto flex h-[58px] max-w-[600px] items-center gap-2 rounded-full border border-[#e2e5ea] bg-white pl-5 pr-2 shadow-[0_6px_24px_rgba(15,20,25,0.06)] transition focus-within:border-[#0f1419]">
            <Search size={18} className="shrink-0 text-[#536471]" strokeWidth={1.65} aria-hidden />
            <input
              name="q"
              placeholder="搜 FDE、Agent、RAG 或私有部署"
              aria-label="搜索 FDE"
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#8b93a3]"
            />
            <button className="h-[42px] shrink-0 rounded-full bg-[#0f1419] px-6 text-[14px] font-semibold text-white transition hover:bg-[#272c30]">
              搜索
            </button>
          </div>
        </form>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {[
            ["Agent 编排", "/discover?skill=Agent"],
            ["RAG", "/discover?skill=RAG"],
            ["语音交互", "/discover?skill=语音"],
            ["私有部署", "/discover?skill=私有部署"],
            ["开源工具", "/discover?skill=开源"],
            ["逛广场 →", "/feed"],
          ].map(([label, to]) => (
            <Link
              key={label}
              to={to}
              className="rounded-full border border-[#eff3f4] bg-[#f7f9f9] px-3 py-1 text-[12.5px] text-[#536471] transition hover:border-[#d0d5dd] hover:text-[#0f1419]"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* 2 · Real work gallery, never fabricated samples */}
      {projects.length > 0 && (
        <section className="mx-auto max-w-[1180px] px-5">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#0f1419]">最新作品</h2>
            <Link to="/discover/projects" className="text-[13px] text-[#536471] hover:text-[#0f1419]">全部作品 →</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.slice(0, 8).map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      {/* 3 · Real community pulse */}
      <section className="mx-auto mt-14 grid max-w-[1180px] grid-cols-1 gap-10 border-t border-[#eff3f4] px-5 pt-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[19px] font-semibold text-[#0f1419]">最新现场动态</h2>
            <Link to="/feed" className="text-[13px] text-[#536471] hover:text-[#0f1419]">进入广场 →</Link>
          </div>
          {posts.length > 0 ? (
            <div className="border-y border-[#eff3f4] divide-y divide-[#eff3f4]">
              {posts.slice(0, 4).map((post) => (
                <FeedCard key={post.id} post={post} showFollow={false} />
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-[14px] text-[#536471]">还没有公开动态。</p>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-[19px] font-semibold text-[#0f1419]">正在现场的 FDE</h2>
          <div className="rounded-[16px] bg-[#f7f9f9] p-5">
            {people.length > 0 ? (
              <>
                {people.slice(0, 4).map((p) => (
                  <PersonCard key={p.id} person={p} />
                ))}
                <Link to="/discover" className="mt-2 block border-t border-[#eff3f4] pt-3 text-[13px] text-[#536471] hover:text-[#0f1419]">
                  查看全部 FDE →
                </Link>
                <Link to="/join" className="mt-2 block text-[13px] text-[#536471] hover:text-[#0f1419]">
                  建我的主页 →
                </Link>
              </>
            ) : (
              <div className="py-6 text-center">
                <p className="text-[13.5px] text-[#536471]">还没有人认领主页。</p>
                <Link to="/join" className="mt-2 inline-block text-[13px] font-medium text-[#0f1419] hover:underline">
                  做第一个 →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4 · Light CTA band */}
      <section className="mx-auto mt-16 max-w-[1180px] px-5">
        <div className="rounded-[20px] border border-[#eff3f4] bg-[#f7f9f9] px-6 py-12 text-center">
          <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-[#0f1419]">先把自己放上来。</h2>
          <p className="mx-auto mt-2 max-w-[460px] text-[14px] leading-relaxed text-[#536471]">
            注册不需要认证。填一个 handle，写一句话，贴一个作品，就足够开始了。
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link to="/join" className="inline-flex h-11 items-center rounded-full bg-[#0f1419] px-6 text-[14px] font-semibold text-white transition hover:bg-[#272c30]">
              免费建主页
            </Link>
            <Link to="/feed" className="inline-flex h-11 items-center rounded-full border border-[#e2e5ea] bg-white px-6 text-[14px] font-medium text-[#0f1419] transition hover:border-[#0f1419]">
              逛广场
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
