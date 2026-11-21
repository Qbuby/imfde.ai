import type { Route } from "./+types/join";
import { data, Form, Link, redirect } from "react-router";
import { hashPassword, createSessionCookie } from "~/lib/auth.server";
import { one, stmt, batch } from "~/lib/db.server";
import { checkDisplayName, checkEmail, checkHandle, checkPassword } from "~/lib/validate";
import { getMe } from "~/lib/session.server";
import { BorderBeam } from "~/components/magicui/border-beam";

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await getMe(context, request);
  if (me) throw redirect(`/@${me.handle}`);
  return {};
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const handle = String(form.get("handle") ?? "").trim().toLowerCase();
  const displayName = String(form.get("display_name") ?? "").trim();
  const kind = form.get("kind") === "team" ? "team" : "individual";

  const errors: Record<string, string> = {};
  const e = checkEmail(email);
  if (e) errors.email = e;
  const p = checkPassword(password);
  if (p) errors.password = p;
  const h = checkHandle(handle);
  if (h) errors.handle = h;
  const d = checkDisplayName(displayName);
  if (d) errors.display_name = d;

  if (Object.keys(errors).length === 0) {
    const dupe = await one<{ n: number }>(
      context,
      `SELECT COUNT(*) AS n FROM users WHERE email = ?1 OR handle = ?2`,
      email,
      handle,
    );
    if ((dupe?.n ?? 0) > 0) {
      const emailTaken = await one<{ n: number }>(
        context,
        `SELECT COUNT(*) AS n FROM users WHERE email = ?1`,
        email,
      );
      if ((emailTaken?.n ?? 0) > 0) errors.email = "这个邮箱已经注册过了";
      else errors.handle = "这个 handle 已经有人用了";
    }
  }

  if (Object.keys(errors).length > 0) {
    return data({ errors, values: { email, handle, display_name: displayName, kind } }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  const hash = await hashPassword(password);

  await batch(context, [
    stmt(
      context,
      `INSERT INTO users (id, email, password_hash, handle, kind, status, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, 'active', ?6)`,
      id,
      email,
      hash,
      handle,
      kind,
      now,
    ),
    stmt(
      context,
      `INSERT INTO profiles (user_id, display_name, visibility, updated_at)
       VALUES (?1, ?2, 'public', ?3)`,
      id,
      displayName,
      now,
    ),
  ]);

  const cookie = await createSessionCookie(context, id);
  throw redirect(`/settings/profile?welcome=1`, {
    headers: { "Set-Cookie": cookie },
  });
}

export default function Join({ actionData }: Route.ComponentProps) {
  const errors = actionData?.errors ?? {};
  const values = actionData?.values;

  return (
    <AuthShell
      dark
      title="建你的主页"
      subtitle="两分钟。不需要认证，不需要审核。"
      side={{
        title: "一个地址，装下你做过的事。",
        points: [
          "imfde.ai/@你的名字 — 可搜索、可分享",
          "作品配得上截图、Demo 和仓库链接",
          "同行会看到，但没人给你打分",
        ],
      }}
    >
      <Form method="post" className="space-y-4">
        <Field label="邮箱" error={errors.email}>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={values?.email}
            placeholder="you@example.com"
            className="field"
          />
        </Field>

        <Field label="密码" error={errors.password} hint="至少 8 位">
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            placeholder="••••••••"
            className="field"
          />
        </Field>

        <Field label="Handle" error={errors.handle} hint="你的地址：imfde.ai/@handle">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[var(--color-faint)]">
              @
            </span>
            <input
              name="handle"
              required
              autoComplete="username"
              defaultValue={values?.handle}
              placeholder="yourname"
              pattern="[a-z0-9][a-z0-9_]{1,23}"
              className="field pl-8"
            />
          </div>
        </Field>

        <Field label="显示名称" error={errors.display_name}>
          <input
            name="display_name"
            required
            autoComplete="name"
            defaultValue={values?.display_name}
            placeholder="你的名字，或工作室名字"
            className="field"
          />
        </Field>

        <fieldset>
          <legend className="mb-2 text-[12.5px] font-medium text-[var(--color-ink)]">
            你以什么身份出现
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "individual", t: "独立 FDE", d: "个人主页" },
              { v: "team", t: "团队 / Studio", d: "团队主页" },
            ].map((o) => (
              <label
                key={o.v}
                className="cursor-pointer rounded-[var(--radius-field)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3 transition has-[:checked]:border-[var(--color-ink-soft)] has-[:checked]:bg-[var(--color-accent-soft)]"
              >
                <input
                  type="radio"
                  name="kind"
                  value={o.v}
                  defaultChecked={(values?.kind ?? "individual") === o.v}
                  className="sr-only"
                />
                <span className="block text-[13px] font-medium">{o.t}</span>
                <span className="mt-0.5 block text-[11.5px] text-[var(--color-muted)]">
                  {o.d}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <button className="btn btn-primary !mt-6 w-full">建主页</button>

        <p className="pt-1 text-center text-[12.5px] text-[var(--color-muted)]">
          已经有账号？
          <Link to="/login" className="ml-1 text-[var(--color-ink-soft)] hover:underline">
            登录
          </Link>
        </p>
      </Form>
    </AuthShell>
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
      <span className="mb-1.5 flex items-baseline gap-2">
        <span className="text-[12.5px] font-medium text-[var(--color-ink)]">{label}</span>
        {hint && !error && (
          <span className="text-[11.5px] text-[var(--color-faint)]">{hint}</span>
        )}
        {error && <span className="text-[11.5px] text-[#c0392b]">{error}</span>}
      </span>
      {children}
    </label>
  );
}

export function AuthShell({
  title,
  subtitle,
  side,
  dark = false,
  children,
}: {
  title: string;
  subtitle: string;
  side: { title: string; points: string[] };
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[var(--color-canvas)]">
      <div className="mx-auto grid min-h-dvh max-w-[1100px] items-center gap-12 px-6 py-12 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div>
          <Link to="/" className="display text-[22px]">
            iMFDE<span className="text-[var(--color-ink-soft)]">.</span>
          </Link>
          <h1 className="display mt-8 text-[clamp(26px,3.2vw,34px)]">{title}</h1>
          <p className="mt-2 text-[13.5px] text-[var(--color-muted)]">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>

        <aside className="hidden lg:block">
          {dark ? (
            <div className="relative min-h-[440px] overflow-hidden rounded-[24px] border border-white/10 bg-[#14171f] px-9 py-12 shadow-[0_18px_36px_rgba(16,24,40,0.09)]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.16]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
                  backgroundSize: "18px 18px",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -right-24 -top-24 h-[320px] w-[320px] rounded-full bg-sky-500/20 blur-[90px]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -left-16 h-[300px] w-[300px] rounded-full bg-violet-500/20 blur-[90px]"
              />
              <BorderBeam size={140} duration={8} borderWidth={1.5} colorFrom="#0ea5e9" colorTo="#f59e0b" />
              <div className="relative z-10">
                <p className="display text-[clamp(22px,2.4vw,30px)] leading-[1.25] text-white">
                  {side.title}
                </p>
                <ul className="mt-7 space-y-3.5">
                  {side.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-[13.5px] text-white/80">
                      <span className="mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#10b981] text-[10px] font-bold text-[#14171f]">
                        ✓
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-9 font-mono text-[10.5px] tracking-[0.12em] text-white/45 uppercase">
                  No credit scores · No escrow · No ranking
                </p>
              </div>
            </div>
          ) : (
            <div
              className="relative overflow-hidden rounded-[24px] border border-[var(--color-line)] px-9 py-12"
              style={{
                backgroundImage:
                  "radial-gradient(80% 90% at 10% 0%, #f0e9ff 0%, transparent 60%), radial-gradient(70% 80% at 95% 10%, #e3f2f3 0%, transparent 62%), radial-gradient(90% 90% at 50% 110%, #fdf4d8 0%, transparent 66%)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <p className="display text-[clamp(22px,2.4vw,30px)] leading-[1.25]">
                {side.title}
              </p>
              <ul className="mt-7 space-y-3.5">
                {side.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[13.5px] text-[var(--color-ink-soft)]">
                    <span className="mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--color-ink-2)] text-[10px] text-white">
                      ✓
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <p className="mt-9 font-mono text-[10.5px] tracking-[0.12em] text-[var(--color-faint)] uppercase">
                No credit scores · No escrow · No ranking
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
