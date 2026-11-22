import type { Route } from "./+types/project-edit";
import { data, Form, Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { batch, one, run, stmt } from "~/lib/db.server";
import { cleanUrl, clamp } from "~/lib/validate";
import { PageHead } from "~/components/page-head";
import { CoverArt } from "~/components/media";
import { useState } from "react";
import { ConfirmDialog } from "~/components/confirm-dialog";

const ACCESS_MODES = [
  { v: "", t: "不标注" },
  { v: "在线体验", t: "在线体验" },
  { v: "开源代码", t: "开源代码" },
  { v: "私有部署", t: "私有部署" },
  { v: "仅 Demo 展示", t: "仅 Demo 展示" },
];

const KINDS = [
  { v: "project", t: "项目" },
  { v: "agent", t: "Agent" },
  { v: "tool", t: "工具" },
  { v: "automation", t: "自动化" },
  { v: "case", t: "案例" },
  { v: "oss", t: "开源" },
];

const VISIBILITY = [
  { v: "public", t: "公开", d: "出现在发现页和首页" },
  { v: "unlisted", t: "不列入", d: "不进列表，但拿到链接的人能看到" },
  { v: "private", t: "仅自己", d: "只有你自己能看到" },
];

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const me = await requireMe(context, request);
  const project = await one<{
    id: string;
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
    limitations: string | null;
    visibility: string;
    access_mode: string | null;
    featured: number;
  }>(
    context,
    `SELECT id, slug, kind, title, summary, description, cover_url, demo_url,
            docs_url, repo_url, role, stage, limitations, visibility,
            access_mode, featured
       FROM projects WHERE slug = ?1 AND owner_id = ?2`,
    params.slug,
    me.id,
  );

  // not yours (or not real) looks identical to never existed
  if (!project) throw new Response("Not Found", { status: 404 });

  const skills = await one<{ names: string }>(
    context,
    `SELECT group_concat(skill_name, ', ') AS names
       FROM (SELECT skill_name FROM project_skills
              WHERE project_id = ?1 ORDER BY position)`,
    project.id,
  );

  return { me, project, skillsText: skills?.names ?? "" };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "save");

  const project = await one<{ id: string; slug: string }>(
    context,
    `SELECT id, slug FROM projects WHERE slug = ?1 AND owner_id = ?2`,
    params.slug,
    me.id,
  );
  if (!project) throw new Response("Not Found", { status: 404 });

  if (intent === "delete") {
    // posts that referenced this work keep their text: FK is ON DELETE SET NULL
    await run(context, `DELETE FROM projects WHERE id = ?1 AND owner_id = ?2`, project.id, me.id);
    throw redirect(`/@${me.handle}`);
  }

  const title = clamp(String(form.get("title") ?? ""), 90);
  const summary = clamp(String(form.get("summary") ?? ""), 220);
  const description = clamp(String(form.get("description") ?? ""), 8000);
  const kind = String(form.get("kind") ?? "project");
  const stage = clamp(String(form.get("stage") ?? ""), 40);
  const role = clamp(String(form.get("role") ?? ""), 2000);
  const limitations = clamp(String(form.get("limitations") ?? ""), 2000);
  const cover = cleanUrl(String(form.get("cover_url") ?? ""));
  const demo = cleanUrl(String(form.get("demo_url") ?? ""));
  const docs = cleanUrl(String(form.get("docs_url") ?? ""));
  const repo = cleanUrl(String(form.get("repo_url") ?? ""));
  const visibility = String(form.get("visibility") ?? "public");
  const accessMode = ACCESS_MODES.some((m) => m.v && m.v === String(form.get("access_mode")))
    ? String(form.get("access_mode"))
    : null;
  const featured = form.get("featured") === "on" ? 1 : 0;
  const skills = String(form.get("skills") ?? "")
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

  const errors: Record<string, string> = {};
  if (!title) errors.title = "请填写标题";
  if (!summary) errors.summary = "请填写一句话简介";
  if (cover.error) errors.cover_url = cover.error;
  if (demo.error) errors.demo_url = demo.error;
  if (docs.error) errors.docs_url = docs.error;
  if (repo.error) errors.repo_url = repo.error;
  if (Object.keys(errors).length) return data({ errors }, { status: 400 });

  await batch(context, [
    stmt(
      context,
      `UPDATE projects
          SET kind = ?3, title = ?4, summary = ?5, description = ?6,
              cover_url = ?7, demo_url = ?8, docs_url = ?9, repo_url = ?10,
              role = ?11, stage = ?12, limitations = ?13, visibility = ?14,
              access_mode = ?15, featured = ?16, updated_at = ?17
        WHERE id = ?1 AND owner_id = ?2`,
      project.id,
      me.id,
      KINDS.some((k) => k.v === kind) ? kind : "project",
      title,
      summary,
      description || null,
      cover.value,
      demo.value,
      docs.value,
      repo.value,
      role || null,
      stage || null,
      limitations || null,
      VISIBILITY.some((v) => v.v === visibility) ? visibility : "public",
      accessMode,
      featured,
      Date.now(),
    ),
    stmt(context, `DELETE FROM project_skills WHERE project_id = ?1`, project.id),
    ...skills.map((s, i) =>
      stmt(
        context,
        `INSERT OR IGNORE INTO project_skills (project_id, skill_name, position)
         VALUES (?1, ?2, ?3)`,
        project.id,
        s,
        i,
      ),
    ),
  ]);

  throw redirect(`/projects/${project.slug}`);
}

