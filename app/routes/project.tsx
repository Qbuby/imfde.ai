import type { Route } from "./+types/project";
import { Link, useFetcher } from "react-router";
import { getMe } from "~/lib/session.server";
import { many, one } from "~/lib/db.server";
import { Avatar, CoverArt } from "~/components/media";
import { FollowButton, HeartIcon } from "~/components/cards";
import { absoluteDate, compact } from "~/lib/format";

const KIND_LABEL: Record<string, string> = {
  project: "项目",
  agent: "Agent",
  tool: "工具",
  automation: "自动化流程",
  case: "案例",
  oss: "开源项目",
};

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const [me, project] = await Promise.all([
    getMe(context, request),
    one<{
      id: string;
      owner_id: string;
      slug: string;
      kind: string;
      title: string;
      summary: string;
      description: string | null;
      cover_url: string | null;
      demo_url: string | null;
      docs_url: string | null;
      repo_url: string | null;
      role: string | null;
      stage: string | null;
      access_mode: string | null;
      limitations: string | null;
      visibility: string;
      created_at: number;
      updated_at: number;
      handle: string;
      display_name: string;
      avatar_url: string | null;
      headline: string | null;
      likes: number;
      followers: number;
    }>(
      context,
      `SELECT pr.*, u.handle, p.display_name, p.avatar_url, p.headline,
              (SELECT COUNT(*) FROM reactions r
                WHERE r.target_type='project' AND r.target_id = pr.id) AS likes,
              (SELECT COUNT(*) FROM follows f WHERE f.followed_id = pr.owner_id) AS followers
         FROM projects pr
         JOIN users u ON u.id = pr.owner_id
         JOIN profiles p ON p.user_id = pr.owner_id
        WHERE pr.slug = ?1`,
      params.slug,
    ),
  ]);

  if (!project) throw new Response("Not Found", { status: 404 });
  if (project.visibility === "private" && project.owner_id !== me?.id) {
    throw new Response("Not Found", { status: 404 });
  }

  const [skills, more, following] = await Promise.all([
    many<{ skill_name: string }>(
      context,
      `SELECT skill_name FROM project_skills WHERE project_id = ?1 ORDER BY position`,
      project.id,
    ),
    many<{ id: string; slug: string; title: string; cover_url: string | null; kind: string }>(
      context,
      `SELECT id, slug, title, cover_url, kind FROM projects
        WHERE owner_id = ?1 AND id <> ?2 AND visibility = 'public'
        ORDER BY created_at DESC LIMIT 3`,
      project.owner_id,
      project.id,
    ),
    me
      ? one<{ n: number }>(
          context,
          `SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?1 AND followed_id = ?2`,
          me.id,
          project.owner_id,
        )
      : Promise.resolve(null),
  ]);

  return {
    me,
    project,
    skills: skills.map((s) => s.skill_name),
    more,
    following: Boolean(following?.n),
  };
}

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data?.project) return [{ title: "作品不存在 — iMFDE" }];
  const p = data.project;
  const desc = p.summary.slice(0, 150);
  return [
    { title: `${p.title} — ${p.display_name} · iMFDE` },
    { name: "description", content: desc },
    { property: "og:title", content: p.title },
    { property: "og:description", content: desc },
    { property: "og:type", content: "article" },
  ];
};

