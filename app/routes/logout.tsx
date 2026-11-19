import type { Route } from "./+types/logout";
import { redirect } from "react-router";
import { clearSessionCookie } from "~/lib/auth.server";
import { safeNext } from "~/lib/session.server";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData().catch(() => null);
  const next = safeNext(String(form?.get("next") ?? "/"));
  throw redirect(next, { headers: { "Set-Cookie": clearSessionCookie() } });
}

export async function loader() {
  throw redirect("/");
}
