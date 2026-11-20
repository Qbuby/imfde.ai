import type { Route } from "./+types/settings-profile";
import { data, Form, Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { many, one, stmt, batch } from "~/lib/db.server";
import { cleanUrl, clamp } from "~/lib/validate";
import { Avatar, CoverArt } from "~/components/media";
import { PageHead } from "~/components/page-head";

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await requireMe(context, request);
  const profile = await one<{
    display_name: string;
    avatar_url: string | null;
    cover_url: string | null;
    headline: string | null;
    about: string | null;
    location: string | null;
    timezone: string | null;
    visibility: string;
    hide_follows: number;
  }>(
    context,
    `SELECT display_name, avatar_url, cover_url, headline, about, location,
            timezone, visibility, hide_follows
       FROM profiles WHERE user_id = ?1`,
    me.id,
  );
  const skills = await many<{ skill_name: string }>(
    context,
    `SELECT skill_name FROM profile_skills WHERE user_id = ?1 ORDER BY position`,
    me.id,
  );

  const url = new URL(request.url);
  return {
    me,
    profile,
    skills: skills.map((s) => s.skill_name).join(", "),
    welcome: url.searchParams.get("welcome") === "1",
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();

  const displayName = clamp(String(form.get("display_name") ?? ""), 60);
  const avatar = cleanUrl(String(form.get("avatar_url") ?? ""));
  const cover = cleanUrl(String(form.get("cover_url") ?? ""));

  const errors: Record<string, string> = {};
  if (!displayName) errors.display_name = "显示名称不能为空";
  if (avatar.error) errors.avatar_url = avatar.error;
  if (cover.error) errors.cover_url = cover.error;

  if (Object.keys(errors).length) {
    return data({ errors }, { status: 400 });
  }

  const now = Date.now();
  await batch(context, [
    stmt(
      context,
      `UPDATE profiles SET
         display_name = ?2, headline = ?3, about = ?4, location = ?5,
         timezone = ?6, avatar_url = ?7, cover_url = ?8, visibility = ?9,
         updated_at = ?10
       WHERE user_id = ?1`,
      me.id,
      displayName,
      clamp(String(form.get("headline") ?? ""), 140) || null,
      clamp(String(form.get("about") ?? ""), 4000) || null,
      clamp(String(form.get("location") ?? ""), 80) || null,
      clamp(String(form.get("timezone") ?? ""), 60) || null,
      avatar.value,
      cover.value,
      form.get("visibility") === "private" ? "private" : "public",
      now,
    ),
    stmt(context, `DELETE FROM profile_skills WHERE user_id = ?1`, me.id),
  ]);

  const skills = String(form.get("skills") ?? "")
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);

  if (skills.length) {
    await batch(
      context,
      skills.map((s, i) =>
        stmt(
          context,
          `INSERT OR IGNORE INTO profile_skills (user_id, skill_name, position)
           VALUES (?1, ?2, ?3)`,
          me.id,
          s,
          i,
        ),
      ),
    );
  }

  throw redirect(`/@${me.handle}`);
}

