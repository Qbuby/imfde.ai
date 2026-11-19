import type { AppLoadContext } from "react-router";

/**
 * D1 access. Every query in the app goes through here so the binding is
 * resolved in exactly one place and loaders stay readable.
 */
export function db(context: AppLoadContext): D1Database {
  return context.cloudflare.env.DB;
}

export function secretKey(context: AppLoadContext): string {
  return context.cloudflare.env.SECRET_KEY ?? "dev-only-insecure-secret-key";
}

export type Row = Record<string, unknown>;

export async function one<T = Row>(
  context: AppLoadContext,
  sql: string,
  ...params: unknown[]
): Promise<T | null> {
  return db(context)
    .prepare(sql)
    .bind(...params)
    .first<T>();
}

export async function many<T = Row>(
  context: AppLoadContext,
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const res = await db(context)
    .prepare(sql)
    .bind(...params)
    .all<T>();
  return res.results ?? [];
}

export async function run(
  context: AppLoadContext,
  sql: string,
  ...params: unknown[]
): Promise<D1Result> {
  return db(context)
    .prepare(sql)
    .bind(...params)
    .run();
}

/** Batch several writes atomically-ish in one round trip. */
export async function batch(
  context: AppLoadContext,
  statements: D1PreparedStatement[],
): Promise<D1Result[]> {
  if (!statements.length) return [];
  return db(context).batch(statements);
}

export function stmt(
  context: AppLoadContext,
  sql: string,
  ...params: unknown[]
): D1PreparedStatement {
  return db(context)
    .prepare(sql)
    .bind(...params);
}
