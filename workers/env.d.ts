/** Cloudflare bindings, mirroring wrangler.jsonc. */
export interface Env {
  DB: D1Database;
  /** Static asset binding; used to serve byte-range responses for /videos/*.mp4. */
  ASSETS: Fetcher;
  /** HMAC key for the session cookie. `wrangler secret put SECRET_KEY`. */
  SECRET_KEY?: string;
  /** Cloudflare Workers AI, used only by the scheduled radar job. */
  AI?: Ai;
  /** Optional OpenAI-compatible endpoint; falls back to Workers AI. */
  LLM_API_KEY?: string;
  LLM_BASE_URL?: string;
  LLM_MODEL?: string;
  /** Optional GitHub token for a higher Search API rate limit. */
  GITHUB_TOKEN?: string;
  /** Shared secret for the manual POST /actions/radar-sync trigger. */
  RADAR_CRON_SECRET?: string;
  /** Set to "0" to disable hourly seed simulation. */
  SEED_SIM_ENABLED?: string;
}
