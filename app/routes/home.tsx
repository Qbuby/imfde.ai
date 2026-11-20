import type { Route } from "./+types/home";
import { Link } from "react-router";
import { getMe } from "~/lib/session.server";
import {
  featuredPeople,
  latestPosts,
  latestProjects,
  recommendedPeople,
  topSkills,
  countsForProfile,
} from "~/lib/queries.server";
import { PersonCard, PostCard, ProjectCard } from "~/components/cards";
import { Avatar, CoverArt } from "~/components/media";

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await getMe(context, request);

  const projects = await latestProjects(context, me?.id ?? null, 8);
  const people = await featuredPeople(context, 6);

  if (!me) {
    return {
      me: null,
      projects,
      people,
      posts: await latestPosts(context, null, 5),
      recommended: [],
    };
  }

  return {
    me,
    projects,
    people,
    posts: await latestPosts(context, me.id, 5),
    recommended: await recommendedPeople(context, me.id, 4),
    skills: await topSkills(context, 4),
    stats: await countsForProfile(context, me.id),
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
                  <PostCard key={post.id} post={post} />
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
                  <PersonCard key={p.id} person={p} />
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
  posts: Awaited<ReturnType<typeof latestPosts>>;
}) {
  const heroProjects = projects.slice(0, 3);

  return (
    <div className="pb-8">
      {/* hero: artwork column 437px + headline column, matching Contra's grid */}
      <section className="pt-6">
        <div className="grid items-start gap-[21px] lg:grid-cols-[437px_minmax(0,1fr)]">
          <div className="relative hidden h-[432px] lg:block" aria-hidden="true">
            <div className="absolute inset-0 overflow-hidden rounded-[20px]">
              <CoverArt seed="imfde-hero" aspect="1 / 1" className="h-full" photo={false} />
            </div>
            <p className="absolute left-6 top-5 font-mono text-[11px] tracking-[0.16em] text-[var(--color-ink-soft)] uppercase">
              imfde.ai / @你的名字
            </p>
            <div className="absolute bottom-5 left-5 right-5 rounded-[14px] border border-[var(--color-line-soft)] bg-white/92 p-3.5 backdrop-blur">
              <div className="flex items-center gap-2.5">
                <Avatar name="林舟" size={34} />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold">林舟 · @lin</p>
                  <p className="truncate text-[12.5px] text-[var(--color-muted)]">
                    3 个作品 · 语音与工单
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="overflow-hidden rounded-[8px]">
                    <CoverArt
                      seed={heroProjects[i]?.slug ?? ["agent", "voice", "notes"][i]!}
                      aspect="1 / 1"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h1 className="display max-w-[560px] text-[clamp(34px,4vw,58px)]">
              你的作品，
              <br />
              值得被找到。
            </h1>
            <p className="lead mt-5 max-w-[420px]">
              iMFDE 是 FDE 的主页、作品集和专业网络。分散在 GitHub、LinkedIn
              和聊天记录里的东西，集中到一个能被搜索、被分享的地址。
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/join" className="btn btn-primary">
                建我的主页
              </Link>
              <Link to="/discover" className="btn btn-ghost">
                先看看别人
              </Link>
            </div>

            <p className="mt-5 font-mono text-[11px] tracking-[0.14em] text-[var(--color-faint)] uppercase">
              不经手交易 · 不做信用分 · 只展示可观察的信息
            </p>
          </div>
        </div>
      </section>

      {/* search composer: 680 wide, 20px radius, as measured */}
      <section className="mt-11">
        <form method="get" action="/discover" className="mx-auto max-w-[680px]">
          <div className="search-shell">
            <span className="text-[var(--color-faint)]" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.7" />
              </svg>
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

      <section className="mt-16 grid gap-px overflow-hidden border-y border-[var(--color-line-soft)] bg-[var(--color-line-soft)] sm:grid-cols-3">
        {[
          {
            t: "一个稳定地址",
            d: "imfde.ai/@你的名字。可以被搜索、被分享、被写进简历和邮件签名。",
          },
          {
            t: "作品比简历有说服力",
            d: "项目、Agent、自动化流程，配得上截图、Demo、仓库链接和你的角色说明。",
          },
          {
            t: "同行的视线",
            d: "发动态、关注人、被关注。专业关系从真实做过的事开始，不从粉丝数开始。",
          },
        ].map((x) => (
          <div key={x.t} className="bg-white px-1 py-6 sm:px-6">
            <h3 className="font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
              {x.t}
            </h3>
            <p className="mt-2.5 text-[15px] leading-[1.6] text-[var(--color-ink)]">
              {x.d}
            </p>
          </div>
        ))}
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
              <PostCard key={post.id} post={post} showActions={false} />
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
