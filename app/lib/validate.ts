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
  if (!s) return "请填写 handle";
  if (!/^[a-z0-9][a-z0-9_]{1,23}$/.test(s))
    return "handle 只能用小写字母、数字和下划线，2–24 位，且以字母或数字开头";
  if (RESERVED.has(s)) return "这个 handle 被系统保留了，换一个";
  return null;
}

export function checkDisplayName(v: string): string | null {
  const s = v.trim();
  if (!s) return "请填写显示名称";
  if (s.length > 60) return "名称最多 60 个字符";
  return null;
}

export function cleanUrl(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  if (!/^(https?:)?\/\/[^\s]+$/.test(s) && !/^[\w.-]+\.[a-z]{2,}[/\-._~:?#@!$&'()*+,;=%]*$/i.test(s))
    return "链接格式不对";
  return s.startsWith("http") ? s : `https://${s.replace(/^\/\//, "")}`;
}

export function clamp(v: string, max: number): string {
  return v.trim().slice(0, max);
}
