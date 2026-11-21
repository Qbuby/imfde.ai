import type { Route } from "./+types/feed";
import { Link, useFetcher, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Avatar } from "~/components/media";
import { AnimatedBackground } from "~/components/motion/animated-background";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Flame, History } from "lucide-react";
import { getMe, requireMe } from "~/lib/session.server";
import type { Me } from "~/lib/session.server";
import {
  feedPosts,
  featuredPeople,
  hotTags,
  insertPost,
  latestProjects,
  projectsForComposer,
  recommendedPeople,
} from "~/lib/queries.server";
import { FollowButton } from "~/components/cards";
import { CoverArt } from "~/components/media";
import { PageHead } from "~/components/page-head";
import { FeedCard } from "~/components/cards";
import { extractTags } from "~/lib/tags";

const KINDS = [
  { v: "all", t: "全部" },
  { v: "show", t: "Show Work" },
  { v: "build", t: "Build in Public" },
  { v: "thought", t: "Thoughts" },
  { v: "discussion", t: "Discussion" },
];

const PAGE_SIZE = 30;

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await getMe(context, request);
  const url = new URL(request.url);

  const rawTab = url.searchParams.get("tab");
  const tab: "all" | "following" | "bookmarks" =
    me && rawTab === "following"
      ? "following"
      : me && rawTab === "bookmarks"
        ? "bookmarks"
        : "all";

  const kindParam = url.searchParams.get("kind") ?? "all";
  const kind = KINDS.some((k) => k.v === kindParam) ? kindParam : "all";
  const tag = url.searchParams.get("tag")?.trim() || "";
  const sort = url.searchParams.get("sort") === "active" ? "active" : "latest";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);

  const [feed, tags, myProjects, sidePeople, sideProjects] = await Promise.all([
    feedPosts(context, {
      viewerId: me?.id ?? null,
      scope: tab,
      kind,
      tag,
      sort,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    hotTags(context, 8),
    me ? projectsForComposer(context, me.id) : Promise.resolve([]),
    me ? recommendedPeople(context, me.id, 3) : featuredPeople(context, null, 3),
    latestProjects(context, me?.id ?? null, 2),
  ]);

  return {
    me,
    tab,
    kind,
    tag,
    sort,
    page,
    posts: feed.rows,
    hasMore: feed.hasMore,
    hotTags: tags,
    myProjects,
    sidePeople,
    sideProjects,
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();

  const kind = String(form.get("kind") ?? "build");
  const body = String(form.get("body") ?? "").trim();
  const projectId = String(form.get("project_id") ?? "");

  if (!body || body.length > 4000) {
    return Response.json({ ok: false, error: "内容不能为空，且不超过 4000 字" }, { status: 400 });
  }

  // only your own, non-private work can be attached
  let attachable: string | null = null;
  if (projectId) {
    const owned = await projectsForComposer(context, me.id, 50);
    attachable = owned.some((p) => p.id === projectId) ? projectId : null;
  }

  const id = await insertPost(context, {
    authorId: me.id,
    kind: ["show", "build", "thought", "discussion"].includes(kind) ? kind : "build",
    body,
    projectId: attachable,
    tags: extractTags(body),
  });

  return Response.json({ ok: true, id });
}

export default function Feed({ loaderData }: Route.ComponentProps) {
  const {
    me,
    tab,
    kind,
    tag,
    sort,
    page,
    posts,
    hasMore,
    hotTags: tags,
    myProjects,
    sidePeople,
    sideProjects,
  } = loaderData;
  const [params] = useSearchParams();
  const viewerId = me?.id ?? null;

  const href = (overrides: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (!("page" in overrides)) next.delete("page");
    const s = next.toString();
    return `/feed${s ? `?${s}` : ""}`;
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <PageHead
          label="Square"
          title="FDE 广场"
          description="正在发生的事、刚跑通的东西、还卡着的问题。按 #话题 归类，任何人都能读。"
        />

        <div className="frost sticky top-0 z-20 -mx-2 mt-5 flex items-center gap-1 border-b border-[var(--color-line-soft)] px-2 py-2">
          <AnimatedBackground
            defaultValue={tab}
            className="rounded-full border border-[var(--hairline)] bg-white shadow-[var(--shadow-card)]"
          >
            {[
              <TabLink key="all" id="all" data-id="all" to={href({ tab: null })} active={tab === "all"}>全站最新</TabLink>,
              ...(me
                ? [
                    <TabLink key="following" id="following" data-id="following" to={href({ tab: "following" })} active={tab === "following"}>关注</TabLink>,
                    <TabLink key="bookmarks" id="bookmarks" data-id="bookmarks" to={href({ tab: "bookmarks" })} active={tab === "bookmarks"}>收藏</TabLink>,
                  ]
                : []),
            ]}
          </AnimatedBackground>
        </div>

        {!me && (
          <div className="relative mt-5 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[16px] border border-[rgba(20,23,31,0.08)] bg-[#f7f7f9] p-4">
            <div>
              <p className="text-[14px] font-semibold text-[#14171f]">加入 FDE 广场</p>
              <p className="mt-1 text-[12.5px] text-[#677084]">发动态、收藏作品、关注同行，无需认证。</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/login?next=%2Ffeed" className="btn btn-ghost btn-sm">登录</Link>
              <Link to="/join" className="btn btn-primary btn-sm">免费建主页</Link>
            </div>
          </div>
        )}

        {me ? <Composer me={me} myProjects={myProjects} /> : null}

        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          {KINDS.map((k) => (
            <Link
              key={k.v}
              to={href({ kind: k.v === "all" ? null : k.v })}
              preventScrollReset
              className={`chip transition ${
                kind === k.v
                  ? "!bg-[var(--color-ink)] !text-white"
                  : "hover:!bg-[var(--color-sunken-deep)]"
              }`}
            >
              {k.t}
            </Link>
          ))}
          {tag && (
            <span className="ml-1 flex items-center gap-2 text-[12.5px] text-[var(--color-ink-soft)]">
              话题：
              <span className="chip chip-teal">#{tag}</span>
              <Link
                to={href({ tag: null })}
                preventScrollReset
                className="text-[var(--color-faint)] hover:text-[var(--color-ink)]"
              >
                清除
              </Link>
            </span>
          )}
          <span className="ml-auto flex items-center gap-1">
            <SortLink to={href({ sort: null })} active={sort === "latest"}>
              <History size={14} strokeWidth={1.65} aria-hidden />
              最新
            </SortLink>
            <SortLink to={href({ sort: "active" })} active={sort === "active"}>
              <Flame size={14} strokeWidth={1.65} aria-hidden />
              近期互动多
            </SortLink>
          </span>
        </div>

        <div className="mt-6 border-t border-[var(--color-line-soft)]">
          {posts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[16px] font-semibold">
                {tab === "bookmarks"
                  ? "还没有收藏的动态"
                  : tab === "following"
                    ? "关注的人还没有更新"
                    : tag
                      ? `还没有 #${tag} 的动态`
                      : "广场还很安静"}
              </p>
              <p className="mt-1.5 text-[13.5px] text-[var(--color-ink-soft)]">
                {tab === "bookmarks"
                  ? "在广场里点书签图标，动态就会收到这里。"
                  : tab === "following"
                    ? "去发现页关注几位正在做事的人，他们的更新会出现在这里。"
                    : "第一条公开动态会出现在这里。"}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                {tab === "bookmarks" || tab === "following" ? (
                  <Link to={href({ tab: null })} className="btn btn-ghost btn-sm">
                    去看全站最新
                  </Link>
                ) : (
                  <Link to="/discover" className="btn btn-ghost btn-sm">
                    去发现 FDE
                  </Link>
                )}
                {me && (
                  <Link to="/feed" className="btn btn-primary btn-sm">
                    发第一条
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line-soft)]">
              {posts.map((post) => (
                <FeedCard key={post.id} post={post} viewerId={viewerId} />
              ))}
            </div>
          )}
        </div>

        {(page > 1 || hasMore) && (
          <nav className="mt-6 flex items-center justify-between gap-3">
            {page > 1 ? (
              <Link to={href({ page: String(page - 1) })} className="btn btn-ghost btn-sm">
                ← 上一页
              </Link>
            ) : (
              <span />
            )}
            <span className="font-mono text-[11.5px] text-[var(--color-faint)] tabular-nums">
              第 {page} 页
            </span>
            {hasMore ? (
              <Link to={href({ page: String(page + 1) })} className="btn btn-ghost btn-sm">
                下一页 →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-6 space-y-5">
          <section className="rounded-[16px] border border-[rgba(20,23,31,0.08)] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.04)]">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#677084]">热门话题</h2>
            <div className="mt-2">
              {tags.length === 0 ? (
                <p className="text-[12.5px] text-[var(--color-faint)]">还没有标签。发帖时写 #话题 就会出现在这里。</p>
              ) : (
                tags.map((t) => (
                  <Link
                    key={t.tag}
                    to={`/feed?tag=${encodeURIComponent(t.tag)}`}
                    className="flex items-center justify-between rounded-[8px] px-2 py-1.5 text-[13.5px] transition hover:bg-[#f6f6f6]"
                  >
                    <span className="font-medium text-[#14171f]">#{t.tag}</span>
                    <span className="font-mono text-[11.5px] text-[#8b93a3] tabular-nums">{t.n}</span>
                  </Link>
                ))
              )}
            </div>
          </section>

          {sidePeople.length > 0 && (
            <section className="rounded-[16px] border border-[rgba(20,23,31,0.08)] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.04)]">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#677084]">正在现场的 FDE</h2>
              <div className="mt-2">
                {sidePeople.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5 py-2">
                    <Avatar name={p.display_name} src={p.avatar_url} size={34} />
                    <div className="min-w-0 flex-1">
                      <Link to={`/@${p.handle}`} className="block truncate text-[13.5px] font-semibold hover:opacity-70">{p.display_name}</Link>
                      <p className="truncate text-[12px] text-[#677084]">{p.headline || `@${p.handle}`}</p>
                    </div>
                    {me?.id !== p.id && (
                      <FollowButton
                        targetId={p.id}
                        following={Boolean(p.following)}
                        signedIn={Boolean(me)}
                        size="sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {sideProjects.length > 0 && (
            <section className="rounded-[16px] border border-[rgba(20,23,31,0.08)] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.04)]">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#677084]">最新公开作品</h2>
              <div className="mt-2">
                {sideProjects.slice(0, 2).map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.slug}`}
                    className="-mx-1.5 flex items-center gap-3 rounded-[10px] p-1.5 transition hover:bg-[#f6f6f6]"
                  >
                    <span className="h-[42px] w-[56px] shrink-0 overflow-hidden rounded-[8px]">
                      <CoverArt seed={p.slug} src={p.cover_url} aspect="4 / 3" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold">{p.title}</span>
                      <span className="block truncate text-[11.5px] text-[#677084]">{p.display_name}</span>
                    </span>
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

/**
 * Composer. Uses a fetcher so the submit does not navigate away, and clears
 * itself once the write lands — the feed below revalidates in place.
 */
function Composer({
  me,
  myProjects,
}: {
  me: Me;
  myProjects: Array<{ id: string; title: string }>;
}) {
  const fetcher = useFetcher();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [length, setLength] = useState(0);
  const [focused, setFocused] = useState(false);
  const [kind, setKind] = useState("build");
  const pending = fetcher.state !== "idle";
  const sent = useRef<string | null>(null);
  const pct = Math.min(100, Math.round((length / 4000) * 100));

  useEffect(() => {
    const data = fetcher.data as { ok?: boolean; id?: string } | undefined;
    if (!data?.ok || !data.id || sent.current === data.id) return;
    sent.current = data.id;
    formRef.current?.reset();
    setLength(0);
    setKind("build");
    setFocused(false);
    toast.success("动态已发布");
  }, [fetcher.data]);

  return (
    <fetcher.Form
      ref={formRef}
      method="post"
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null) && length === 0) {
          setFocused(false);
        }
      }}
      className="surface-panel mt-5 overflow-hidden transition-shadow focus-within:shadow-[var(--shadow-lift)]"
    >
      <div className="flex items-start gap-3 px-4 pt-4">
        <Avatar name={me.display_name} src={me.avatar_url} size={36} />
        <textarea
          ref={textareaRef}
          name="body"
          required
          maxLength={4000}
          rows={2}
          onChange={(e) => setLength(e.currentTarget.value.length)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="分享你现在在做的事。用 #话题 归类，别人才能顺着标签找到你。"
          className="min-h-[52px] w-full resize-y border-0 bg-transparent pt-1 text-[15px] leading-[1.55] outline-none placeholder:text-[var(--color-faint)]"
        />
      </div>
      <motion.div
        animate={{
          height: focused || length > 0 ? "auto" : 0,
          opacity: focused || length > 0 ? 1 : 0,
        }}
        initial={false}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
        className="overflow-hidden"
      >
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-line-soft)] px-4 py-2.5">
          <input type="hidden" name="kind" value={kind} />
          {KINDS.filter((k) => k.v !== "all").map((k) => (
            <motion.button
              type="button"
              key={k.v}
              onClick={() => setKind(k.v)}
              whileTap={{ scale: 0.95 }}
              className={`rounded-full border px-2.5 py-1 text-[11.5px] transition ${
                kind === k.v
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                  : "border-[var(--color-line)] text-[var(--color-ink-soft)]"
              }`}
            >
              {k.t}
            </motion.button>
          ))}
        </div>
      </motion.div>
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-[var(--color-line-soft)] px-4 py-2.5">
        {!(focused || length > 0) && <span className="chip !h-[24px] !text-[10.5px]">{KINDS.find((k) => k.v === kind)?.t}</span>}
        <select
          name="project_id"
          aria-label="关联作品"
          className="field !h-[32px] !w-auto !max-w-[190px] !px-2 !text-[12.5px]"
        >
          <option value="">不关联作品</option>
          {myProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <span className="hidden text-[11.5px] text-[var(--color-faint)] sm:inline">
          #标签自动识别 · ⌘/Ctrl + Enter 发布
        </span>
        {length > 0 && (
          <span className="relative grid h-6 w-6 shrink-0 place-items-center" title={`${length}/4000`}>
            <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90" aria-hidden>
              <circle cx="12" cy="12" r="9" fill="none" stroke="var(--color-line)" strokeWidth="2" />
              <circle
                cx="12" cy="12" r="9" fill="none"
                stroke={pct > 90 ? "var(--color-like)" : "var(--color-ink-soft)"}
                strokeWidth="2" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 56.5} 56.5`}
              />
            </svg>
            <span className="absolute font-mono text-[7px] text-[var(--color-faint)] tabular-nums">{length > 999 ? `${Math.round(length/1000)}k` : length}</span>
          </span>
        )}
        <button
          disabled={pending}
          className="btn btn-primary btn-sm !h-[32px] ml-auto disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "发布中…" : "发布"}
        </button>
      </div>
    </fetcher.Form>
  );
}

function TabLink({
  id: _id,
  to,
  active,
  children,
  ...rest
}: {
  id: string;
  to: string;
  active: boolean;
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  return (
    <Link
      {...rest}
      to={to}
      preventScrollReset
      className={`relative rounded-full px-3.5 py-1.5 text-[13.5px] font-medium transition ${
        active ? "text-[var(--color-ink)]" : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      }`}
    >
      <span className="relative z-10">{children}</span>
    </Link>
  );
}

function SortLink({
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
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] transition ${
        active
          ? "bg-[var(--color-paper)] text-[var(--color-ink)]"
          : "text-[var(--color-faint)] hover:text-[var(--color-ink)]"
      }`}
    >
      {children}
    </Link>
  );
}
