import type { Route } from "./+types/actions-radar-sync";
import { runRadarJob } from "~/lib/radar.server";

/**
 * Manual trigger for the hourly radar, used to verify a deployment. POST only,
 * guarded by RADAR_CRON_SECRET. With no secret configured the route always
 * refuses, so it cannot be abused on a fresh install.
 */
export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
  }
  const secret = context.cloudflare.env.RADAR_CRON_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "RADAR_CRON_SECRET 未配置" }, { status: 503 });
  }
  const auth = request.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "未授权" }, { status: 401 });
  }
  const result = await runRadarJob(context.cloudflare.env);
  return Response.json({ ok: true, ...result });
}
