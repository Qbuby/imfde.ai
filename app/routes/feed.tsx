import type { Route } from "./+types/feed";
import { Form, Link, redirect, useSearchParams } from "react-router";
import { getMe, requireMe } from "~/lib/session.server";
import {
  feedPosts,
  hotTags,
  insertPost,
  projectsForComposer,
} from "~/lib/queries.server";
import { PageHead } from "~/components/page-head";
import { FeedCard } from "~/components/cards";
import { Avatar } from "~/components/media";
import { extractTags } from "~/lib/tags";

const KINDS = [
  { v: "all", t: "全部" },
  { v: "show", t: "Show Work" },
  { v: "build", t: "Build in Public" },
  { v: "thought", t: "Thoughts" },
  { v: "discussion", t: "Discussion" },
];

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await getMe(context, request);
  const url = new URL(request.url);

  const tab = url.searchParams.get("tab") === "following" && me ? "following" : "all";
  const kindParam = url.searchParams.get("kind") ?? "all";
  const kind = KINDS.some((k) => k.v === kindParam) ? kindParam : "all";
  const tag = url.searchParams.get("tag")?.trim() || "";

  const [posts, tags, myProjects] = await Promise.all([
    feedPosts(context, {
      viewerId: me?.id ?? null,
      scope: tab,
      kind,
      tag,
      limit: 30,
    }),
    hotTags(context, 8),
    me ? projectsForComposer(context, me.id) : Promise.resolve([]),
  ]);

  return { me, tab, kind, tag, posts, hotTags: tags, myProjects };
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();

  const kind = String(form.get("kind") ?? "show");
  const body = String(form.get("body") ?? "").trim();
  const projectId = String(form.get("project_id") ?? "");

  if (!body || body.length > 4000) {
    return Response.json({ ok: false }, { status: 400 });
  }

  // only your own, non-private work can be attached
  let attachable: string | null = null;
  if (projectId) {
    const ok = await projectsForComposer(context, me.id, 50);
    attachable = ok.some((p) => p.id === projectId) ? projectId : null;
  }

  await insertPost(context, {
    authorId: me.id,
    kind: ["show", "build", "thought", "discussion"].includes(kind) ? kind : "show",
    body,
    projectId: attachable,
    tags: extractTags(body),
  });

  throw redirect("/feed");
}

export default function Feed({ loaderData }: Route.ComponentProps) {
  const { me, tab, kind, tag, posts, hotTags: tags, myProjects } = loaderData;
  const [params] = useSearchParams();

  const withParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    // changing a filter always drops the other tab's scope
    const s = next.toString();
    return `/feed${s ? `?${s}` : ""}`;
  };

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_248px]">
      <div className="min-w-0">
        <PageHead
          label="Square"
          title="FDE 广场"
          description="正在发生的事、刚跑通的东西、还卡着的问题。按 #话题 归类，任何人都能读。"
        />

        {/* tabs */}
        <div className="mt-5 flex items-center gap-1">
          <TabLink to="/feed" active={tab === "all"}>
            全站最新
          </TabLink>
          {me && (
            <TabLink to="/feed?tab=following" active={tab === "following"}>
              关注
            </TabLink>
          )}
        </div>

        {/* composer */}
        {me ? (
          <Form
            method="post"
            className="mt-5 rounded-[12px] border border-[var(--color-line)] bg-white"
          >
            <div className="flex items-start gap-3 px-4 pt-3.5">
              <Avatar name={me.display_name} src={me.avatar_url} size={34} />
              <textarea
                name="body"
                required
                maxLength={4000}
                rows={2}
                placeholder="分享你现在在做的事。用 #话题 归类，别人才能顺着标签找到你。"
                className="min-h-[52px] w-full resize-y border-0 bg-transparent pt-1 text-[15px] leading-[1.55] outline-none placeholder:text-[var(--color-faint)]"
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-[var(--color-line-soft)] px-4 py-2.5">
              <select
                name="kind"
                aria-label="动态类型"
                className="field !h-[32px] !w-auto !px-2 !text-[12.5px]"
              >
                {KINDS.filter((k) => k.v !== "all").map((k) => (
                  <option key={k.v} value={k.v}>
                    {k.t}
                  </option>
                ))}
              </select>
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
                #标签会自动识别
              </span>
              <button className="btn btn-primary btn-sm !h-[32px] ml-auto">发布</button>
            </div>
          </Form>
        ) : (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-[12px] border border-[var(--color-line-soft)] bg-[var(--color-paper)] px-4 py-3">
            <p className="text-[13.5px] text-[var(--color-ink-soft)]">
              登录后可以发帖、点赞和转发。
            </p>
            <Link to="/login?next=%2Ffeed" className="btn btn-primary btn-sm">
              登录
            </Link>
          </div>
        )}

        {/* filters */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          {KINDS.map((k) => (
            <Link
              key={k.v}
              to={withParam("kind", k.v === "all" ? "" : k.v)}
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
                to={withParam("tag", "")}
                preventScrollReset
                className="text-[var(--color-faint)] hover:text-[var(--color-ink)]"
              >
                清除
              </Link>
            </span>
          )}
        </div>

        {/* list */}
        <div className="mt-6 border-t border-[var(--color-line-soft)]">
          {posts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[16px] font-semibold">
                {tag ? `还没有 #${tag} 的动态` : "广场还很安静"}
              </p>
              <p className="mt-1.5 text-[13.5px] text-[var(--color-ink-soft)]">
                {tab === "following"
                  ? "去发现页关注几位正在做事的人，他们的更新会出现在这里。"
                  : "第一条公开动态会出现在这里。"}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <Link to="/discover" className="btn btn-ghost btn-sm">
                  去发现 FDE
                </Link>
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
                <FeedCard key={post.id} post={post} signedIn={Boolean(me)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* hot tags rail */}
      <aside className="hidden xl:block">
        <div className="sticky top-6 space-y-6">
          <div>
            <p className="mb-2.5 flex items-center gap-2 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
              热门话题
              <span className="h-px flex-1 bg-[var(--color-line-soft)]" />
            </p>
            {tags.length === 0 ? (
              <p className="text-[12.5px] text-[var(--color-faint)]">
                还没有标签。发帖时写 #话题 就会出现在这里。
              </p>
            ) : (
              <div className="space-y-1">
                {tags.map((t) => (
                  <Link
                    key={t.tag}
                    to={`/feed?tag=${encodeURIComponent(t.tag)}`}
                    className="flex items-baseline gap-2 py-1 text-[14px] transition hover:opacity-70"
                  >
                    <span className="font-medium">#{t.tag}</span>
                    <span className="ml-auto font-mono text-[11px] text-[var(--color-faint)]">
                      {t.n}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {kind !== "all" && (
            <Link
              to="/feed"
              className="text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              清除筛选，看全部 →
            </Link>
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
