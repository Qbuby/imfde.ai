import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Search, ArrowUpRight, Link2, Heart, MessageCircle, Repeat2, Bookmark } from "lucide-react";
import { PreviewStage } from "~/components/preview-stage";
import { getMe } from "~/lib/session.server";
import {
  feedPosts,
  featuredPeople,
  latestProjects,
  recommendedPeople,
  topSkills,
  countsForProfile,
} from "~/lib/queries.server";
import { FeedCard, PersonCard, ProjectCard } from "~/components/cards";
import { Avatar, CoverArt } from "~/components/media";

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await getMe(context, request);
  const viewerId = me?.id ?? null;

  // all independent — run them together instead of six sequential awaits
  const [projects, people, feed, recommended, skills, stats] = await Promise.all([
    latestProjects(context, viewerId, 8),
    featuredPeople(context, viewerId, 6),
    feedPosts(context, { viewerId, limit: 5 }),
    me ? recommendedPeople(context, me.id, 4) : Promise.resolve([]),
    me ? topSkills(context, 4) : Promise.resolve([]),
    me
      ? countsForProfile(context, me.id)
      : Promise.resolve({ projects: 0, posts: 0, followers: 0, following: 0 }),
  ]);

  return {
    me,
    projects,
    people,
    posts: feed.rows,
    recommended,
    skills,
    stats,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { me, projects, people, posts, recommended, skills, stats } = loaderData;

  if (!me) return <Landing projects={projects} people={people} posts={posts} />;

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_308px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
              个人仪表盘
            </p>
            <h1 className="mt-1.5 text-[34px] font-semibold leading-tight tracking-[-0.02em]">
              欢迎，{me.display_name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/new/project" className="btn btn-primary btn-sm !h-[40px]">
              上传作品
            </Link>
            <Link to={`/@${me.handle}`} className="btn btn-ghost btn-sm !h-[40px]">
              看我的主页
            </Link>
          </div>
        </div>

        {/* 4-up metric strip: one ruled box, hairline dividers */}
        <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-[var(--color-line-soft)] sm:grid-cols-4">
          {[
            { k: "作品", v: String(stats.projects) },
            { k: "动态", v: String(stats.posts) },
            { k: "关注者", v: String(stats.followers) },
            { k: "关注", v: String(stats.following) },
          ].map((m) => (
            <div key={m.k} className="bg-white px-4 py-4">
              <p className="text-[13px] text-[var(--color-ink-soft)]">{m.k}</p>
              <p className="mt-1 text-[26px] font-medium leading-none tracking-[-0.01em]">
                {m.v}
              </p>
            </div>
          ))}
        </div>

        <Link
          to="/new/post"
          className="mt-6 flex items-center gap-3 rounded-[12px] border border-[var(--color-line)] bg-white px-4 py-3 transition hover:border-[var(--color-ink-soft)]"
        >
          <Avatar name={me.display_name} src={me.avatar_url} size={34} />
          <span className="flex-1 text-[16px] text-[var(--color-faint)]">
            你在做什么，{me.display_name}？
          </span>
          <span className="btn btn-primary btn-sm !h-[34px] shrink-0">发布</span>
        </Link>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[20px] font-semibold tracking-[-0.01em]">最新现场动态</h2>
            <Link
              to="/feed"
              className="text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              进入广场 →
            </Link>
          </div>

          {posts.length === 0 ? (
            <EmptyFeed />
          ) : (
            <div className="border-t border-[var(--color-line-soft)]">
              <div className="divide-y divide-[var(--color-line-soft)]">
                {posts.map((post) => (
                  <FeedCard key={post.id} post={post} viewerId={me?.id ?? null} />
                ))}
              </div>
              <Link
                to="/feed"
                className="mt-2 flex items-center justify-center rounded-[10px] border border-[var(--color-line-soft)] py-2.5 text-[13px] text-[var(--color-ink-soft)] transition hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              >
                进入广场，看全部动态
              </Link>
            </div>
          )}
        </div>
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-6 space-y-7">
          {skills.length > 0 && (
            <div>
              <p className="mb-2.5 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
                热门方向 ↗
              </p>
              <div className="space-y-3">
                {skills.map((s) => (
                  <Link
                    key={s.skill_name}
                    to={`/discover?skill=${encodeURIComponent(s.skill_name)}`}
                    className="block"
                  >
                    <p className="text-[15px] font-medium hover:opacity-70">
                      <span className="text-[var(--color-faint)]">#</span>{" "}
                      {s.skill_name}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">
                      {s.n} 个作品用到
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <p className="mb-2.5 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
                最近的作品
              </p>
              <div className="space-y-2">
                {projects.slice(0, 3).map((pr) => (
                  <Link
                    key={pr.id}
                    to={`/projects/${pr.slug}`}
                    className="flex items-center gap-2.5 py-1.5 transition hover:opacity-70"
                  >
                    <span className="w-[42px] shrink-0 overflow-hidden rounded-[8px]">
                      <CoverArt seed={pr.slug} src={pr.cover_url} aspect="1 / 1" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium">
                        {pr.title}
                      </span>
                      <span className="block truncate text-[12.5px] text-[var(--color-ink-soft)]">
                        {pr.display_name}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {recommended.length > 0 && (
            <div>
              <p className="mb-2.5 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
                可以关注的 FDE
              </p>
              <div className="space-y-1">
                {recommended.map((p) => (
                  <PersonCard key={p.id} person={p} viewerId={me?.id ?? null} />
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}


function EmptyFeed() {
  return (
    <div className="border-t border-[var(--color-line-soft)] py-16 text-center">
      <p className="text-[16px] font-semibold">广场还没有动态</p>
      <p className="mx-auto mt-1.5 max-w-[380px] text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">
        第一个发帖的人会出现在这里。也可以先去广场看看别人在做什么。
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Link to="/feed" className="btn btn-ghost btn-sm">
          去广场
        </Link>
        <Link to="/new/post" className="btn btn-primary btn-sm">
          我发第一条
        </Link>
      </div>
    </div>
  );
}

function Landing({
  projects,
  people,
  posts,
}: {
  projects: Awaited<ReturnType<typeof latestProjects>>;
  people: Awaited<ReturnType<typeof featuredPeople>>;
  posts: Awaited<ReturnType<typeof feedPosts>>["rows"];
}) {
  return (
    <div className="pb-8">
      {/* hero: high-contrast type + interactive three-state preview stage */}
      <section className="hero-glow pt-8 sm:pt-12">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div>
            <p className="mb-5 font-mono text-[10.5px] tracking-[1.4px] text-[var(--color-ink-soft)] uppercase">
              FDE 的主页 · 作品集 · 专业网络
            </p>
            <h1 className="display text-[clamp(40px,5vw,66px)]">
              你的作品，
              <br />
              值得被找到。
            </h1>
            <p className="lead mt-6 max-w-[470px]">
              iMFDE 把散落在 GitHub、LinkedIn 和聊天记录里的证据，集中到一个能被搜索、能被分享的地址。
              不做交易撮合，不合成信用分，只展示可观察的事实。
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/join" className="btn btn-primary !h-[52px] !px-7">
                免费建主页
              </Link>
              <Link to="/feed" className="btn btn-ghost !h-[52px] !px-7">
                先逛广场 <ArrowUpRight size={16} strokeWidth={1.65} aria-hidden />
              </Link>
            </div>
            <p className="mt-7 font-mono text-[10.5px] tracking-[0.14em] text-[var(--color-faint)] uppercase">
              不经手交易 · 不做信用分 · 只展示可观察的信息
            </p>
          </div>
          <div className="min-w-0">
            <PreviewStage />
          </div>
        </div>
      </section>

      {/* search composer: 680 wide, 20px radius, as measured */}
      <section className="mt-11">
        <form method="get" action="/discover" className="mx-auto max-w-[680px]">
          <div className="search-shell">
            <span className="text-[var(--color-faint)]" aria-hidden>
              <Search size={18} strokeWidth={1.65} />
            </span>
            <input
              name="q"
              placeholder="找 FDE：Agent、语音、私有部署"
              aria-label="搜索 FDE"
            />
            <button className="btn btn-primary btn-sm !h-[44px] !px-6 shrink-0">
              搜索
            </button>
          </div>
          {people.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              {people.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  to={`/@${p.handle}`}
                  className="chip hover:bg-[var(--color-sunken-deep)]"
                >
                  {p.display_name}
                </Link>
              ))}
            </div>
          )}
        </form>
      </section>

      {/* visual bento: three promises, each with a tiny real UI specimen */}
      <section className="mt-16 grid gap-4 lg:grid-cols-3">
        <div className="surface-panel relative overflow-hidden p-6 lg:col-span-1">
          <div className="mb-5 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper)] p-2.5">
            <div className="flex items-center gap-1.5 rounded-[6px] border border-[var(--color-line)] bg-white px-2.5 py-1.5">
              <span className="micro-mono truncate">imfde.ai/@你的名字</span>
              <Link2 size={12} strokeWidth={1.65} className="ml-auto shrink-0 text-[var(--color-faint)]" aria-hidden />
            </div>
          </div>
          <h3 className="font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
            一个稳定地址
          </h3>
          <p className="mt-2.5 text-[15px] font-medium leading-[1.55] tracking-[-0.01em] text-[var(--color-ink)]">
            能被搜索、被分享，写进简历和邮件签名。
          </p>
        </div>

        <div className="surface-panel relative overflow-hidden p-6 lg:col-span-1">
          <div className="mb-5 flex gap-2">
            <div className="h-16 flex-1 overflow-hidden rounded-[8px] border border-[var(--hairline)]">
              <CoverArt seed="feature-work-1" aspect="4 / 3" />
            </div>
            <div className="h-16 flex-1 overflow-hidden rounded-[8px] border border-[var(--hairline)]">
              <CoverArt seed="feature-work-2" aspect="4 / 3" />
            </div>
          </div>
          <h3 className="font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
            作品比简历有说服力
          </h3>
          <p className="mt-2.5 text-[15px] font-medium leading-[1.55] tracking-[-0.01em] text-[var(--color-ink)]">
            截图、Demo、仓库链接，加上你本人写的角色说明。
          </p>
        </div>

        <div className="surface-panel relative overflow-hidden p-6 lg:col-span-1">
          <div className="mb-5 rounded-[10px] border border-[var(--color-line)] bg-white p-3">
            <p className="text-[11px] leading-relaxed text-[var(--color-ink)]">
              卡在 <span className="text-[var(--color-link)]">#语音转写</span> 的延迟上，下一步试流式。
            </p>
            <div className="mt-2 flex items-center gap-4 text-[var(--color-faint)]">
              <span className="flex items-center gap-1 text-[var(--color-like)]"><Heart size={12} strokeWidth={1.65} fill="currentColor" aria-hidden /> 24</span>
              <span className="flex items-center gap-1 text-[var(--color-link)]"><MessageCircle size={12} strokeWidth={1.65} aria-hidden /> 8</span>
              <span className="flex items-center gap-1 text-[var(--color-repost)]"><Repeat2 size={12} strokeWidth={1.65} aria-hidden /> 5</span>
              <span className="flex items-center gap-1"><Bookmark size={12} strokeWidth={1.65} aria-hidden /></span>
            </div>
          </div>
          <h3 className="font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
            同行的视线
          </h3>
          <p className="mt-2.5 text-[15px] font-medium leading-[1.55] tracking-[-0.01em] text-[var(--color-ink)]">
            专业关系从真实做过的事开始，不从粉丝数开始。
          </p>
        </div>
      </section>

      {projects.length > 0 && (
        <section className="mt-14">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="section-title">最近有人在做的</h2>
            <Link
              to="/discover/projects"
              className="text-[14px] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              全部作品 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 lg:grid-cols-4">
            {projects.slice(0, 4).map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      {people.length > 0 && (
        <section className="mt-14">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="section-title">正在现场的人</h2>
            <Link
              to="/discover"
              className="text-[14px] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              全部 FDE →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="mt-16">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="section-title">最新现场动态</h2>
            <Link
              to="/feed"
              className="hidden text-[14px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] sm:block"
            >
              进入广场 →
            </Link>
          </div>
          <div className="border-t border-[var(--color-line-soft)] lg:grid lg:grid-cols-2 lg:gap-x-10">
            {posts.slice(0, 5).map((post) => (
              <FeedCard key={post.id} post={post} showFollow={false} />
            ))}
          </div>
          <Link
            to="/feed"
            className="mt-3 flex items-center justify-center rounded-[10px] border border-[var(--color-line-soft)] py-2.5 text-[13px] text-[var(--color-ink-soft)] transition hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)] sm:hidden"
          >
            进入广场，看全部动态
          </Link>
        </section>
      )}

      <section className="mt-16 overflow-hidden rounded-[16px] bg-[var(--color-ink)] px-6 py-14 text-center sm:px-10">
        <h2 className="text-[32px] font-semibold tracking-[-0.02em] text-white">
          先把自己放上来。
        </h2>
        <p className="mx-auto mt-2.5 max-w-[460px] text-[15px] leading-relaxed text-white/65">
          注册不需要认证。填一个 handle，写一句话，贴一个作品，就足够开始了。
        </p>
        <Link
          to="/join"
          className="btn mt-7 bg-white text-[var(--color-ink)] hover:bg-white/90"
        >
          免费建主页
        </Link>
      </section>
    </div>
  );
}
