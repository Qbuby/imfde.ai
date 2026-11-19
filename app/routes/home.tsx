import type { Route } from "./+types/home";
import { Link } from "react-router";
import { getMe } from "~/lib/session.server";
import {
  featuredPeople,
  followingPosts,
  latestPosts,
  latestProjects,
  recommendedPeople,
} from "~/lib/queries.server";
import { PersonCard, PostCard, ProjectCard } from "~/components/cards";
import { Avatar, CoverArt } from "~/components/media";

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await getMe(context, request);
  const tab =
    new URL(request.url).searchParams.get("tab") === "latest"
      ? "latest"
      : "following";

  const projects = await latestProjects(context, 8);
  const people = await featuredPeople(context, 6);

  if (!me) {
    return {
      me: null,
      tab,
      projects,
      people,
      posts: await latestPosts(context, null, 6),
      recommended: [],
    };
  }

  return {
    me,
    tab,
    projects,
    people,
    posts:
      tab === "latest"
        ? await latestPosts(context, me.id, 20)
        : await followingPosts(context, me.id, 20),
    recommended: await recommendedPeople(context, me.id, 4),
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { me, tab, projects, people, posts, recommended } = loaderData;

  if (!me) return <Landing projects={projects} people={people} posts={posts} />;

  return (
    <div className="grid gap-10 pt-2 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <TabLink to="/?tab=following" active={tab === "following"}>
              关注
            </TabLink>
            <TabLink to="/?tab=latest" active={tab === "latest"}>
              最新
            </TabLink>
          </div>
          <Link to="/new/post" className="btn btn-primary btn-sm sm:hidden">
            写点什么
          </Link>
        </div>

        {posts.length === 0 ? (
          <EmptyFeed tab={tab} />
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-[98px] space-y-7">
          {recommended.length > 0 && (
            <section>
              <h2 className="section-title mb-3">可以关注的 FDE</h2>
              <div className="space-y-2">
                {recommended.map((p) => (
                  <PersonCard key={p.id} person={p} />
                ))}
              </div>
              <Link
                to="/discover"
                className="mt-3 inline-block text-[14px] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                看全部 →
              </Link>
            </section>
          )}

          {projects.length > 0 && (
            <section>
              <h2 className="section-title mb-3">最新作品</h2>
              <div className="space-y-2">
                {projects.slice(0, 3).map((pr) => (
                  <Link
                    key={pr.id}
                    to={`/projects/${pr.slug}`}
                    className="card card-link flex items-center gap-3 p-2.5"
                  >
                    <div className="w-[56px] shrink-0 overflow-hidden rounded-[10px]">
                      <CoverArt seed={pr.slug} src={pr.cover_url} aspect="1 / 1" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold">{pr.title}</p>
                      <p className="truncate text-[13px] text-[var(--color-muted)]">
                        {pr.display_name}
                       </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}

function TabLink({
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
      className={`rounded-full px-3.5 py-1.5 text-[14px] font-medium transition ${
        active
          ? "bg-[var(--color-ink-2)] text-white"
          : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      }`}
    >
      {children}
    </Link>
  );
}

function EmptyFeed({ tab }: { tab: string }) {
  return (
    <div className="card px-6 py-16 text-center">
      <p className="display text-[23px]">
        {tab === "following" ? "关注还没开始" : "全站还没有动态"}
      </p>
      <p className="mx-auto mt-3 max-w-[380px] text-[16px] leading-relaxed text-[var(--color-muted)]">
        {tab === "following"
          ? "去发现页找几位正在做事的 FDE，关注之后他们的更新会出现在这里。"
          : "第一个发帖的人会出现在这里。"}
      </p>
      <div className="mt-7 flex justify-center gap-2">
        <Link to="/discover" className="btn btn-ghost btn-sm">
          去发现 FDE
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
              <CoverArt seed="imfde-hero" aspect="1 / 1" className="h-full" />
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

      <section className="mt-14 grid gap-4 sm:grid-cols-3">
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
          <div key={x.t} className="card p-6">
            <h3 className="display text-[19px]">{x.t}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-muted)]">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <section className="mt-14">
          <h2 className="section-title mb-4">最近在说什么</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {posts.slice(0, 4).map((post) => (
              <PostCard key={post.id} post={post} showActions={false} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-14 overflow-hidden rounded-[20px] bg-[var(--color-ink)] px-6 py-16 text-center sm:px-10">
        <h2 className="display text-[clamp(26px,3vw,40px)] text-white">
          先把自己放上来。
        </h2>
        <p className="mx-auto mt-3 max-w-[460px] text-[16px] leading-relaxed text-white/65">
          注册不需要认证。填一个 handle，写一句话，贴一个作品，就足够开始了。
        </p>
        <Link
          to="/join"
          className="btn mt-8 bg-white text-[var(--color-ink)] hover:bg-white/90"
        >
          免费建主页
        </Link>
      </section>
    </div>
  );
}
