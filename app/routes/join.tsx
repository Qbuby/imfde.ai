import type { Route } from "./+types/join";
import { useState } from "react";
import { data, Form, Link, redirect } from "react-router";
import { hashPassword, createSessionCookie } from "~/lib/auth.server";
import { one, stmt, batch } from "~/lib/db.server";
import { checkDisplayName, checkEmail, checkHandle, checkPassword } from "~/lib/validate";
import { getMe } from "~/lib/session.server";
import { BrandLogo } from "~/components/brand-logo";

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
  const [draft, setDraft] = useState({
    handle: values?.handle ?? "",
    display_name: values?.display_name ?? "",
    kind: values?.kind ?? "individual",
  });
  const bind = (key: keyof typeof draft) => ({
    value: draft[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDraft((d) => ({ ...d, [key]: e.target.value })),
  });

  return (
    <AuthShell
      title="注册 ImFDE"
      subtitle="选一个 id，创建你的公开主页"
      side={<JoinPreview handle={draft.handle} displayName={draft.display_name} kind={draft.kind} />}
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

        <Field label="Id" error={errors.handle} hint="你的地址：imfde.ai/@id">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[var(--color-faint)]">
              @
            </span>
            <input
              name="handle"
              required
              autoComplete="username"
              {...bind("handle")}
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
            {...bind("display_name")}
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
                  checked={draft.kind === o.v}
                  onChange={() => setDraft((d) => ({ ...d, kind: o.v }))}
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
  children,
}: {
  title: string;
  subtitle: string;
  side?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[var(--color-canvas)]">
      <div className="mx-auto grid min-h-dvh max-w-[1100px] items-center gap-12 px-6 py-12 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div>
          <Link to="/" aria-label="ImFDE 首页">
            <BrandLogo size="lg" />
          </Link>
          <h1 className="display mt-8 text-[clamp(26px,3.2vw,34px)]">{title}</h1>
          <p className="mt-2 text-[13.5px] text-[var(--color-muted)]">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>

        {side && <aside className="hidden lg:block">{side}</aside>}
      </div>
    </div>
  );
}

/** Quiet live preview of the address card as the visitor types. */
function JoinPreview({ handle, displayName, kind }: { handle: string; displayName: string; kind: string }) {
  return (
    <div className="rounded-[20px] border border-[#eff3f4] bg-[#f7f9f9] p-8">
      <p className="font-sans text-[11px] tracking-[0.08em] text-[#8b93a3] uppercase">地址预览</p>
      <p className="mt-3 truncate text-[15px] font-medium text-[#0f1419]">imfde.ai/@{handle || "yourname"}</p>
      <div className="mt-6 rounded-[14px] border border-[#e2e5ea] bg-white p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f2f5] text-[17px] font-semibold text-[#536471]">
          {(displayName || "F").slice(0, 1)}
        </div>
        <p className="mt-3 text-[15px] font-semibold text-[#0f1419]">{displayName || "你的名字"}</p>
        <p className="mt-0.5 text-[12px] text-[#8b93a3]">@{handle || "yourname"}</p>
        <p className="mt-3 text-[12px] text-[#536471]">{kind === "team" ? "团队 / Studio" : "独立 FDE"}</p>
      </div>
    </div>
  );
}
