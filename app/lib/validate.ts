/** Validation shared by the auth and editor forms. */

const RESERVED = new Set([
  "discover", "login", "join", "logout", "settings", "projects", "posts",
  "new", "actions", "notifications", "api", "about", "help", "admin", "imfde",
  "feed", "profile", "search", "terms", "privacy",
]);

export function checkEmail(v: string): string | null {
  const s = v.trim();
  if (!s) return "请填写邮箱";
  if (s.length > 254) return "邮箱太长了";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+\.[^@\s]+$/.test(s) && !/^[^@\s]+@[^@\s]+\.\w{2,}$/.test(s))
    return "邮箱格式不对";
  return null;
}

export function checkPassword(v: string): string | null {
  if (!v) return "请填写密码";
  if (v.length < 8) return "密码至少 8 位";
  if (v.length > 200) return "密码太长了";
  return null;
}

export function checkHandle(v: string): string | null {
  const s = v.trim().toLowerCase();
  if (!s) return "请填写 id";
  if (!/^[a-z0-9][a-z0-9_]{1,23}$/.test(s))
    return "id 只能用小写字母、数字和下划线，2–24 位，且以字母或数字开头";
  if (RESERVED.has(s)) return "这个 id 被系统保留了，换一个";
  return null;
}

export function checkDisplayName(v: string): string | null {
  const s = v.trim();
  if (!s) return "请填写显示名称";
  if (s.length > 60) return "名称最多 60 个字符";
  return null;
}

/**
 * URL fields separate "empty" from "wrong" instead of collapsing both into
 * `null`, because the old version returned its error *message* as the value
 * and several callers wrote that string straight into the database.
 *
 * Only http(s) survives — a `javascript:` URL in an avatar field would become
 * a stored XSS the moment someone renders it as a link.
 */
export interface CleanUrlResult {
  value: string | null;
  error: string | null;
}

export function cleanUrl(raw: string): CleanUrlResult {
  const s = raw.trim();
  if (!s) return { value: null, error: null };
  if (s.length > 2048) return { value: null, error: "链接太长了" };

  // scheme-less input ("github.com/me") is assumed to be https
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(s)
    ? s
    : `https://${s.replace(/^\/\//, "")}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { value: null, error: "链接格式不对" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { value: null, error: "只支持 http / https 链接" };
  }
  // a bare word parses as a host ("abc" → https://abc), which is not a link
  if (!parsed.hostname.includes(".")) {
    return { value: null, error: "链接格式不对" };
  }

  return { value: parsed.toString(), error: null };
}

export function clamp(v: string, max: number): string {
  return v.trim().slice(0, max);
}
