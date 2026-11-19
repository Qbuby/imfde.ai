import type { Route } from "./+types/profile";
import { Link } from "react-router";
import { getMe, normalizeHandle } from "~/lib/session.server";
import { many, one } from "~/lib/db.server";
import { Avatar, CoverArt } from "~/components/media";
import { FollowButton, PostCard, ProjectCard } from "~/components/cards";
import { compact } from "~/lib/format";
import { countsForProfile, postsByAuthor, projectsByOwner } from "~/lib/queries.server";

const PROVIDER_LABEL: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  huggingface: "Hugging Face",
  website: "个人网站",
  x: "X",
  blog: "博客",
};

const PROVIDER_ICON: Record<string, string> = {
  github: "GH",
  linkedin: "in",
  huggingface: "HF",
  website: "↗",
  x: "X",
  blog: "✎",
};

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const handle = normalizeHandle(params.handle);
  if (!handle) throw new Response("Not Found", { status: 404 });

  const [me, user] = await Promise.all([
    getMe(context, request),
    one<{
      id: string;
      handle: string;
      kind: "individual" | "team";
      display_name: string;
      avatar_url: string | null;
      cover_url: string | null;
      headline: string | null;
      about: string | null;
      location: string | null;
      timezone: string | null;
      visibility: "public" | "private";
      hide_follows: number;
      created_at: number;
    }>(
      context,
      `SELECT u.id, u.handle, u.kind, u.created_at,
              p.display_name, p.avatar_url, p.cover_url, p.headline, p.about,
              p.location, p.timezone, p.visibility, p.hide_follows
         FROM users u JOIN profiles p ON p.user_id = u.id
        WHERE u.handle = ?1 AND u.status = 'active'`,
      handle,
    ),
  ]);

  if (!user) throw new Response("Not Found", { status: 404 });
  if (user.visibility === "private" && user.id !== me?.id) {
    throw new Response("Not Found", { status: 404 });
  }

  const [counts, skills, links, projects, posts, following] = await Promise.all([
    countsForProfile(context, user.id),
    many<{ skill_name: string }>(
      context,
      `SELECT skill_name FROM profile_skills WHERE user_id = ?1 ORDER BY position`,
      user.id,
    ),
    many<{
      id: string;
      provider: string;
      profile_url: string;
      connection: string;
    }>(
      context,
      `SELECT id, provider, profile_url, connection FROM external_accounts
        WHERE user_id = ?1 ORDER BY position`,
      user.id,
    ),
    projectsByOwner(context, user.id),
    postsByAuthor(context, user.id, me?.id ?? null, 12),
    me
      ? one<{ n: number }>(
          context,
          `SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?1 AND followed_id = ?2`,
          me.id,
          user.id,
        )
      : Promise.resolve(null),
  ]);

  return {
    me,
    user,
    counts,
    skills: skills.map((s) => s.skill_name),
    links,
    projects,
    posts,
    isSelf: me?.id === user.id,
    following: Boolean(following?.n),
  };
}

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data?.user) return [{ title: "找不到这个人 — iMFDE" }];
  const u = data.user;
  const desc =
    u.headline ??
    `${u.display_name} 在 iMFDE 上的主页：作品、动态与外部资料。`;
  return [
    { title: `${u.display_name} (@${u.handle}) — iMFDE` },
    { name: "description", content: desc },
    { property: "og:title", content: `${u.display_name} on iMFDE` },
    { property: "og:description", content: desc },
    { property: "og:type", content: "profile" },
  ];
};

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { user, counts, skills, links, projects, posts, isSelf, following } =
    loaderData;
  const featured = projects.filter((p) => p.featured).slice(0, 3);
  const shown = (featured.length ? featured : projects).slice(0, 6);

  return (
    <div className="mx-auto max-w-[900px]">
      {/* cover */}
      <div className="overflow-hidden rounded-[24px] border border-[var(--color-line)]">
        <CoverArt
          seed={`${user.handle}-cover`}
          src={user.cover_url}
          aspect="3 / 1"
        />
      </div>

      <div className="px-2 sm:px-6">
        <div className="-mt-14 flex items-start gap-4">
          <Avatar
            name={user.display_name}
            src={user.avatar_url}
            size={96}
            ring
          />
          <div className="flex-1 pt-[62px]">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="display text-[clamp(24px,2.8vw,32px)]">
                {user.display_name}
              </h1>
              {user.kind === "team" && (
                <span className="chip chip-outline">团队 / Studio</span>
              )}
            </div>
            <p className="mt-0.5 font-mono text-[12px] tracking-wide text-[var(--color-faint)]">
              @{user.handle}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {isSelf ? (
            <>
              <Link to="/settings/profile" className="btn btn-ghost btn-sm">
                编辑主页
              </Link>
              <Link to="/new/project" className="btn btn-primary btn-sm">
                上传作品
              </Link>
            </>
          ) : (
            <FollowButton targetId={user.id} following={following} />
          )}
          {(user.location || user.timezone) && (
            <span className="text-[12.5px] text-[var(--color-muted)]">
              {[user.location, user.timezone].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>

        {user.headline && (
          <p className="mt-4 max-w-[660px] text-[16px] leading-[1.7] text-[var(--color-ink-2)]">
            {user.headline}
          </p>
        )}



        {/* counts — raw numbers, no synthesis */}
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-[var(--color-line-soft)] py-4">
          <Stat n={counts.projects} label="作品" />
          <Stat n={counts.posts} label="动态" />
          {user.hide_follows ? null : (
            <>
              <Stat n={counts.followers} label="关注者" />
              <Stat n={counts.following} label="关注" />
            </>
          )}
          <span className="ml-auto text-[11.5px] text-[var(--color-faint)]">
            以上均为原始计数，不合成任何评分
          </span>
        </div>

        {/* external accounts — explicitly labelled by source type */}
        {links.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {links.map((l) => (
              <a
                key={l.id}
                href={l.profile_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-[12.5px] transition hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              >
                <span className="font-mono text-[10.5px] font-semibold text-[var(--color-muted)]">
                  {PROVIDER_ICON[l.provider] ?? "↗"}
                </span>
                {PROVIDER_LABEL[l.provider] ?? l.provider}
                <span className="font-mono text-[9.5px] tracking-[0.08em] text-[var(--color-faint)] uppercase">
                  {l.connection === "connected" ? "已连接" : "链接"}
                </span>
              </a>
            ))}
          </div>
        )}

        {user.about && (
          <section className="mt-8">
            <h2 className="eyebrow mb-2">关于</h2>
            <div className="max-w-[660px] whitespace-pre-wrap text-[14.5px] leading-[1.85] text-[var(--color-ink-2)]">
              {user.about}
            </div>
            <p className="mt-2 text-[11.5px] text-[var(--color-faint)]">
              由本人填写。
            </p>
          </section>
        )}

        {skills.length > 0 && (
          <section className="mt-7">
            <h2 className="eyebrow mb-2.5">方向</h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <Link
                  key={s}
                  to={`/discover?skill=${encodeURIComponent(s)}`}
                  className="chip transition hover:!bg-[var(--color-sunken-deep)]"
                >
                  {s}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* projects */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="section-title">作品</h2>
          {projects.length > 6 && (
            <Link
              to={`/@${user.handle}/projects`}
              className="text-[12.5px] text-[var(--color-ink-soft)] hover:underline"
            >
              全部 {projects.length} 个 →
            </Link>
          )}
        </div>
        {shown.length === 0 ? (
          <div className="card px-6 py-12 text-center">
            <p className="text-[13.5px] text-[var(--color-muted)]">
              这个人还没有公开作品。
            </p>
            {isSelf && (
              <Link to="/new/project" className="btn btn-primary btn-sm mt-4">
                上传第一个
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      {/* posts */}
      {posts.length > 0 && (
        <section className="mt-12">
          <h2 className="section-title mb-4">动态</h2>
          <div className="space-y-3">
            {posts.slice(0, 6).map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* source legend — the product's trust model, stated plainly */}
      <section className="mt-12 rounded-[var(--radius-panel)] bg-[var(--color-sunken)] p-5">
        <h2 className="eyebrow mb-2.5">这个页面上的信息从哪里来</h2>
        <dl className="grid gap-2 text-[12.5px] leading-relaxed text-[var(--color-muted)] sm:grid-cols-2">
          <div>
            <dt className="font-medium text-[var(--color-ink)]">本人自述</dt>
            <dd>简介、方向、作品说明。平台不核实。</dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-ink)]">外部链接</dt>
            <dd>GitHub、LinkedIn 等，跳到站外，内容由对方负责。</dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-ink)]">平台行为</dt>
            <dd>发帖、关注、点赞。这些在这里真实发生过。</dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-ink)]">没有的东西</dt>
            <dd>没有信用分，没有等级，没有成交与收入记录。</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="font-mono text-[17px] font-medium text-[var(--color-ink)]">
        {compact(n)}
      </span>
      <span className="text-[12px] text-[var(--color-muted)]">{label}</span>
    </span>
  );
}
