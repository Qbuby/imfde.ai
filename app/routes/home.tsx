import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Landing } from "~/components/landing";
import { getMe } from "~/lib/session.server";
import {
  feedPosts,
  featuredPeople,
  latestProjects,
  recommendedPeople,
  topSkills,
  countsForProfile,
} from "~/lib/queries.server";
import { FeedCard, PersonCard } from "~/components/cards";
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
