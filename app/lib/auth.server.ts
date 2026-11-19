import type { AppLoadContext } from "react-router";
import { secretKey } from "./db.server";

const COOKIE = "imfde_session";
const SESSION_DAYS = 30;

/* ── encoding helpers ─────────────────────────────────────────── */

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ── password hashing (PBKDF2-SHA256) ─────────────────────────── */

const PBKDF2_ITERATIONS = 100_000;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveBits(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64url(salt)}$${b64url(key)}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1000) return false;
  const salt = fromB64url(parts[2]);
  const expected = fromB64url(parts[3]);
  const actual = new Uint8Array(
    await deriveBits(password, salt, iterations),
  );
  if (actual.length !== expected.length) return false;
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

async function deriveBits(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<ArrayBuffer> {
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    material,
    256,
  );
}

/* ── signed session cookie ────────────────────────────────────── */

async function hmac(context: AppLoadContext, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secretKey(context)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(sig);
}

export async function createSessionCookie(
  context: AppLoadContext,
  userId: string,
): Promise<string> {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${expires}`;
  const sig = await hmac(context, payload);
  const value = `${payload}.${sig}`;
  return serializeCookie(COOKIE, value, expires);
}

export async function readSession(
  context: AppLoadContext,
  request: Request,
): Promise<string | null> {
  const raw = parseCookie(request.headers.get("Cookie") ?? "", COOKIE);
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresStr, sig] = parts;
  if (!userId || !expiresStr || !sig) return null;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || expires < Date.now()) return null;
  const expected = await hmac(context, `${userId}.${expiresStr}`);
  if (!timingSafeEqual(expected, sig)) return null;
  return userId;
}

export function clearSessionCookie(): string {
  return serializeCookie(COOKIE, "", 0);
}

function serializeCookie(name: string, value: string, expiresMs: number): string {
  const expires =
    expiresMs === 0 ? "Thu, 01 Jan 1970 00:00:00 GMT" : new Date(expiresMs).toUTCString();
  return [
    `${name}=${value}`,
    `Path=/`,
    `Expires=${expires}`,
    `Max-Age=${expiresMs === 0 ? 0 : Math.floor((expiresMs - Date.now()) / 1000)}`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Secure`,
  ].join("; ");
}

function parseCookie(header: string, name: string): string | null {
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
