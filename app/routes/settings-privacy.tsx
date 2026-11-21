import type { Route } from "./+types/settings-privacy";
import { data, Form, redirect } from "react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { requireMe } from "~/lib/session.server";
import { one, run } from "~/lib/db.server";
import { PageHead } from "~/components/page-head";
import { SettingsTabs } from "~/components/settings-tabs";

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await requireMe(context, request);
  const p = await one<{ visibility: string; hide_follows: number }>(
    context,
    `SELECT visibility, hide_follows FROM profiles WHERE user_id = ?1`,
    me.id,
  );
  const url = new URL(request.url);
  return { me, profile: p, saved: url.searchParams.get("saved") === "1" };
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "save");

  if (intent === "delete-account") {
    // the client already asks the user to type their handle; re-check here so
    // a replayed form cannot delete an account without that step
    const typed = String(form.get("confirm_handle") ?? "").trim().toLowerCase();
    if (typed !== `@${me.handle}`) {
      return data({ error: "确认文本不匹配，账号未删除" }, { status: 400 });
    }
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
  const { me, profile, saved } = loaderData;

  // a redirect back with ?saved=1 is the only confirmation the browser sees
  useEffect(() => {
    if (saved) toast.success("隐私设置已保存");
  }, [saved]);

  return (
    <div className="max-w-[760px]">
      <PageHead
        title="隐私设置"
      />
      <div className="mt-5"><SettingsTabs /></div>

      {saved && (
        <p className="mt-5 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-2.5 text-[12.5px] text-[var(--color-ink-soft)]">
          隐私设置已保存。
        </p>
      )}

      <Form method="post" className="mt-7 space-y-3">
        <div className="divide-y divide-[var(--color-line-soft)] border-y border-[var(--color-line-soft)]">
          <label className="flex items-center justify-between gap-4 py-4">
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

          <label className="flex items-center justify-between gap-4 py-4">
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
              className="h-[18px] w-[18px] shrink-0 accent-[var(--color-ink-soft)]"
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
        <div className="mt-3.5">
          <ConfirmDialog
            action="/settings/privacy"
            hidden={{ intent: "delete-account", confirm_handle: `@${me.handle}` }}
            title="永久删除账号"
            description={
              <>
                会删除你的主页、作品、动态、评论和全部关注关系，且没有回收站。
                留下的引用会显示「原动态已删除或不可见」。
              </>
            }
            confirmLabel="确认删除账号"
            requireText={`@${me.handle}`}
            requireHint={`输入 @${me.handle} 以启用删除`}
            trigger={
              <button
                type="button"
                className="btn btn-sm border border-[#e0c0bc] bg-white text-[#8c3b2f] hover:bg-[#fdf0ee]"
              >
                删除我的账号
              </button>
            }
          />
        </div>
      </section>
    </div>
  );
}