export default function ProjectEdit({ loaderData, actionData }: Route.ComponentProps) {
  const { project, skillsText } = loaderData;
  const errors = actionData?.errors ?? {};
  const [live, setLive] = useState({
    title: project.title,
    summary: project.summary,
    kind: project.kind,
    cover_url: project.cover_url ?? "",
    access_mode: project.access_mode ?? "",
  });
  const bind = (key: keyof typeof live) => ({
    value: live[key],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => setLive((v) => ({ ...v, [key]: e.target.value })),
  });

  return (
    <div className="max-w-[1080px]">
      <PageHead
        title="编辑作品"
        description="改完立刻生效。链接不会变，分享出去的地方仍然有效。"
        actions={
          <Link to={`/projects/${project.slug}`} className="btn btn-ghost btn-sm">
            看作品页
          </Link>
        }
      />

      <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Form method="post" className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
          <label className="block">
            <span className="mb-1.5 flex gap-2 text-[12.5px] font-medium">
              标题
              {errors.title && <span className="text-[#c0392b]">{errors.title}</span>}
            </span>
            <input
              name="title"
              required
              maxLength={90}
              {...bind("title")}
              className="field"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">类型</span>
            <select name="kind" {...bind("kind")} className="field cursor-pointer">
              {KINDS.map((k) => (
                <option key={k.v} value={k.v}>
                  {k.t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 flex gap-2 text-[12.5px] font-medium">
            一句话简介
            {errors.summary && <span className="text-[#c0392b]">{errors.summary}</span>}
          </span>
          <input
            name="summary"
            required
            maxLength={220}
            {...bind("summary")}
            className="field"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium">详细说明</span>
          <textarea
            name="description"
            rows={8}
            maxLength={8000}
            defaultValue={project.description ?? ""}
            className="field field-area !min-h-[180px]"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">
              我负责的部分
              <span className="ml-2 font-normal text-[var(--color-faint)]">会标注为自述</span>
            </span>
            <textarea
              name="role"
              rows={3}
              maxLength={2000}
              defaultValue={project.role ?? ""}
              className="field field-area !min-h-[88px]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">限制与前提</span>
            <textarea
              name="limitations"
              rows={3}
              maxLength={2000}
              defaultValue={project.limitations ?? ""}
              className="field field-area !min-h-[88px]"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">阶段</span>
            <input name="stage" maxLength={40} defaultValue={project.stage ?? ""} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">
              技能标签
              <span className="ml-2 font-normal text-[var(--color-faint)]">逗号分隔</span>
            </span>
            <input name="skills" defaultValue={skillsText} className="field" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">
              访问方式 <span className="font-normal text-[var(--color-faint)]">可选</span>
            </span>
            <select name="access_mode" {...bind("access_mode")} className="field cursor-pointer">
              {ACCESS_MODES.map((m) => (
                <option key={m.v || "none"} value={m.v}>
                  {m.t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex cursor-pointer items-start gap-3 self-end rounded-[10px] border border-[var(--color-line)] p-3">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={Boolean(project.featured)}
              className="mt-0.5 h-[16px] w-[16px] shrink-0 accent-[var(--color-ink-soft)]"
            />
            <span>
              <span className="block text-[13px] font-medium">设为个人主页精选</span>
              <span className="mt-0.5 block text-[12px] text-[var(--color-ink-soft)]">
                最多展示 3 个，超出的按时间先后
              </span>
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 flex gap-2 text-[12.5px] font-medium">
              封面图 URL · 支持图片或 .mp4 / .webm 短视频（自动静音循环）
              {errors.cover_url && <span className="text-[#c0392b]">{errors.cover_url}</span>}
            </span>
            <input
              name="cover_url"
              {...bind("cover_url")}
              placeholder="图片或 .mp4 / .webm 短视频链接，留空则自动生成"
              className="field"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex gap-2 text-[12.5px] font-medium">
              在线 Demo
              {errors.demo_url && <span className="text-[#c0392b]">{errors.demo_url}</span>}
            </span>
            <input name="demo_url" defaultValue={project.demo_url ?? ""} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 flex gap-2 text-[12.5px] font-medium">
              文档
              {errors.docs_url && <span className="text-[#c0392b]">{errors.docs_url}</span>}
            </span>
            <input name="docs_url" defaultValue={project.docs_url ?? ""} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 flex gap-2 text-[12.5px] font-medium">
              代码仓库
              {errors.repo_url && <span className="text-[#c0392b]">{errors.repo_url}</span>}
            </span>
            <input name="repo_url" defaultValue={project.repo_url ?? ""} className="field" />
          </label>
        </div>

        <fieldset className="border-t border-[var(--color-line-soft)] pt-5">
          <legend className="mb-2.5 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
            谁能看到
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {VISIBILITY.map((v) => (
              <label
                key={v.v}
                className="cursor-pointer rounded-[10px] border border-[var(--color-line)] p-3 transition has-[:checked]:border-[var(--color-ink-soft)] has-[:checked]:bg-[var(--color-paper)]"
              >
                <input
                  type="radio"
                  name="visibility"
                  value={v.v}
                  defaultChecked={project.visibility === v.v}
                  className="sr-only"
                />
                <span className="block text-[13px] font-medium">{v.t}</span>
                <span className="mt-0.5 block text-[12px] text-[var(--color-ink-soft)]">{v.d}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-line-soft)] pt-5">
          <span className="text-[12.5px] text-[var(--color-faint)]">
            删除后无法恢复，引用它的动态会保留文字。
          </span>
          <div className="flex items-center gap-2">
            <ConfirmDialog
              action={`/projects/${project.slug}/edit`}
              hidden={{ intent: "delete" }}
              title="删除这个作品？"
              description="作品页会立即失效，引用它的动态会保留文字但不再能打开作品。删除后无法恢复。"
              trigger={
                <button type="button" className="btn btn-ghost btn-sm !text-[#c0392b]">
                  删除作品
                </button>
              }
            />
            <Link to={`/projects/${project.slug}`} className="btn btn-ghost btn-sm">
              取消
            </Link>
            <button className="btn btn-primary btn-sm">保存</button>
          </div>
        </div>
      </Form>

      <aside className="xl:sticky xl:top-6">
        <p className="mb-2 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
          实时预览 · 作品卡片
        </p>
        <div data-testid="project-preview" className="overflow-hidden rounded-[16px] border border-[rgba(20,23,31,0.08)] bg-white">
          <CoverArt seed={project.slug} src={live.cover_url || null} aspect="16 / 10" photo={false} />
          <div className="p-4">
            <div className="flex items-center gap-2">
              <span className="chip chip-outline">{live.kind}</span>
              {live.access_mode && (
                <span className="rounded-full bg-[rgba(16,185,129,0.10)] px-2 py-0.5 text-[11px] text-[#10b981]">
                  {live.access_mode}
                </span>
              )}
            </div>
            <p className="mt-2 text-[15px] font-semibold">{live.title}</p>
            <p className={`mt-1 line-clamp-2 text-[12.5px] leading-relaxed ${live.summary ? "text-[#4a5264]" : "text-[#8b93a3]"}`}>
              {live.summary || "一句话说明它解决什么问题"}
            </p>
          </div>
        </div>
      </aside>
      </div>
    </div>
  );
}