export default function Project({ loaderData }: Route.ComponentProps) {
  const { me, project, skills, more, following } = loaderData;
  const fetcher = useFetcher();
  const isOwner = me?.id === project.owner_id;
  const liked = fetcher.formData
    ? fetcher.formData.get("intent") === "like"
    : false;
  const likes = project.likes + (fetcher.formData ? (liked ? 1 : 0) : 0);

  return (
    <article className="mx-auto max-w-[900px]">
      <div className="overflow-hidden rounded-[24px] border border-[var(--color-line)]">
        <CoverArt
          seed={project.slug}
          src={project.cover_url}
                    aspect="16 / 9"
        />
      </div>

      <header className="mt-7 flex flex-wrap items-center gap-2">
        <span className="chip chip-teal">{KIND_LABEL[project.kind] ?? project.kind}</span>
        {project.stage && <span className="chip">{project.stage}</span>}
        {project.access_mode && (
          <span className="chip chip-outline">{project.access_mode}</span>
        )}
      </header>

      <h1 className="display mt-4 text-[clamp(26px,3.2vw,36px)]">{project.title}</h1>
      <p className="mt-3 max-w-[680px] text-[15px] leading-[1.7] text-[var(--color-ink-soft)]">
        {project.summary}
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-3 border-y border-[var(--color-line-soft)] py-4">
        <Link to={`/@${project.handle}`} className="flex items-center gap-2.5">
          <Avatar name={project.display_name} src={project.avatar_url} size={38} />
          <div>
            <p className="text-[14px] font-medium">{project.display_name}</p>
            <p className="font-mono text-[11px] tracking-wide text-[var(--color-faint)]">
              @{project.handle} · {compact(project.followers)} 关注者
            </p>
          </div>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {isOwner ? (
            <Link to="/settings/profile" className="btn btn-ghost btn-sm">
              管理作品
            </Link>
          ) : me ? (
            <FollowButton targetId={project.owner_id} following={following} />
          ) : null}

          <fetcher.Form method="post" action="/actions/like">
            <input type="hidden" name="intent" value={liked ? "unlike" : "like"} />
            <input type="hidden" name="target_type" value="project" />
            <input type="hidden" name="target_id" value={project.id} />
            <button
              className={`btn btn-ghost btn-sm ${liked ? "!text-[var(--color-teal)]" : ""}`}
            >
              <HeartIcon filled={liked} />
              {likes > 0 ? compact(likes) : "赞"}
            </button>
          </fetcher.Form>
        </div>
      </div>

      {project.description && (
        <section className="mt-8">
          <h2 className="eyebrow mb-3">它是什么</h2>
          <div className="whitespace-pre-wrap text-[15px] leading-[1.85] text-[var(--color-ink-2)]">
            {project.description}
          </div>
        </section>
      )}

      {project.role && (
        <section className="mt-8 rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-sunken)] p-5">
          <h2 className="eyebrow mb-2">我负责的部分</h2>
          <p className="whitespace-pre-wrap text-[14px] leading-[1.8] text-[var(--color-ink-2)]">
            {project.role}
          </p>
          <p className="mt-3 text-[12px] text-[var(--color-faint)]">
            作者自述，未经平台核实。
          </p>
        </section>
      )}

      {project.limitations && (
        <section className="mt-6">
          <h2 className="eyebrow mb-2">限制与前提</h2>
          <p className="whitespace-pre-wrap text-[14px] leading-[1.8] text-[var(--color-muted)]">
            {project.limitations}
          </p>
        </section>
      )}

      {(project.demo_url || project.docs_url || project.repo_url) && (
        <section className="mt-8">
          <h2 className="eyebrow mb-3">外部链接</h2>
          <div className="flex flex-wrap gap-2">
            {project.demo_url && (
              <ExternalLink href={project.demo_url} label="在线 Demo" />
            )}
            {project.docs_url && (
              <ExternalLink href={project.docs_url} label="文档" />
            )}
            {project.repo_url && (
              <ExternalLink href={project.repo_url} label="代码仓库" />
            )}
          </div>
          <p className="mt-3 text-[12px] text-[var(--color-faint)]">
            以上为外部链接，内容与可用性由作者与目标站点负责。
          </p>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mt-8">
          <h2 className="eyebrow mb-3">用到的</h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {more.length > 0 && (
        <section className="mt-12 border-t border-[var(--color-line-soft)] pt-8">
          <h2 className="eyebrow mb-3">{project.display_name} 的其他作品</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {more.map((m) => (
              <Link key={m.id} to={`/projects/${m.slug}`} className="group">
                <div className="overflow-hidden rounded-[16px] border border-[var(--color-line)] transition group-hover:border-[#d9dde5]">
                  <CoverArt seed={m.slug} src={m.cover_url} aspect="4 / 3"  />
                </div>
                <p className="mt-2 truncate text-[13.5px] font-medium group-hover:text-[var(--color-teal)]">
                  {m.title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="mt-10 text-[12px] text-[var(--color-faint)]">
        发布于 {absoluteDate(project.created_at)} · 更新于{" "}
        {absoluteDate(project.updated_at)}
      </p>
    </article>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="btn btn-ghost btn-sm"
    >
      {label}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M8 16L16 8M16 8H9M16 8v7" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </a>
  );
}
