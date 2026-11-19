/** Cloudflare bindings, mirroring wrangler.jsonc. */
export interface Env {
  DB: D1Database;
  /** HMAC key for the session cookie. `wrangler secret put SECRET_KEY`. */
  SECRET_KEY?: string;
}
