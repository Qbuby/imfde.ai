import type { AppLoadContext } from "react-router";
import { redirect } from "react-router";
import { readSession } from "./auth.server";
import { one } from "./db.server";

export interface Me {
  id: string;
  handle: string;
  kind: "individual" | "team";
  display_name: string;
  avatar_url: string | null;
}

/** Current viewer, or null. Never throws. */
export async function getMe(
  context: AppLoadContext,
  request: Request,
): Promise<Me | null> {
  const userId = await readSession(context, request);
  if (!userId) return null;

  const row = await one<{
    id: string;
    handle: string;
    kind: "individual" | "team";
    display_name: string;
    avatar_url: string | null;
    status: string;
  }>(
    context,
    `SELECT u.id, u.handle, u.kind, u.status, p.display_name, p.avatar_url
       FROM users u JOIN profiles p ON p.user_id = u.id
      WHERE u.id = ?1`,
    userId,
  );

  if (!row || row.status === "banned") return null;
  return {
    id: row.id,
    handle: row.handle,
    kind: row.kind,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
  };
}

/** For routes that require a signed-in user. */
export async function requireMe(
  context: AppLoadContext,
  request: Request,
  redirectTo?: string,
): Promise<Me> {
  const me = await getMe(context, request);
  if (me) return me;
  const url = new URL(request.url);
  const next = redirectTo ?? url.pathname + url.search;
  throw redirect(`/login?next=${encodeURIComponent(next)}`);
}

export function safeNext(value: string | null): string {
  if (!value) return "/";
  // only allow same-origin absolute paths
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

/** Handle lookups: `/@name` maps to users.handle = 'name'. */
export function normalizeHandle(param: string): string | null {
  if (!param.startsWith("@")) return null;
  const handle = param.slice(1).toLowerCase();
  if (!/^[a-z0-9][a-z0-9_]{1,23}$/.test(handle)) return null;
  return handle;
}
