import type { Route } from "./+types/new-post";
import { Form, Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { many } from "~/lib/db.server";
import { insertPost, projectsForComposer } from "~/lib/queries.server";
import { extractTags } from "~/lib/tags";
import { PageHead } from "~/components/page-head";

const KINDS = [
  { v: "show", t: "Show Work", d: "展示一个作品或阶段成果" },
  { v: "build", t: "Build in Public", d: "分享正在构建的过程" },
  { v: "thought", t: "Thoughts", d: "一个专业判断或观察" },
  { v: "discussion", t: "Discussion", d: "抛一个问题出来" },
];

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await requireMe(context, request);
  const projects = await many<{ id: string; title: string }>(
    context,
    `SELECT id, title FROM projects
      WHERE owner_id = ?1 AND visibility = 'public'
      ORDER BY created_at DESC LIMIT 20`,
    me.id,
  );
  return { me, projects };
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const kind = String(form.get("kind") ?? "build");
  const body = String(form.get("body") ?? "").trim();
  const projectId = String(form.get("project_id") ?? "");

  if (!body || body.length > 4000) {
    return Response.json({ error: "内容不能为空，且不超过 4000 字" }, { status: 400 });
  }

  // only your own, non-private work can be attached
  let attachable: string | null = null;
  if (projectId) {
    const owned = await projectsForComposer(context, me.id, 50);
    attachable = owned.some((x) => x.id === projectId) ? projectId : null;
  }

  const id = await insertPost(context, {
    authorId: me.id,
    kind: KINDS.some((k) => k.v === kind) ? kind : "build",
    body,
    projectId: attachable,
    tags: extractTags(body),
  });

  throw redirect(`/posts/${id}`);
}

export default function NewPost({ loaderData }: Route.ComponentProps) {
  const { me, projects } = loaderData;

  return (
    <div className="max-w-[760px]">
      <PageHead
        label="Create"
        title="发一条动态"
        description={`以 @${me.handle} 的身份发布。发布后所有人可见。`}
        actions={
          <Link to="/" className="btn btn-ghost btn-sm">
            取消
          </Link>
        }
      />

      <Form method="post" className="mt-7 space-y-5">
        <fieldset>
          <legend className="mb-2.5 text-[12.5px] font-medium">类型</legend>
          <div className="grid grid-cols-2 gap-2">
            {KINDS.map((k, i) => (
              <label
                key={k.v}
                className="cursor-pointer rounded-[var(--radius-field)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3 transition has-[:checked]:border-[var(--color-ink-soft)] has-[:checked]:bg-[var(--color-accent-soft)]"
              >
                <input
                  type="radio"
                  name="kind"
                  value={k.v}
                  defaultChecked={i === 0}
                  className="sr-only"
                />
                <span className="block font-mono text-[10.5px] tracking-[0.1em] text-[var(--color-muted)] uppercase">
                  {k.t}
                </span>
                <span className="mt-0.5 block text-[12.5px] text-[var(--color-ink-soft)]">
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
            placeholder="做了什么、为什么、遇到了什么。具体一点更有用。"
            className="field field-area !min-h-[200px] text-[15px]"
          />
        </label>

        {projects.length > 0 && (
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">
              关联作品 <span className="font-normal text-[var(--color-faint)]">（可选）</span>
            </span>
            <select name="project_id" className="field cursor-pointer">
              <option value="">不关联</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Link to="/" className="btn btn-ghost">
            取消
          </Link>
          <button className="btn btn-primary">发布</button>
        </div>
      </Form>
    </div>
  );
}
