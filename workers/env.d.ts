/** Cloudflare bindings, mirroring wrangler.jsonc. */
export interface Env {
  DB: D1Database;
  /** Static asset binding; used to serve byte-range responses for /videos/*.mp4. */
  ASSETS: Fetcher;
  /** HMAC key for the session cookie. `wrangler secret put SECRET_KEY`. */
  SECRET_KEY?: string;
}
