import type { Route } from "./+types/actions-seed-sim";
import { runSeedSimulation } from "~/lib/seed-sim.server";

/** Manual force trigger for the seed persona simulation. POST + shared secret. */
export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
  }
  const secret = context.cloudflare.env.RADAR_CRON_SECRET;
  if (!secret) return Response.json({ ok: false, error: "RADAR_CRON_SECRET 未配置" }, { status: 503 });
  if ((request.headers.get("Authorization") ?? "") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "未授权" }, { status: 401 });
  }
  const result = await runSeedSimulation(context.cloudflare.env, { force: true });
  return Response.json({ ok: true, ...result });
}
