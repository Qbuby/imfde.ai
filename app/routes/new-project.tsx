import type { Route } from "./+types/new-project";
import { data, Form, Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { one, stmt, batch } from "~/lib/db.server";
import { cleanUrl, clamp } from "~/lib/validate";
import { slugify } from "~/lib/format";
import { insertPost } from "~/lib/queries.server";
import { PageHead } from "~/components/page-head";
import { CoverArt } from "~/components/media";
import { useState } from "react";

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

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await requireMe(context, request);
  return { me };
}

async function uniqueSlug(
  context: Parameters<typeof one>[0],
  base: string,
): Promise<string> {
  const root = base || "work";
  for (let i = 0; i < 40; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const hit = await one<{ n: number }>(
      context,
      `SELECT COUNT(*) AS n FROM projects WHERE slug = ?1`,
      candidate,
    );
    if ((hit?.n ?? 0) === 0) return candidate;
  }
  return `${root}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();

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
  if (Object.keys(errors).length) {
    return data({ errors }, { status: 400 });
  }

  const slug = await uniqueSlug(context, slugify(title));
  const id = crypto.randomUUID();
  const now = Date.now();

  const stmts = [
    stmt(
      context,
      `INSERT INTO projects
         (id, owner_id, slug, kind, title, summary, description, cover_url,
          demo_url, docs_url, repo_url, role, stage, limitations,
          visibility, featured, access_mode, created_at, updated_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,'public',?15,?16,?17,?17)`,
      id,
      me.id,
      slug,
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
      featured,
      accessMode,
      now,
    ),
    ...skills.map((s, i) =>
      stmt(
        context,
        `INSERT OR IGNORE INTO project_skills (project_id, skill_name, position)
         VALUES (?1, ?2, ?3)`,
        id,
        s,
        i,
      ),
    ),
  ];

  await batch(context, stmts);

  // Publishing work is the one moment the author is already writing copy, so
  // offering a matching feed post here is cheaper than asking them again.
  if (form.get("share_to_feed") === "on") {
    await insertPost(context, {
      authorId: me.id,
      kind: "show",
      body: `${title}
${summary}`,
      projectId: id,
      tags: skills.slice(0, 5),
    });
  }

  throw redirect(`/projects/${slug}`);
}

export default function NewProject({ actionData }: Route.ComponentProps) {
  const errors = actionData?.errors ?? {};
  const [live, setLive] = useState({
    title: "",
    summary: "",
    kind: "project",
    cover_url: "",
    access_mode: "",
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
        label="Create"
        title="上传一个作品"
        description="标题之外都可以先跳过。作品页会明确标注哪些是本人自述、哪些是外部链接。"
        actions={
          <Link to="/" className="btn btn-ghost btn-sm">
            取消
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
              placeholder="比如：把客服工单自动归档的 Agent"
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
            placeholder="它解决什么问题，为谁解决"
            className="field"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium">
            详细说明
            <span className="ml-2 font-normal text-[var(--color-faint)]">
              可以留空
            </span>
          </span>
          <textarea
            name="description"
            rows={8}
            maxLength={8000}
            placeholder="背景、做法、结果。贴截图和数字时说明口径会更有说服力。"
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
              placeholder="比如：独立完成架构和后端，前端与设计师合作"
              className="field field-area !min-h-[88px]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">
              限制与前提
              <span className="ml-2 font-normal text-[var(--color-faint)]">可选</span>
            </span>
            <textarea
              name="limitations"
              rows={3}
              maxLength={2000}
              placeholder="比如：只支持英文工单；需要私有部署"
              className="field field-area !min-h-[88px]"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">
              阶段 <span className="font-normal text-[var(--color-faint)]">可选</span>
            </span>
            <input
              name="stage"
              maxLength={40}
              placeholder="原型 / 内测 / 已上线 / 维护中"
              className="field"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium">
              技能标签
              <span className="ml-2 font-normal text-[var(--color-faint)]">逗号分隔</span>
            </span>
            <input
              name="skills"
              placeholder="RAG, 语音转写, D1"
              className="field"
            />
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
              className="mt-0.5 h-[16px] w-[16px] shrink-0 accent-[var(--color-ink-soft)]"
            />
            <span>
              <span className="block text-[13px] font-medium">设为个人主页精选</span>
              <span className="mt-0.5 block text-[12px] text-[var(--color-ink-soft)]">
                最多展示 3 个，超出的按时间先后
              </span>
            </span>
          </label>
        </div>

        <fieldset className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-sunken)] p-4">
          <legend className="px-1 text-[11.5px] tracking-[0.1em] text-[var(--color-muted)] uppercase">
            链接与图片
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 flex gap-2 text-[12px] text-[var(--color-ink-soft)]">
                封面图 URL · 支持图片或 .mp4 / .webm 短视频（自动静音循环）
                {errors.cover_url && <span className="text-[#c0392b]">{errors.cover_url}</span>}
              </span>
              <input name="cover_url" {...bind("cover_url")} placeholder="图片 URL 或 https://…/demo.mp4" className="field !h-[42px]" />
            </label>
            <label className="block">
              <span className="mb-1.5 flex gap-2 text-[12px] text-[var(--color-ink-soft)]">
                在线 Demo
                {errors.demo_url && <span className="text-[#c0392b]">{errors.demo_url}</span>}
              </span>
              <input name="demo_url" placeholder="https://…" className="field !h-[42px]" />
            </label>
            <label className="block">
              <span className="mb-1.5 flex gap-2 text-[12px] text-[var(--color-ink-soft)]">
                文档
                {errors.docs_url && <span className="text-[#c0392b]">{errors.docs_url}</span>}
              </span>
              <input name="docs_url" placeholder="https://…" className="field !h-[42px]" />
            </label>
            <label className="block">
              <span className="mb-1.5 flex gap-2 text-[12px] text-[var(--color-ink-soft)]">
                代码仓库
                {errors.repo_url && <span className="text-[#c0392b]">{errors.repo_url}</span>}
              </span>
              <input name="repo_url" placeholder="https://github.com/…" className="field !h-[42px]" />
            </label>
          </div>
          <p className="mt-2.5 text-[11.5px] text-[var(--color-faint)]">
            没有封面图也可以发布，会自动生成一张配色封面。
          </p>
        </fieldset>

        <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-sunken)] p-4">
          <input
            type="checkbox"
            name="share_to_feed"
            defaultChecked
            className="mt-0.5 h-[16px] w-[16px] shrink-0 accent-[var(--color-ink-soft)]"
          />
          <span>
            <span className="block text-[13px] font-medium">同时发布一条动态到广场</span>
            <span className="mt-0.5 block text-[12px] text-[var(--color-ink-soft)]">
              用标题和简介自动生成，带上技能标签，可以之后在广场上改。
            </span>
          </span>
        </label>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link to="/" className="btn btn-ghost">
            取消
          </Link>
          <button className="btn btn-primary">发布作品</button>
        </div>
      </Form>

      <aside className="xl:sticky xl:top-6">
        <p className="mb-2 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
          实时预览 · 作品卡片
        </p>
        <div data-testid="project-preview" className="overflow-hidden rounded-[16px] border border-[rgba(20,23,31,0.08)] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.04)]">
          <CoverArt seed="preview-work" src={live.cover_url || null} aspect="16 / 10" photo={false} />
          <div className="p-4">
            <div className="flex items-center gap-2">
              <span className="chip chip-outline">{live.kind}</span>
              {live.access_mode && (
                <span className="rounded-full bg-[rgba(16,185,129,0.10)] px-2 py-0.5 text-[11px] text-[#10b981]">
                  {live.access_mode}
                </span>
              )}
            </div>
            <p className={`mt-2 text-[15px] font-semibold ${live.title ? "" : "text-[#8b93a3]"}`}>
              {live.title || "作品标题"}
            </p>
            <p className={`mt-1 line-clamp-2 text-[12.5px] leading-relaxed ${live.summary ? "text-[#4a5264]" : "text-[#8b93a3]"}`}>
              {live.summary || "一句话说明它解决什么问题"}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-faint)]">
          外部链接与本人自述会在作品页分开标注，平台不核实、不排名。
        </p>
      </aside>
      </div>
    </div>
  );
}
