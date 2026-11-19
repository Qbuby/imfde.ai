import type { Route } from "./+types/settings-privacy";
import { Form, Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { one, run } from "~/lib/db.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await requireMe(context, request);
  const p = await one<{ visibility: string; hide_follows: number }>(
    context,
    `SELECT visibility, hide_follows FROM profiles WHERE user_id = ?1`,
    me.id,
  );
  return { me, profile: p };
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "save");

  if (intent === "delete-account") {
    // hard delete: cascade removes profile, projects, posts, follows, reactions
    await run(context, `DELETE FROM users WHERE id = ?1`, me.id);
    const { clearSessionCookie } = await import("~/lib/auth.server");
    throw redirect("/", { headers: { "Set-Cookie": clearSessionCookie() } });
  }

  await run(
    context,
    `UPDATE profiles SET visibility = ?2, hide_follows = ?3, updated_at = ?4
      WHERE user_id = ?1`,
    me.id,
    form.get("visibility") === "private" ? "private" : "public",
    form.get("hide_follows") === "on" ? 1 : 0,
    Date.now(),
  );

  return redirect("/settings/privacy?saved=1");
}

export default function SettingsPrivacy({
  loaderData,
}: Route.ComponentProps) {
  const { profile } = loaderData;

  return (
    <div className="mx-auto max-w-[680px]">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Settings</p>
          <h1 className="display mt-2 text-[clamp(24px,3.2vw,32px)]">隐私</h1>
        </div>
        <Link to="/settings/profile" className="btn btn-ghost btn-sm">
          编辑主页
        </Link>
      </header>

      <Form method="post" className="mt-7 space-y-3">
        <div className="card divide-y divide-[var(--color-line-soft)]">
          <label className="flex items-center justify-between gap-4 p-4">
            <span>
              <span className="block text-[13px] font-medium">主页公开</span>
              <span className="mt-0.5 block text-[12px] text-[var(--color-muted)]">
                关闭后，主页、作品和动态都不对其他人可见。
              </span>
            </span>
            <select
              name="visibility"
              defaultValue={profile?.visibility ?? "public"}
              className="field !h-[38px] !w-[104px] shrink-0"
            >
              <option value="public">公开</option>
              <option value="private">非公开</option>
            </select>
          </label>

          <label className="flex items-center justify-between gap-4 p-4">
            <span>
              <span className="block text-[13px] font-medium">隐藏关注数与关注列表</span>
              <span className="mt-0.5 block text-[12px] text-[var(--color-muted)]">
                关注者仍然存在，只是不在主页显示数字。
              </span>
            </span>
            <input
              type="checkbox"
              name="hide_follows"
              defaultChecked={Boolean(profile?.hide_follows)}
              className="h-[18px] w-[18px] shrink-0 accent-[var(--color-teal)]"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary">保存</button>
        </div>
      </Form>

      <section className="mt-10 rounded-[var(--radius-panel)] border border-[#f0d5d2] bg-[#fdf6f5] p-5">
        <h2 className="text-[14px] font-medium text-[#8c3b2f]">删除账号</h2>
        <p className="mt-1.5 max-w-[520px] text-[12.5px] leading-relaxed text-[#8c3b2f]/80">
          会永久删除你的主页、作品、动态、评论和关注关系。这个操作不可撤销，
          也没有回收站。
        </p>
        <Form method="post" className="mt-3.5">
          <input type="hidden" name="intent" value="delete-account" />
          <button className="btn btn-sm border border-[#e0c0bc] bg-white text-[#8c3b2f] hover:bg-[#fdf0ee]">
            删除我的账号
          </button>
        </Form>
      </section>
    </div>
  );
}
