import type { Route } from "./+types/profile";
import { Link, useSearchParams } from "react-router";
import * as HoverCard from "@radix-ui/react-hover-card";
import { motion, AnimatePresence } from "motion/react";
import { MapPin } from "lucide-react";
import { getMe, normalizeHandle } from "~/lib/session.server";
import { many, one } from "~/lib/db.server";
import { Avatar, CoverArt } from "~/components/media";
import { FeedCard, FollowButton, ProjectCard } from "~/components/cards";
import { CopyLinkButton } from "~/components/copy-link";
import { BRAND_ICONS } from "~/components/brand-icons";
import { compact } from "~/lib/format";
import { badgeFor, PROJECT_KIND_STYLE } from "~/lib/badges";
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
  const { me, user, counts, skills, links, projects, posts, isSelf, following } = loaderData;
  const [params, setParams] = useSearchParams();
  const rawTab = params.get("tab");
  const tab: "work" | "posts" | "about" =
    rawTab === "posts" || rawTab === "about" ? rawTab : "work";
  const setTab = (next: "work" | "posts" | "about") => {
    const q = new URLSearchParams(params);
    if (next === "work") q.delete("tab"); else q.set("tab", next);
    setParams(q, { preventScrollReset: true });
  };

  const heroWork = projects[0];
  const topSkills = skills.slice(0, 2);
  const primaryLink = links[0];
  const restCount = Math.max(skills.length - 2, 0) + Math.max(links.length - 1, 0) + 1; // +1 for the source capsule itself

  const rawStats = [
    `${counts.projects} 作品`,
    `${counts.posts} 动态`,
    `${counts.acks_received} 次获 ACK`,
    ...(user.hide_follows ? [] : [`${compact(counts.followers)} 关注者`]),
  ];

  const domainOf = (url: string) => {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      {/* ── 50/50 first screen ───────────────────────────────────────── */}
      <section className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)]">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <Avatar name={user.display_name} src={user.avatar_url} size={64} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#0f1419] sm:text-[42px]">
                  {user.display_name}
                </h1>
                {user.kind === "team" && <span className="rounded-[6px] bg-[#f7f9f9] px-2 py-0.5 text-[11.5px] font-medium text-[#536471]">团队</span>}
              </div>
              <p className="mt-1 text-[13.5px] text-[#8b93a3]">@{user.handle}</p>
            </div>
            {isSelf && (
              <div className="ml-auto flex shrink-0 gap-2">
                <Link to="/settings/profile" className="btn btn-ghost btn-sm">编辑主页</Link>
                <Link to="/new/project" className="btn btn-primary btn-sm">上传作品</Link>
              </div>
            )}
          </div>

          {user.headline && (
            <p className="mt-4 max-w-[480px] text-[15.5px] leading-[1.55] text-[#536471]">{user.headline}</p>
          )}

          {/* signature mono capsule row + +N provenance hovercard */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {topSkills.map((sk) => (
              <Link key={sk} to={`/discover?skill=${encodeURIComponent(sk)}`} className="rounded-full border border-[#e2e5ea] bg-white px-3 py-1 text-[12.5px] font-medium text-[#0f1419] transition hover:border-[#0f1419]">
                {sk}
              </Link>
            ))}
            {primaryLink && (() => {
              const Icon = BRAND_ICONS[primaryLink.provider];
              return (
                <a href={primaryLink.profile_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e5ea] bg-white px-3 py-1 text-[12.5px] font-medium text-[#0f1419] transition hover:border-[#0f1419]">
                  {Icon ? <Icon size={13} /> : <span aria-hidden>↗</span>}
                  {PROVIDER_LABEL[primaryLink.provider] ?? primaryLink.provider}
                </a>
              );
            })()}
            <HoverCard.Root openDelay={120} closeDelay={120}>
              <HoverCard.Trigger asChild>
                <button type="button" className="rounded-full border border-[#e2e5ea] bg-white px-3 py-1 text-[12.5px] font-medium text-[#0f1419] transition hover:border-[#0f1419]">
                  +{restCount} 信息来源
                </button>
              </HoverCard.Trigger>
              <HoverCard.Portal>
                <HoverCard.Content side="bottom" align="start" sideOffset={8} className="pop-in z-50 w-[320px] rounded-[16px] border border-[#e2e5ea] bg-white p-4 shadow-[0_14px_36px_rgba(15,20,25,0.10)]">
                  <div>
                    <p className="text-[11.5px] font-semibold text-[#0f1419]">本人自述方向</p>
                    <p className="mt-0.5 text-[11px] text-[#8b93a3]">自述，平台不核实</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {skills.length ? skills.map((sk) => (
                        <span key={sk} className="rounded-full bg-[#f7f9f9] px-2.5 py-0.5 text-[11.5px] text-[#536471]">{sk}</span>
                      )) : <span className="text-[12px] text-[#8b93a3]">未填写</span>}
                    </div>
                  </div>
                  <div className="mt-3 border-t border-[#eff3f4] pt-3">
                    <p className="text-[11.5px] font-semibold text-[#0f1419]">外部链接</p>
                    <p className="mt-0.5 text-[11px] text-[#8b93a3]">站外链接，未核实</p>
                    <div className="mt-2 space-y-1.5">
                      {links.length ? links.map((l) => {
                        const Icon = BRAND_ICONS[l.provider];
                        return (
                          <a key={l.id} href={l.profile_url} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-2 text-[12px] text-[#536471] hover:text-[#0f1419]">
                            {Icon ? <Icon size={13} /> : <span aria-hidden>↗</span>}
                            <span className="truncate">{PROVIDER_LABEL[l.provider] ?? l.provider} · {domainOf(l.profile_url)}</span>
                          </a>
                        );
                      }) : <span className="text-[12px] text-[#8b93a3]">未添加</span>}
                    </div>
                  </div>
                  <div className="mt-3 border-t border-[#eff3f4] pt-3">
                    <p className="text-[11.5px] font-semibold text-[#0f1419]">平台可观察行为</p>
                    <p className="mt-1 font-sans text-[12px] text-[#536471] tabular-nums">{rawStats.join(" · ")}</p>
                    <p className="mt-2 text-[11px] text-[#8b93a3]">仅展示原始事实，不合成信用分。</p>
                  </div>
                  <HoverCard.Arrow className="fill-white" />
                </HoverCard.Content>
              </HoverCard.Portal>
            </HoverCard.Root>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {!isSelf && <FollowButton targetId={user.id} following={following} signedIn={Boolean(me)} />}
            <CopyLinkButton path={`/@${user.handle}`} label="复制主页链接" className="btn btn-ghost btn-sm" />
            <span className="font-sans text-[13px] text-[#536471] tabular-nums">{rawStats.join(" · ")}</span>
          </div>
        </div>

        {/* number-one work stage */}
        <div className="min-w-0">
          {heroWork ? (
            <Link to={`/projects/${heroWork.slug}`} className="group relative block h-full min-h-[280px] overflow-hidden rounded-[20px] border border-[#e2e5ea] bg-[#f7f9f9]">
              <CoverArt seed={heroWork.slug} src={heroWork.cover_url} aspect="16 / 10" className="h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]" />
              {(() => { const b = badgeFor(PROJECT_KIND_STYLE, heroWork.kind); return (
              <span className="absolute left-4 top-4 z-10 inline-flex h-[22px] items-center gap-1.5 rounded-full bg-white/88 px-2.5 text-[11.5px] font-medium backdrop-blur-md text-[#0f1419]">
                <span className={`h-[5px] w-[5px] rounded-full ${b.dot}`} />{heroWork.featured ? "精选代表作" : b.label}
              </span>
              ); })()}
              <span className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-5 pb-5 pt-16">
                <span className="block text-[20px] font-semibold leading-snug text-white">{heroWork.title}</span>
                <span className="mt-1 block line-clamp-2 text-[13px] leading-relaxed text-white/75">{heroWork.summary}</span>
                <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-[12px] font-medium text-white opacity-0 backdrop-blur-md transition group-hover:opacity-100">查看作品 ↗</span>
              </span>
            </Link>
          ) : isSelf ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-[20px] border border-dashed border-[#e2e5ea] bg-[#f7f9f9] px-6 text-center">
              <p className="text-[15px] font-semibold text-[#0f1419]">放上你的第一个代表作</p>
              <p className="mt-1 text-[13px] text-[#536471]">一个标题、一句话就能开始。</p>
              <Link to="/new/project" className="btn btn-primary btn-sm mt-4">上传作品</Link>
            </div>
          ) : (
            <div className="flex h-full min-h-[280px] flex-col justify-between rounded-[20px] border border-[#eff3f4] bg-[#f7f9f9] p-8">
              <p className="text-[22px] font-semibold leading-snug tracking-[-0.02em] text-[#0f1419]">还在准备代表作。</p>
              <p className="mt-3 max-w-[360px] text-[14px] leading-relaxed text-[#536471]">
                {user.about || `${user.display_name} 加入 ImFDE 不久，已经有 ${counts.posts} 条公开动态。`}
              </p>
              <p className="font-sans text-[12px] text-[#8b93a3] tabular-nums">{counts.posts} 条平台动态 · 可观察事实</p>
            </div>
          )}
        </div>
      </section>

      {/* ── full-width tab bar + region & links ──────────────────────── */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#eff3f4]">
        <div className="flex items-center gap-6">
          {([["work", "作品集"], ["posts", "动态"], ["about", "关于"]] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={`relative pb-3 pt-1 text-[14px] font-medium transition ${tab === id ? "text-[#0f1419]" : "text-[#536471] hover:text-[#0f1419]"}`}>
              {label}
              {tab === id && <motion.span layoutId="profile-tab-underline" className="absolute inset-x-0 bottom-0 h-[2px] rounded bg-[#0f1419]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-2">
          {(user.location || user.timezone) && (
            <span className="inline-flex items-center gap-1 text-[12.5px] text-[#536471]">
              <MapPin size={13} strokeWidth={1.65} aria-hidden />
              {[user.location, user.timezone].filter(Boolean).join(" · ")}
            </span>
          )}
          {links.map((l) => {
            const Icon = BRAND_ICONS[l.provider];
            return (
              <a key={l.id} href={l.profile_url} target="_blank" rel="noopener noreferrer nofollow" aria-label={PROVIDER_LABEL[l.provider] ?? l.provider} title={domainOf(l.profile_url)}
                className="grid h-8 w-8 place-items-center rounded-[8px] border border-[#eff3f4] text-[#536471] transition hover:border-[#0f1419] hover:text-[#0f1419]">
                {Icon ? <Icon size={14} /> : <span aria-hidden>↗</span>}
              </a>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab}
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
          transition={{ duration: 0.17, ease: [0.22, 1, 0.36, 1] }} className="pt-6">
          {tab === "work" && (
            projects.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[14px] text-[#536471]">还没有公开作品。</p>
                {isSelf && <Link to="/new/project" className="btn btn-primary btn-sm mt-4">上传第一个</Link>}
              </div>
            ) : (
              <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p) => <ProjectCard key={p.id} project={p} viewerId={me?.id ?? null} />)}
              </div>
            )
          )}
          {tab === "posts" && (
            posts.length === 0 ? (
              <div className="py-16 text-center"><p className="text-[14px] text-[#536471]">还没有公开动态。</p></div>
            ) : (
              <div className="mx-auto max-w-[680px] divide-y divide-[#eff3f4]">
                {posts.slice(0, 12).map((p) => <FeedCard key={p.id} post={p} viewerId={me?.id ?? null} showFollow={false} />)}
              </div>
            )
          )}
          {tab === "about" && (
            <div className="mx-auto max-w-[680px]">
              {user.about ? (
                <p className="whitespace-pre-wrap text-[14.5px] leading-[1.9] text-[#0f1419]">{user.about}</p>
              ) : (
                <p className="text-[14px] text-[#8b93a3]">{isSelf ? "还没有填写简介。" : "这位 FDE 还没有写简介。"}</p>
              )}
              <p className="mt-4 text-[11.5px] text-[#8b93a3]">以上由本人填写，平台不核实。</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
