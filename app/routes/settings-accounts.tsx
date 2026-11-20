import type { Route } from "./+types/settings-accounts";
import { data, Form, Link, redirect } from "react-router";
import { requireMe } from "~/lib/session.server";
import { many, run } from "~/lib/db.server";
import { cleanUrl } from "~/lib/validate";
import { PageHead } from "~/components/page-head";

const PROVIDERS = [
  { v: "github", t: "GitHub", ph: "https://github.com/yourname" },
  { v: "linkedin", t: "LinkedIn", ph: "https://www.linkedin.com/in/yourname" },
  { v: "huggingface", t: "Hugging Face", ph: "https://huggingface.co/yourname" },
  { v: "website", t: "个人网站", ph: "https://yoursite.com" },
  { v: "x", t: "X", ph: "https://x.com/yourname" },
  { v: "blog", t: "博客", ph: "https://yourblog.com" },
];

const LABEL: Record<string, string> = Object.fromEntries(
  PROVIDERS.map((p) => [p.v, p.t]),
);

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await requireMe(context, request);
  const accounts = await many<{
    id: string;
    provider: string;
    profile_url: string;
    connection: string;
  }>(
    context,
    `SELECT id, provider, profile_url, connection FROM external_accounts
      WHERE user_id = ?1 ORDER BY position, created_at`,
    me.id,
  );
  return { me, accounts };
}

export async function action({ request, context }: Route.ActionArgs) {
  const me = await requireMe(context, request);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "add");

  if (intent === "remove") {
    await run(
      context,
      `DELETE FROM external_accounts WHERE id = ?1 AND user_id = ?2`,
      String(form.get("id") ?? ""),
      me.id,
    );
    return redirect("/settings/accounts");
  }

  const provider = String(form.get("provider") ?? "");
  const cleaned = cleanUrl(String(form.get("profile_url") ?? ""));

  if (!PROVIDERS.some((p) => p.v === provider)) {
    return data({ error: "请选择平台" }, { status: 400 });
  }
  if (cleaned.error) {
    return data({ error: cleaned.error }, { status: 400 });
  }
  if (!cleaned.value) {
    return data({ error: "请填写链接" }, { status: 400 });
  }
  const url = cleaned.value;

  const count = await many<{ n: number }>(
    context,
    `SELECT COUNT(*) AS n FROM external_accounts WHERE user_id = ?1`,
    me.id,
  );

  await run(
    context,
    `INSERT OR IGNORE INTO external_accounts
       (id, user_id, provider, profile_url, connection, position, created_at)
     VALUES (?1, ?2, ?3, ?4, 'link', ?5, ?6)`,
    crypto.randomUUID(),
    me.id,
    provider,
    url,
    count[0]?.n ?? 0,
    Date.now(),
  );

  return redirect("/settings/accounts");
}

export default function SettingsAccounts({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { accounts } = loaderData;

  return (
    <div className="max-w-[760px]">
      <PageHead
        label="Settings"
        title="外部账号"
        description="加 GitHub、LinkedIn 这些链接，会显示在主页上，并标注为「外部链接」——意思是我们不核实那边的内容，访问者点过去自己看。"
        actions={
          <Link to="/settings/profile" className="btn btn-ghost btn-sm">
            编辑主页
          </Link>
        }
      />

      {accounts.length > 0 && (
        <div className="mt-7 divide-y divide-[var(--color-line-soft)] border-y border-[var(--color-line-soft)]">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-3.5">
              <span className="chip chip-outline shrink-0">
                {LABEL[a.provider] ?? a.provider}
              </span>
              <a
                href={a.profile_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="min-w-0 flex-1 truncate text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              >
                {a.profile_url}
              </a>
              <Form method="post" className="shrink-0">
                <input type="hidden" name="intent" value="remove" />
                <input type="hidden" name="id" value={a.id} />
                <button className="btn btn-quiet btn-sm">移除</button>
              </Form>
            </div>
          ))}
        </div>
      )}

      <Form
        method="post"
        className="mt-6 rounded-[12px] border border-[var(--color-line-soft)] bg-[var(--color-paper)] p-4"
      >
        <p className="mb-3 text-[12.5px] font-medium">添加一个</p>
        <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
          <select name="provider" className="field cursor-pointer">
            {PROVIDERS.map((p) => (
              <option key={p.v} value={p.v}>
                {p.t}
              </option>
            ))}
          </select>
          <input
            name="profile_url"
            required
            placeholder="https://…"
            className="field"
          />
        </div>
        {actionData?.error && (
          <p className="mt-2 text-[12.5px] text-[#c0392b]">{actionData.error}</p>
        )}
        <div className="mt-3 flex justify-end">
          <button className="btn btn-primary btn-sm">添加</button>
        </div>
      </Form>

      <p className="mt-5 text-[11.5px] leading-relaxed text-[var(--color-faint)]">
        当前所有外部账号都是「手动链接」。OAuth 授权连接会在后续版本提供，
        届时会额外标注「已连接账号」，同样不代表我们核实了你的履历。
      </p>
    </div>
  );
}
