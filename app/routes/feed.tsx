import type { Route } from "./+types/feed";
import { Link, useFetcher, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Avatar } from "~/components/media";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Flame, History } from "lucide-react";
import { utc8DayKey } from "~/lib/format";
import { RailTrio, PromptsRail, TopicsRail } from "~/components/feed-rail";
import { getMe, requireMe } from "~/lib/session.server";
import type { Me } from "~/lib/session.server";
import {
  feedPosts,
  ackQuotaToday,
  activePrompts,
  featuredPeople,
  hotTags,
  insertPost,
  latestProjects,
  projectsForComposer,
  promptBySlug,
  recommendedPeople,
} from "~/lib/queries.server";
import { FollowButton } from "~/components/cards";
import { CoverArt } from "~/components/media";
import { FeedCard } from "~/components/cards";
import { PageHead } from "~/components/page-head";
import { UnderlineTabs } from "~/components/underline-tabs";
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
  const promptSlug = url.searchParams.get("prompt")?.trim() || "";

  const [feed, tags, myProjects, sidePeople, sideProjects, prompts, quota, promptRow] = await Promise.all([
    feedPosts(context, {
      viewerId: me?.id ?? null,
      scope: tab,
      kind,
      tag,
      sort,
      promptSlug,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    hotTags(context, 8),
    me ? projectsForComposer(context, me.id) : Promise.resolve([]),
    me ? recommendedPeople(context, me.id, 3) : featuredPeople(context, null, 3),
    latestProjects(context, me?.id ?? null, 2),
    activePrompts(context, 3),
    me ? ackQuotaToday(context, me.id, utc8DayKey()) : Promise.resolve({ used: 0, limit: 2 as const, remaining: 2 }),
    promptSlug ? promptBySlug(context, promptSlug) : Promise.resolve(null),
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
    prompts,
    quota,
    prompt: promptRow,
    promptSlug,
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();

  const kind = String(form.get("kind") ?? "build");
  const body = String(form.get("body") ?? "").trim();
  const projectId = String(form.get("project_id") ?? "");
  const promptId = String(form.get("prompt_id") ?? "");

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
    promptId: promptId || null,
    tags: extractTags(body),
  });

  return Response.json({ ok: true, id });
}

export default function Feed({ loaderData }: Route.ComponentProps) {
  const {
    me, tab, kind, tag, sort, page, posts, hasMore,
    hotTags: tags, myProjects, sidePeople, sideProjects, prompts, quota, prompt, promptSlug,
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

  const tabs = me
    ? [
        { id: "all", label: "全站", to: href({ tab: null }) },
        { id: "following", label: "关注", to: href({ tab: "following" }) },
        { id: "bookmarks", label: "收藏", to: href({ tab: "bookmarks" }) },
      ]
    : KINDS.map((k) => ({ id: "kind-" + k.v, label: k.t, to: href({ kind: k.v === "all" ? null : k.v }) }));
  const activeTab = me ? tab : "kind-" + kind;

  return (
    <div>
      <PageHead title="广场" />
      <div className="mt-5 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_310px]">
      <div className="min-w-0">
        <UnderlineTabs items={tabs} active={activeTab} sticky />

        {!me && (
          <div className="flex items-center justify-between gap-3 border-b border-[#eff3f4] bg-[#f7f9f9] px-4 py-3">
            <p className="text-[13.5px] text-[#536471]">登录后可发帖、评论和收藏</p>
            <div className="flex shrink-0 items-center gap-2">
              <Link to="/login?next=%2Ffeed" className="text-[13px] font-semibold text-[#0f1419] hover:underline">登录</Link>
              <Link to="/join" className="rounded-full bg-[#0f1419] px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#272c30]">加入</Link>
            </div>
          </div>
        )}

        {prompt && (
          <div className="border-b border-[#eff3f4] bg-[#f7f9f9]/70 px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#0f1419]">同题 · {prompt.title}</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#536471]">{prompt.summary}</p>
                <p className="mt-1 font-sans text-[11.5px] text-[#8b93a3] tabular-nums">{prompt.submissions} 条参与 · {Math.max(1, Math.ceil((prompt.ends_at - Date.now()) / 86400000))} 天剩余</p>
              </div>
              <Link to="/feed" className="shrink-0 text-[12px] font-medium text-[#536471] hover:text-[#0f1419]">退出命题筛选</Link>
            </div>
          </div>
        )}

        {me ? <Composer me={me} myProjects={myProjects} prompts={prompts} defaultPromptSlug={promptSlug} /> : null}

        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#eff3f4] px-4 py-2.5">
          {me && KINDS.map((k) => (
            <Link key={k.v} to={href({ kind: k.v === "all" ? null : k.v })} preventScrollReset
              className={`rounded-full px-3 py-1 text-[12.5px] font-medium transition ${kind === k.v ? "bg-[#0f1419] text-white" : "text-[#536471] hover:bg-[#f7f9f9]"}`}>
              {k.t}
            </Link>
          ))}
          {tag && (
            <span className="ml-1 flex items-center gap-2 text-[12.5px] text-[#536471]">
              #{tag}
              <Link to={href({ tag: null })} preventScrollReset className="text-[#8b93a3] hover:text-[#0f1419]">清除</Link>
            </span>
          )}
          <span className="ml-auto flex items-center gap-1">
            <SortLink to={href({ sort: null })} active={sort === "latest"}><History size={14} strokeWidth={1.65} aria-hidden />最新</SortLink>
            <SortLink to={href({ sort: "active" })} active={sort === "active"}><Flame size={14} strokeWidth={1.65} aria-hidden />近期互动多</SortLink>
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[16px] font-semibold text-[#0f1419]">
              {tab === "bookmarks" ? "还没有收藏的动态" : tab === "following" ? "关注的人还没有更新" : tag ? `还没有 #${tag} 的动态` : "广场还很安静"}
            </p>
            <p className="mt-1.5 text-[13.5px] text-[#536471]">
              {tab === "bookmarks" ? "在广场里点书签图标，动态就会收到这里。" : tab === "following" ? "去发现页关注几位正在做事的人。" : "第一条公开动态会出现在这里。"}
            </p>
            <Link to={tab === "all" ? "/discover" : href({ tab: null })} className="mt-5 inline-block text-[13px] font-medium text-[#0f1419] hover:underline">
              {tab === "all" ? "去发现 FDE →" : "去看全站最新 →"}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#eff3f4]">
            {posts.map((post) => (
              <div key={post.id} className="px-4 py-3.5 transition-colors hover:bg-[#fafafa]">
                <FeedCard post={post} viewerId={viewerId} showReplyPreview />
              </div>
            ))}
          </div>
        )}

        {(page > 1 || hasMore) && (
          <nav className="flex items-center justify-between gap-3 border-t border-[#eff3f4] px-4 py-3">
            {page > 1 ? <Link to={href({ page: String(page - 1) })} className="text-[13px] text-[#536471] hover:text-[#0f1419]">← 上一页</Link> : <span />}
            <span className="font-sans text-[11.5px] text-[#8b93a3] tabular-nums">第 {page} 页</span>
            {hasMore ? <Link to={href({ page: String(page + 1) })} className="text-[13px] text-[#536471] hover:text-[#0f1419]">下一页 →</Link> : <span />}
          </nav>
        )}
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-4 space-y-4">
          {me && (
            <div className="rounded-[16px] bg-[#f7f9f9] p-3">
              <RailTrio handle={me.handle} remaining={quota.remaining} />
            </div>
          )}

          <PromptsRail prompts={prompts} activeSlug={promptSlug} />
          <TopicsRail tags={tags} />

          {sidePeople.length > 0 && (
            <section className="rounded-[16px] bg-[#f7f9f9] p-4">
              <h2 className="text-[14px] font-bold text-[#0f1419]">活跃 FDE</h2>
              <div className="mt-2">
                {sidePeople.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5 py-2">
                    <Avatar name={p.display_name} src={p.avatar_url} size={34} />
                    <div className="min-w-0 flex-1">
                      <Link to={`/@${p.handle}`} className="block truncate text-[13.5px] font-semibold text-[#0f1419] hover:opacity-70">{p.display_name}</Link>
                      <p className="truncate text-[12px] text-[#536471]">{p.headline || `@${p.handle}`}</p>
                    </div>
                    {me?.id !== p.id && (
                      <FollowButton targetId={p.id} following={Boolean(p.following)} signedIn={Boolean(me)} size="sm" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {sideProjects.length > 0 && (
            <section className="rounded-[16px] bg-[#f7f9f9] p-4">
              <h2 className="text-[14px] font-bold text-[#0f1419]">最新作品</h2>
              <div className="mt-2">
                {sideProjects.slice(0, 2).map((p) => (
                  <Link key={p.id} to={`/projects/${p.slug}`} className="-mx-1.5 flex items-center gap-3 rounded-[10px] p-1.5 transition hover:bg-white">
                    <span className="h-[42px] w-[56px] shrink-0 overflow-hidden rounded-[8px]">
                      <CoverArt seed={p.slug} src={p.cover_url} aspect="4 / 3" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-[#0f1419]">{p.title}</span>
                      <span className="block truncate text-[11.5px] text-[#536471]">{p.display_name}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>
      </div>
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
  prompts = [],
  defaultPromptSlug = "",
}: {
  me: Me;
  myProjects: Array<{ id: string; title: string }>;
  prompts?: Array<{ id: string; slug: string; title: string }>;
  defaultPromptSlug?: string;
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
      className="mt-4 border-b border-[#eff3f4] overflow-hidden"
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
          placeholder="写点近况，或加个 #话题…"
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
          {prompts.length > 0 && (
            <select name="prompt_id" defaultValue={prompts.find((x) => x.slug === defaultPromptSlug)?.id ?? ""} aria-label="参与命题"
              className="field !h-[32px] !w-auto !max-w-[220px] !px-2 !text-[12.5px]">
              <option value="">不参与命题</option>
              {prompts.map((x) => <option key={x.id} value={x.id}>同题 · {x.title}</option>)}
            </select>
          )}
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
