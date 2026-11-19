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
import { CoverArt } from "~/components/media";

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await getMe(context, request);
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") === "latest" ? "latest" : "following";

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
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-full bg-[var(--color-sunken)] p-1">
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
        <div className="sticky top-[88px] space-y-6">
          {recommended.length > 0 && (
            <section>
              <h2 className="eyebrow mb-2.5">可以关注的 FDE</h2>
              <div className="space-y-2">
                {recommended.map((p) => (
                  <PersonCard key={p.id} person={p} />
                ))}
              </div>
              <Link
                to="/discover"
                className="mt-2.5 inline-block text-[12.5px] text-[var(--color-teal)] hover:underline"
              >
                看全部 →
              </Link>
            </section>
          )}

          {projects.length > 0 && (
            <section>
              <h2 className="eyebrow mb-2.5">最新作品</h2>
              <div className="space-y-2">
                {projects.slice(0, 3).map((pr) => (
                  <Link
                    key={pr.id}
                    to={`/projects/${pr.slug}`}
                    className="card card-link flex items-center gap-3 p-2.5"
                  >
                    <div className="w-[56px] shrink-0 overflow-hidden rounded-[10px]">
                      <CoverArt
                        seed={pr.slug}
                        src={pr.cover_url}
                        aspect="1 / 1"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">
                        {pr.title}
                      </p>
                      <p className="truncate text-[11.5px] text-[var(--color-muted)]">
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
      className={`rounded-full px-3.5 py-1.5 text-[13px] transition ${
        active
          ? "bg-[var(--color-surface)] font-medium text-[var(--color-ink)] shadow-[var(--shadow-card)]"
          : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
      }`}
    >
      {children}
    </Link>
  );
}

function EmptyFeed({ tab }: { tab: string }) {
  return (
    <div className="card px-6 py-14 text-center">
      <p className="display text-[19px]">
        {tab === "following" ? "关注还没开始" : "全站还没有动态"}
      </p>
      <p className="mx-auto mt-2 max-w-[380px] text-[13.5px] leading-relaxed text-[var(--color-muted)]">
        {tab === "following"
          ? "去发现页找几位正在做事的 FDE，关注之后他们的更新会出现在这里。"
          : "第一个发帖的人会出现在这里。"}
      </p>
      <div className="mt-6 flex justify-center gap-2">
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
  return (
    <div className="pb-10">
      {/* ── hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[28px] border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-14 sm:px-12 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              "radial-gradient(70% 90% at 12% 0%, #f0e9ff 0%, transparent 60%), radial-gradient(60% 80% at 95% 8%, #e3f2f3 0%, transparent 62%), radial-gradient(80% 90% at 60% 100%, #fdf4d8 0%, transparent 65%)",
          }}
        />
        <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div>
            <p className="eyebrow">FDE · Forward Deployed Engineer</p>
            <h1 className="display mt-4 max-w-[600px] text-[clamp(30px,4vw,46px)]">
              把你做的东西，放在一个能被看见的地方。
            </h1>
            <p className="mt-5 max-w-[520px] text-[15px] leading-[1.75] text-[var(--color-ink-soft)]">
              iMFDE 是 FDE 的主页、作品集和专业网络。分散在 GitHub、LinkedIn 和聊天记录里的东西，
              集中到一个可以被搜索、被分享、被同行看到的地址。
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-2.5">
              <Link to="/join" className="btn btn-primary">
                建我的主页
              </Link>
              <Link to="/discover" className="btn btn-ghost">
                先看看别人
              </Link>
            </div>
            <p className="mt-5 font-mono text-[11px] tracking-[0.12em] text-[var(--color-faint)] uppercase">
              不经手交易 · 不做信用分 · 只展示可观察的信息
            </p>
          </div>

          {/* collage of cover tiles — the only "imagery" on the page */}
          <div className="relative hidden h-[330px] lg:block" aria-hidden="true">
            {(projects.length >= 3
              ? projects.slice(0, 3)
              : [...projects, ...Array(3 - projects.length).fill(null)].slice(0, 3)
            ).map((p, i) => (
              <div
                key={p ? p.id : `seed-${i}`}
                className="absolute overflow-hidden rounded-[18px] shadow-[var(--shadow-pop)]"
                style={{
                  width: i === 0 ? 240 : 190,
                  height: i === 0 ? 170 : 136,
                  top: [0, 56, 200][i],
                  left: [0, 214, 118][i],
                  rotate: ["-4deg", "3deg", "-2deg"][i],
                }}
              >
                <CoverArt
                  seed={p ? p.slug : ["studio", "prototype", "field-notes"][i]!}
                  src={p ? p.cover_url : null}
                  aspect="1 / 1"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── what you get ─────────────────────────────────── */}
      <section className="mt-16 grid gap-3 sm:grid-cols-3">
        {[
          {
            t: "一个稳定地址",
            d: "imfde.ai/@你的名字。可以被搜索、被分享、被写进简历和邮件签名。",
          },
          {
            t: "作品比简历更有说服力",
            d: "项目、Agent、自动化流程，配得上截图、Demo、仓库链接和你的角色说明。",
          },
          {
            t: "同行的视线",
            d: "发动态、关注人、被关注。专业关系从真实做过的事开始，不从粉丝数开始。",
          },
        ].map((x) => (
          <div key={x.t} className="card p-5">
            <h3 className="display text-[17px]">{x.t}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-muted)]">
              {x.d}
            </p>
          </div>
        ))}
      </section>

      {/* ── latest projects ──────────────────────────────── */}
      {projects.length > 0 && (
        <section className="mt-16">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="eyebrow">Latest work</p>
              <h2 className="display mt-2 text-[clamp(22px,2.6vw,30px)]">
                最近有人在做的
              </h2>
            </div>
            <Link
              to="/discover/projects"
              className="text-[13px] text-[var(--color-teal)] hover:underline"
            >
              全部作品 →
            </Link>
          </div>
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {projects.slice(0, 4).map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── people ───────────────────────────────────────── */}
      {people.length > 0 && (
        <section className="mt-16">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="eyebrow">People</p>
              <h2 className="display mt-2 text-[clamp(22px,2.6vw,30px)]">
                正在现场的人
              </h2>
            </div>
            <Link
              to="/discover"
              className="text-[13px] text-[var(--color-teal)] hover:underline"
            >
              全部 FDE →
            </Link>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── recent posts, quiet ──────────────────────────── */}
      {posts.length > 0 && (
        <section className="mt-16">
          <p className="eyebrow">Activity</p>
          <h2 className="display mt-2 text-[clamp(22px,2.6vw,30px)]">
            最近在说什么
          </h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {posts.slice(0, 4).map((post) => (
              <PostCard key={post.id} post={post} showActions={false} />
            ))}
          </div>
        </section>
      )}

      {/* ── close ────────────────────────────────────────── */}
      <section className="mt-16 overflow-hidden rounded-[24px] bg-[var(--color-ink)] px-6 py-14 text-center sm:px-10">
        <h2 className="display text-[clamp(24px,3.4vw,38px)] text-white">
          先把自己放上来。
        </h2>
        <p className="mx-auto mt-3 max-w-[460px] text-[14px] leading-relaxed text-white/65">
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