export default function SettingsProfile({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { me, profile, skills, welcome } = loaderData;
  const p = profile!;

  return (
    <div className="max-w-[900px]">
      {welcome && (
        <div className="mb-6 rounded-[var(--radius-panel)] border border-[var(--color-ink-soft)] bg-[var(--color-accent-soft)] px-4 py-3.5">
          <p className="text-[13.5px] font-medium text-[#0a6772]">
            主页建好了。接着把它填完整——
          </p>
          <p className="mt-1 text-[12.5px] text-[#0a6772]/80">
            写一句话介绍自己，贴一个作品，再连上 GitHub。三步之后别人就能看懂你是谁。
          </p>
        </div>
      )}

      <PageHead
        label="Settings"
        title="编辑主页"
        description="别人看到的这一页，就是这里填的东西。"
        actions={
          <>
            <Link to={`/@${me.handle}`} className="btn btn-ghost btn-sm">
              看主页
            </Link>
            <Link to="/settings/accounts" className="btn btn-ghost btn-sm">
              外部账号
            </Link>
          </>
        }
      />

      {/* live preview header */}
      <div className="mt-7 overflow-hidden rounded-[12px] border border-[var(--color-line-soft)]">
        <CoverArt
          seed={`${me.handle}-cover`}
          src={p.cover_url}
          aspect="16 / 5"
          photo={false}
        />
        <div className="-mt-9 flex items-end gap-3 px-4 pb-4">
          <Avatar name={p.display_name} src={p.avatar_url} size={64} ring />
          <div className="pb-0.5">
            <p className="text-[15px] font-medium">{p.display_name}</p>
            <p className="font-mono text-[11px] text-[var(--color-faint)]">
              @{me.handle}
            </p>
          </div>
        </div>
      </div>

      <Form method="post" className="mt-8 space-y-5">
        {/* privacy toggle lives here because it is about the page itself */}
        <label className="flex items-center justify-between gap-4 rounded-[var(--radius-field)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3.5">
          <span>
            <span className="block text-[13px] font-medium">主页可见性</span>
            <span className="mt-0.5 block text-[12px] text-[var(--color-muted)]">
              非公开时只有你自己能看到这个页面。
            </span>
          </span>
          <select
            name="visibility"
            defaultValue={p.visibility}
            className="field !h-[38px] !w-[104px] shrink-0"
          >
            <option value="public">公开</option>
            <option value="private">非公开</option>
          </select>
        </label>

        <Field label="显示名称">
          <input
            name="display_name"
            required
            maxLength={60}
            defaultValue={p.display_name}
            className="field"
          />
        </Field>

        <Field label="一句话定位" hint="会显示在主页最上方和搜索结果里">
          <input
            name="headline"
            maxLength={140}
            defaultValue={p.headline ?? ""}
            placeholder="比如：把企业系统接到大模型上的 FDE，专做语音与工单"
            className="field"
          />
        </Field>

        <Field label="关于">
          <textarea
            name="about"
            rows={6}
            maxLength={4000}
            defaultValue={p.about ?? ""}
            placeholder="你的背景、擅长的场景、怎么工作。写成给同行和潜在客户看的样子。"
            className="field field-area !min-h-[140px]"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="所在地">
            <input
              name="location"
              maxLength={80}
              defaultValue={p.location ?? ""}
              placeholder="上海"
              className="field"
            />
          </Field>
          <Field label="时区">
            <input
              name="timezone"
              maxLength={60}
              defaultValue={p.timezone ?? ""}
              placeholder="UTC+8"
              className="field"
            />
          </Field>
        </div>

        <Field label="方向标签" hint="逗号分隔，最多 12 个">
          <input
            name="skills"
            defaultValue={skills}
            placeholder="Agent 编排, RAG, 语音转写, 私有部署"
            className="field"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="头像 URL"
            hint="留空则用名称首字"
            error={actionData?.errors?.avatar_url}
          >
            <input
              name="avatar_url"
              defaultValue={p.avatar_url ?? ""}
              placeholder="https://…"
              className="field"
            />
          </Field>
          <Field
            label="封面 URL"
            hint="留空则生成配色封面"
            error={actionData?.errors?.cover_url}
          >
            <input
              name="cover_url"
              defaultValue={p.cover_url ?? ""}
              placeholder="https://…"
              className="field"
            />
          </Field>
        </div>

        {actionData?.errors?.display_name && (
          <p className="text-[12.5px] text-[#c0392b]">{actionData.errors.display_name}</p>
        )}

        <div className="flex items-center justify-between pt-2">
          <Link
            to="/settings/privacy"
            className="text-[12.5px] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            隐私设置 →
          </Link>
          <button className="btn btn-primary">保存</button>
        </div>
      </Form>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex flex-wrap items-baseline gap-2">
        <span className="text-[12.5px] font-medium">{label}</span>
        {hint && <span className="text-[11.5px] text-[var(--color-faint)]">{hint}</span>}
        {error && <span className="text-[11.5px] text-[#c0392b]">{error}</span>}
      </span>
      {children}
    </label>
  );
}
