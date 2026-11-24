import { createRequestHandler } from "react-router";
import type { Env } from "./env";
import { runRadarJob } from "../app/lib/radar.server";
import { runSeedSimulation } from "../app/lib/seed-sim.server";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

// The React Router server build is a plain, platform-agnostic module
// (routes + assets + entry). Wrapping it is all a Worker needs to do.
// @ts-expect-error -- generated at build time, no types published
import * as serverBuild from "../build/server/index.js";

const requestHandler = createRequestHandler(
  () => serverBuild,
  "production",
);

/**
 * Workers static assets answer Range requests with a full 200, which Safari /
 * iOS rejects for <video>. Serve /videos/*.mp4 ourselves with real 206 slices.
 * Fonts, posters and every other asset still fall straight through to ASSETS.
 */
async function serveVideoRange(request: Request, env: Env, url: URL): Promise<Response> {
  if (!url.pathname.endsWith(".mp4")) return env.ASSETS.fetch(request);

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  // Always fetch the clean full file: ASSETS ignores Range anyway, and a
  // cached 200 gives us one slice source for every subsequent range request.
  const assetRes = await env.ASSETS.fetch(new Request(url.toString(), { method: "GET" }));
  if (!assetRes.ok) return assetRes;

  const buf = await assetRes.arrayBuffer();
  const total = buf.byteLength;
  const headers = new Headers({
    "Content-Type": "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  });
  const etag = assetRes.headers.get("ETag");
  if (etag) headers.set("ETag", etag);

  const range = request.headers.get("Range");
  if (!range) {
    headers.set("Content-Length", String(total));
    return new Response(request.method === "HEAD" ? null : buf, { status: 200, headers });
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  let start: number;
  let end: number;
  if (!match) {
    start = 0;
    end = total - 1; // unparseable range -> whole file, 206
  } else if (match[1] === "" && match[2] === "") {
    start = 0;
    end = -1; // bytes=- -> invalid
  } else if (match[1] === "") {
    // bytes=-suffix : the last N bytes (suffix=0 is unsatisfiable)
    const suffix = Number(match[2]);
    start = suffix <= 0 ? 0 : Math.max(0, total - suffix);
    end = suffix <= 0 ? -1 : total - 1;
  } else if (match[2] === "") {
    // bytes=start- : from start to EOF
    start = Number(match[1]);
    end = total - 1;
  } else {
    start = Number(match[1]);
    end = Number(match[2]);
  }

  if (!(start >= 0 && start <= end && end < total)) {
    headers.set("Content-Range", `bytes */${total}`);
    headers.delete("Content-Length");
    return new Response(null, { status: 416, headers });
  }

  headers.set("Content-Range", `bytes ${start}-${end}/${total}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(request.method === "HEAD" ? null : buf.slice(start, end + 1), {
    status: 206,
    headers,
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/videos/")) {
      return serveVideoRange(request, env, url);
    }
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
  // Radar runs hourly; seed simulation runs on the */5 tick with its own D1
  // gate for a genuinely random 5-minute-to-4-hour cadence.
  async scheduled(controller, env, ctx) {
    if (controller.cron === "*/5 * * * *") {
      ctx.waitUntil(runSeedSimulation(env).catch(() => {}));
    } else {
      ctx.waitUntil(runRadarJob(env).catch(() => {}));
    }
  },
} satisfies ExportedHandler<Env>;
