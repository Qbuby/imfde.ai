import { createRequestHandler } from "react-router";
import type { Env } from "./env";

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

export default {
  async fetch(request, env, ctx) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
