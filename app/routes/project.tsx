import type { Route } from "./+types/project";
import { Link, useFetcher } from "react-router";
import { getMe } from "~/lib/session.server";
import { many, one } from "~/lib/db.server";
import { Avatar, CoverArt } from "~/components/media";
import { FollowButton } from "~/components/cards";
import { CopyLinkButton } from "~/components/copy-link";
import { GalleryLightbox } from "~/components/gallery-lightbox";
import { Heart, ArrowUpRight } from "lucide-react";
import { absoluteDate, compact } from "~/lib/format";
import { badgeFor, PROJECT_KIND_STYLE } from "~/lib/badges";

export async function loader({ request, context, params }: Route.LoaderArgs) {
  // `me` first: the like state below is viewer-dependent, so it cannot be
  // fetched in the same Promise.all as the project row.
  const me = await getMe(context, request);
  const project = await one<{
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
      liked: number;
      owner_visibility: string;
      hide_follows: number;
    }>(
      context,
      `SELECT pr.*, u.handle, p.display_name, p.avatar_url, p.headline,
              p.visibility AS owner_visibility, p.hide_follows,
              (SELECT COUNT(*) FROM reactions r
                WHERE r.target_type='project' AND r.target_id = pr.id) AS likes,
              (SELECT COUNT(*) FROM follows f WHERE f.followed_id = pr.owner_id) AS followers,
              (SELECT COUNT(*) FROM reactions r3
                WHERE r3.target_type='project' AND r3.target_id = pr.id
                  AND r3.type='like' AND r3.user_id = ?2) AS liked
         FROM projects pr
         JOIN users u ON u.id = pr.owner_id
         JOIN profiles p ON p.user_id = pr.owner_id
        WHERE pr.slug = ?1
          AND u.status = 'active'`,
    params.slug,
    me?.id ?? "·none·",
  );

  if (!project) throw new Response("Not Found", { status: 404 });
  // item-level privacy, then the owner's profile-level privacy
  if (project.visibility === "private" && project.owner_id !== me?.id) {
    throw new Response("Not Found", { status: 404 });
  }
  if (project.owner_visibility === "private" && project.owner_id !== me?.id) {
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
  if (!data?.project) return [{ title: "作品不存在 — ImFDE" }];
  const p = data.project;
  const desc = p.summary.slice(0, 150);
  return [
    { title: `${p.title} — ${p.display_name} · ImFDE` },
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
    : Boolean(project.liked);
  const likes =
    project.likes + (liked && !project.liked ? 1 : !liked && project.liked ? -1 : 0);

  return (
    <article className="max-w-[1060px]">
      <div className="overflow-hidden rounded-[16px] border border-[var(--hairline)] cover-inner-stroke">
        {project.cover_url ? (
          <GalleryLightbox
            src={project.cover_url}
            title={project.title}
            thumbnail={
              <div className="transition-transform duration-500 ease-out hover:scale-[1.01]">
                <CoverArt seed={project.slug} src={project.cover_url} aspect="16 / 9" />
              </div>
            }
          />
        ) : (
          <CoverArt seed={project.slug} aspect="16 / 9" />
        )}
      </div>

      <header className="mt-7 flex flex-wrap items-center gap-2">
        {(() => { const b = badgeFor(PROJECT_KIND_STYLE, project.kind); return (
        <span className={`inline-flex h-[22px] items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-medium ${b.bg} ${b.text}`}>
          <span className={`h-[5px] w-[5px] rounded-full ${b.dot}`} />{b.label}
        </span>
        ); })()}
        {project.stage && <span className="chip">{project.stage}</span>}
        {project.access_mode && (
          <span className="chip chip-outline">{project.access_mode}</span>
        )}
      </header>

      <h1 className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.03em]">
        {project.title}
      </h1>
      <p className="mt-3 max-w-[680px] text-[15px] leading-[1.7] text-[var(--color-ink-soft)]">
        {project.summary}
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-3 border-y border-[var(--color-line-soft)] py-4">
        <Link to={`/@${project.handle}`} className="flex items-center gap-2.5">
          <Avatar name={project.display_name} src={project.avatar_url} size={38} />
          <div>
            <p className="text-[14px] font-medium">{project.display_name}</p>
            <p className="font-mono text-[11px] tracking-wide text-[var(--color-faint)]">
              @{project.handle}
              {project.hide_follows ? null : ` · ${compact(project.followers)} 关注者`}
            </p>
          </div>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {isOwner ? (
            <Link to={`/projects/${project.slug}/edit`} className="btn btn-ghost btn-sm">
              编辑作品
            </Link>
          ) : (
            <FollowButton
              targetId={project.owner_id}
              following={following}
              signedIn={Boolean(me)}
            />
          )}

          <CopyLinkButton path={`/projects/${project.slug}`} />

          {me ? (
            <fetcher.Form method="post" action="/actions/like">
              <input type="hidden" name="intent" value={liked ? "unlike" : "like"} />
              <input type="hidden" name="target_type" value="project" />
              <input type="hidden" name="target_id" value={project.id} />
              <button
                aria-pressed={liked}
                aria-label={liked ? "取消赞" : "赞"}
                className={`btn btn-ghost btn-sm ${liked ? "!text-[var(--color-watermelon)]" : ""}`}
              >
                <Heart
                  size={15}
                  strokeWidth={1.65}
                  fill={liked ? "currentColor" : "none"}
                  className={liked ? "like-pop" : ""}
                  aria-hidden
                />
                <span className="tabular-nums">{likes > 0 ? compact(likes) : "赞"}</span>
              </button>
            </fetcher.Form>
          ) : (
            <Link
              to="/login?next=%2Fdiscover%2Fprojects"
              className="btn btn-ghost btn-sm"
              aria-label="登录后点赞"
            >
              <Heart size={15} strokeWidth={1.65} aria-hidden />
              <span className="tabular-nums">{likes > 0 ? compact(likes) : "赞"}</span>
            </Link>
          )}
        </div>
      </div>

      {project.description && (
        <section className="mt-8">
          <h2 className="mb-3 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">它是什么</h2>
          <div className="whitespace-pre-wrap text-[15px] leading-[1.85] text-[var(--color-ink-2)]">
            {project.description}
          </div>
        </section>
      )}

      {(project.role || project.limitations) && (
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {project.role && (
            <div className="surface-panel p-5">
              <h2 className="mb-2 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">我负责的部分</h2>
              <p className="whitespace-pre-wrap text-[14px] leading-[1.8] text-[var(--color-ink-2)]">{project.role}</p>
              <p className="mt-3 text-[11.5px] text-[var(--color-faint)]">作者自述，未经平台核实。</p>
            </div>
          )}
          {project.limitations && (
            <div className="surface-panel p-5">
              <h2 className="mb-2 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">限制与前提</h2>
              <p className="whitespace-pre-wrap text-[14px] leading-[1.8] text-[var(--color-ink-2)]">{project.limitations}</p>
              <p className="mt-3 text-[11.5px] text-[var(--color-faint)]">作者自述，未经平台核实。</p>
            </div>
          )}
        </section>
      )}

      {(project.demo_url || project.docs_url || project.repo_url) && (
        <section className="mt-8">
          <h2 className="mb-3 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">外部链接</h2>
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
          <h2 className="mb-3 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">用到的</h2>
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
          <h2 className="mb-3 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">{project.display_name} 的其他作品</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {more.map((m) => (
              <Link key={m.id} to={`/projects/${m.slug}`} className="group">
                <div className="overflow-hidden rounded-[16px] border border-[var(--color-line)] transition group-hover:border-[#d9dde5]">
                  <CoverArt seed={m.slug} src={m.cover_url} aspect="4 / 3"  />
                </div>
                <p className="mt-2 truncate text-[13.5px] font-medium group-hover:text-[var(--color-ink)]">
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
      className="btn btn-ghost btn-sm group"
    >
      {label}
      <ArrowUpRight
        size={13}
        strokeWidth={1.65}
        aria-hidden
        className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
    </a>
  );
}
