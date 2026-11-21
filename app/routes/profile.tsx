import type { Route } from "./+types/profile";
import { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { getMe, normalizeHandle } from "~/lib/session.server";
import { many, one } from "~/lib/db.server";
import { Avatar, CoverArt } from "~/components/media";
import { FeedCard, FollowButton, ProjectCard } from "~/components/cards";
import { CopyLinkButton } from "~/components/copy-link";
import { BRAND_ICONS } from "~/components/brand-icons";
import { compact } from "~/lib/format";
import { countsForProfile, feedPosts, projectsByOwner } from "~/lib/queries.server";

const PROVIDER_LABEL: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  huggingface: "Hugging Face",
  website: "个人网站",
  x: "X",
  blog: "博客",
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

  const [counts, skills, links, projects, feed, following] = await Promise.all([
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
    projectsByOwner(context, user.id, me?.id ?? null),
    feedPosts(context, { viewerId: me?.id ?? null, authorId: user.id, limit: 12 }),
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
    posts: feed.rows,
    isSelf: me?.id === user.id,
    following: Boolean(following?.n),
  };
}

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data?.user) return [{ title: "找不到这个人 — ImFDE" }];
  const u = data.user;
  const desc =
    u.headline ??
    `${u.display_name} 在 ImFDE 上的主页：作品、动态与外部资料。`;
  return [
    { title: `${u.display_name} (@${u.handle}) — ImFDE` },
    { name: "description", content: desc },
    { property: "og:title", content: `${u.display_name} on ImFDE` },
    { property: "og:description", content: desc },
    { property: "og:type", content: "profile" },
  ];
};

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { me, user, counts, skills, links, projects, posts, isSelf, following } =
    loaderData;
  const [tab, setTab] = useState<"work" | "posts" | "about">("work");
  const featured = projects.filter((p) => p.featured).slice(0, 3);
  const shown = featured.length ? featured : projects;

  const stats = [
    { n: counts.projects, label: "作品" },
    { n: counts.posts, label: "动态" },
    ...(user.hide_follows
      ? []
      : [
          { n: counts.followers, label: "关注者" },
          { n: counts.following, label: "关注" },
        ]),
  ];

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="grid gap-8 lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <div className="lg:sticky lg:top-8 overflow-hidden rounded-[16px] border border-[#eff3f4] bg-white">
            <div className="relative h-[92px] overflow-hidden">
              <CoverArt seed={`${user.handle}-cover`} src={user.cover_url} aspect="4 / 1" photo={false} />
            </div>
            <div className="-mt-11 px-5">
              <Avatar name={user.display_name} src={user.avatar_url} size={88} ring />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.03em]">
                  {user.display_name}
                </h1>
                {user.kind === "team" && (
                  <span className="chip chip-outline !h-[20px] !px-2 !text-[10px]">团队 / Studio</span>
                )}
              </div>
              <p className="micro-mono mt-0.5">@{user.handle}</p>
              {(user.location || user.timezone) && (
                <p className="mt-2 text-[12.5px] text-[var(--color-muted)]">
                  {[user.location, user.timezone].filter(Boolean).join(" · ")}
                </p>
              )}
              {user.headline && (
                <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">{user.headline}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {isSelf ? (
                  <>
                    <Link to="/settings/profile" className="btn btn-ghost btn-sm">编辑主页</Link>
                    <Link to="/new/project" className="btn btn-primary btn-sm">上传作品</Link>
                  </>
                ) : (
                  <FollowButton targetId={user.id} following={following} signedIn={Boolean(me)} />
                )}
                <CopyLinkButton path={`/@${user.handle}`} label="复制主页链接" className="btn btn-ghost btn-sm" />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#eff3f4] pt-3 font-sans text-[11.5px] text-[#536471] tabular-nums">
                {stats.map((x) => <span key={x.label}>{compact(x.n)} {x.label}</span>)}
              </div>

              {links.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {links.map((l) => {
                    const Icon = BRAND_ICONS[l.provider];
                    return (
                      <a key={l.id} href={l.profile_url} target="_blank" rel="noopener noreferrer nofollow"
                        className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-2.5 py-1.5 text-[11.5px] text-[var(--color-ink-soft)] transition hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                        {Icon ? <Icon size={13} /> : <span aria-hidden>↗</span>}
                        {PROVIDER_LABEL[l.provider] ?? l.provider}
                      </a>
                    );
                  })}
                </div>
              )}

              {skills.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">方向</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <Link key={s} to={`/discover?skill=${encodeURIComponent(s)}`} className="chip transition hover:!bg-[var(--color-sunken-deep)]">{s}</Link>
                    ))}
                  </div>
                </div>
              )}

              <details className="group mt-5 border-t border-[#eff3f4] py-3">
                <summary className="cursor-pointer font-sans text-[11px] text-[#536471]">
                  信息从哪里来 · <span className="group-open:hidden">展开</span><span className="hidden group-open:inline">收起</span>
                </summary>
                <dl className="mt-3 grid gap-2 text-[11.5px] leading-relaxed text-[var(--color-muted)]">
                  <div><dt className="font-medium text-[var(--color-ink)]">本人自述</dt><dd>简介、方向、作品说明。平台不核实。</dd></div>
                  <div><dt className="font-medium text-[var(--color-ink)]">外部链接</dt><dd>跳到站外，内容由对方负责。</dd></div>
                  <div><dt className="font-medium text-[var(--color-ink)]">平台行为</dt><dd>发帖、关注、点赞。真实发生过。</dd></div>
                </dl>
              </details>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex items-center gap-6 border-b border-[#eff3f4]">
            {([["work", "作品集"], ["posts", "动态"], ["about", "关于"]] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setTab(id)}
                className={`relative pb-3 pt-1 text-[14px] font-medium transition ${tab === id ? "text-[#0f1419]" : "text-[#536471] hover:text-[#0f1419]"}`}>
                {label}
                {tab === id && <motion.span layoutId="profile-tab-underline" className="absolute inset-x-0 bottom-0 h-[2px] rounded bg-[#0f1419]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              </button>
            ))}
            <span className="ml-auto font-sans text-[11px] text-[#8b93a3] tabular-nums">
              {projects.length} 作品 · {posts.length} 动态
            </span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab}
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
              transition={{ duration: 0.17, ease: [0.22, 1, 0.36, 1] }} className="pt-6">
              {tab === "work" && (
                shown.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-[14px] text-[var(--color-ink-soft)]">还没有公开作品。</p>
                    {isSelf && <Link to="/new/project" className="btn btn-primary btn-sm mt-4">上传第一个</Link>}
                  </div>
                ) : (
                  <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2">
                    {shown.map((p, i) => {
                      const hero = i === 0 && p.featured === 1;
                      return (
                        <div key={p.id} className={`relative ${hero ? "col-span-full" : ""}`}>
                          <ProjectCard project={p} viewerId={me?.id ?? null} hero={hero} />
                        </div>
                      );
                    })}
                  </div>
                )
              )}
              {tab === "posts" && (
                posts.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-[14px] text-[var(--color-ink-soft)]">还没有公开动态。</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#eff3f4]">
                    {posts.slice(0, 12).map((p) => <FeedCard key={p.id} post={p} viewerId={me?.id ?? null} showFollow={false} />)}
                  </div>
                )
              )}
              {tab === "about" && (
                <div className="border-t border-[#eff3f4] pt-6">
                  {user.about ? (
                    <p className="whitespace-pre-wrap text-[14.5px] leading-[1.9] text-[var(--color-ink-2)]">{user.about}</p>
                  ) : (
                    <p className="text-[14px] text-[var(--color-faint)]">{isSelf ? "还没有填写简介。" : "这位 FDE 还没有写简介。"}</p>
                  )}
                  <p className="mt-4 text-[11.5px] text-[var(--color-faint)]">由本人填写，平台不核实。</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
