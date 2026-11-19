import type { Route } from "./+types/login";
import { data, Form, Link, redirect } from "react-router";
import { createSessionCookie, verifyPassword } from "~/lib/auth.server";
import { one } from "~/lib/db.server";
import { safeNext, getMe } from "~/lib/session.server";
import { AuthShell } from "./join";

export async function loader({ request, context }: Route.LoaderArgs) {
  const me = await getMe(context, request);
  const next = safeNext(new URL(request.url).searchParams.get("next"));
  if (me) throw redirect(next);
  return { next };
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = safeNext(String(form.get("next") ?? "/"));

  if (!email || !password) {
    return data({ error: "请填写邮箱和密码" }, { status: 400 });
  }

  const user = await one<{
    id: string;
    password_hash: string;
    status: string;
    handle: string;
  }>(
    context,
    `SELECT u.id, u.password_hash, u.status, u.handle
       FROM users u WHERE u.email = ?1`,
    email,
  );

  // constant-ish response regardless of which half failed
  const ok = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !ok) {
    return data({ error: "邮箱或密码不对" }, { status: 400 });
  }
  if (user.status === "banned") {
    return data({ error: "这个账号已被封禁" }, { status: 403 });
  }

  const cookie = await createSessionCookie(context, user.id);
  throw redirect(next === "/" ? `/@${user.handle}` : next, {
    headers: { "Set-Cookie": cookie },
  });
}

export default function Login({ loaderData, actionData }: Route.ComponentProps) {
  const next = loaderData?.next ?? "/";
  const error = actionData?.error;

  return (
    <AuthShell
      title="欢迎回来"
      subtitle="登录后可以关注、点赞、评论和发布。"
      side={{
        title: "这里的数字只是数字。",
        points: [
          "关注数和点赞数不会变成信用分",
          "平台不经手任何交易",
          "你写的每一句都标注为本人自述",
        ],
      }}
    >
      <Form method="post" className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium">邮箱</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="field"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium">密码</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="field"
          />
        </label>

        {error && (
          <p className="rounded-[var(--radius-field)] bg-[#fdeceb] px-3.5 py-2.5 text-[12.5px] text-[#c0392b]">
            {error}
          </p>
        )}

        <button className="btn btn-primary !mt-6 w-full">登录</button>

        <p className="pt-1 text-center text-[12.5px] text-[var(--color-muted)]">
          还没有账号？
          <Link to="/join" className="ml-1 text-[var(--color-teal)] hover:underline">
            建一个
          </Link>
        </p>
      </Form>
    </AuthShell>
  );
}
