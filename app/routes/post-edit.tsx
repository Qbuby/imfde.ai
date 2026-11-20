import type { Route } from "./+types/post-edit";
import { Form, Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { many, one, run } from "~/lib/db.server";
import { PageHead } from "~/components/page-head";

const KINDS = [
  { v: "show", t: "Show Work", d: "展示一个作品或阶段成果" },
  { v: "build", t: "Build in Public", d: "分享正在构建的过程" },
  { v: "thought", t: "Thoughts", d: "一个专业判断或观察" },
  { v: "discussion", t: "Discussion", d: "抛一个问题出来" },
];

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const me = await requireMe(context, request);
  const post = await one<{
    id: string;
    kind: string;
    body: string;
    project_id: string | null;
    created_at: number;
  }>(
    context,
    `SELECT id, kind, body, project_id, created_at
       FROM posts
      WHERE id = ?1 AND author_id = ?2 AND deleted_at IS NULL`,
    params.id,
    me.id,
  );

  // not yours (or already deleted) is indistinguishable from never existed
  if (!post) throw new Response("Not Found", { status: 404 });

  const projects = await many<{ id: string; title: string }>(
    context,
    `SELECT id, title FROM projects
      WHERE owner_id = ?1 AND visibility <> 'private'
      ORDER BY created_at DESC LIMIT 20`,
    me.id,
  );

  return { me, post, projects };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "save");

  const post = await one<{ id: string }>(
    context,
    `SELECT id FROM posts WHERE id = ?1 AND author_id = ?2 AND deleted_at IS NULL`,
    params.id,
    me.id,
  );
  if (!post) throw new Response("Not Found", { status: 404 });

  if (intent === "delete") {
    // soft delete: comments and likes stay, the row just stops being served
    await run(
      context,
      `UPDATE posts SET deleted_at = ?2, updated_at = ?2 WHERE id = ?1`,
      post.id,
      Date.now(),
    );
    throw redirect(`/@${me.handle}`);
  }

  const kind = String(form.get("kind") ?? "show");
  const body = String(form.get("body") ?? "").trim();
  const projectId = String(form.get("project_id") ?? "");

  if (!body || body.length > 4000) {
    return Response.json({ error: "内容不能为空，且不超过 4000 字" }, { status: 400 });
  }

  await run(
    context,
    `UPDATE posts SET kind = ?2, body = ?3, project_id = ?4, updated_at = ?5
      WHERE id = ?1`,
    post.id,
    KINDS.some((k) => k.v === kind) ? kind : "show",
    body,
    projectId || null,
    Date.now(),
  );

  throw redirect(`/posts/${post.id}`);
}

export default function PostEdit({ loaderData }: Route.ComponentProps) {
  const { post, projects } = loaderData;

  return (
    <div className="max-w-[760px]">
      <PageHead
        label="Edit"
        title="编辑动态"
        description="改完立刻生效。已经有人点过的赞和评论都保留。"
        actions={
          <Link to={`/posts/${post.id}`} className="btn btn-ghost btn-sm">
            看这条
          </Link>
        }
      />

      <Form method="post" className="mt-8 space-y-5">
        <fieldset>
          <legend className="mb-2.5 text-[12.5px] font-medium">类型</legend>
          <div className="grid grid-cols-2 gap-2">
            {KINDS.map((k) => (
              <label
                key={k.v}
                className="cursor-pointer rounded-[10px] border border-[var(--color-line)] p-3 transition has-[:checked]:border-[var(--color-ink-soft)] has-[:checked]:bg-[var(--color-paper)]"
              >
                <input
                  type="radio"
                  name="kind"
                  value={k.v}
                  defaultChecked={post.kind === k.v}
                  className="sr-only"
                />
                <span className="block font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
                  {k.t}
                </span>
                <span className="mt-1 block text-[13px] text-[var(--color-ink-soft)]">
                  {k.d}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium">内容</span>
          <textarea
            name="body"
            required
            maxLength={4000}
            rows={8}
            defaultValue={post.body}
            className="field field-area !min-h-[180px]"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium">
            关联作品
            <span className="ml-2 font-normal text-[var(--color-faint)]">可选</span>
          </span>
          <select name="project_id" defaultValue={post.project_id ?? ""} className="field cursor-pointer">
            <option value="">不关联</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-line-soft)] pt-5">
          <span className="text-[12.5px] text-[var(--color-faint)]">
            删除后不会出现在任何列表里。
          </span>
          <div className="flex items-center gap-2">
            <button
              form="delete-form"
              className="btn btn-ghost btn-sm !text-[#c0392b]"
              type="submit"
            >
              删除动态
            </button>
            <Link to={`/posts/${post.id}`} className="btn btn-ghost btn-sm">
              取消
            </Link>
            <button className="btn btn-primary btn-sm">保存</button>
          </div>
        </div>
      </Form>

      <Form
        id="delete-form"
        method="post"
        className="hidden"
        onSubmit={(e) => {
          if (!confirm("确定删除这条动态？删除后不会出现在任何列表里。")) e.preventDefault();
        }}
      >
        <input type="hidden" name="intent" value="delete" />
      </Form>
    </div>
  );
}
