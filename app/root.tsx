import type { Route } from "./+types/root";
import { Link, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "@fontsource-variable/inter";
import "@fontsource-variable/instrument-sans";
import "./app.css";

export const meta: Route.MetaFunction = ({ location }) => {
  const origin = location.pathname;
  return [
    { title: "iMFDE — FDE 的作品集与专业网络" },
    {
      name: "description",
      content:
        "iMFDE 是 FDE 展示自己、分享作品、连接同行的专业网络。建主页、传作品、发动态，让世界看到你能做什么。",
    },
    { property: "og:site_name", content: "iMFDE" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { tagName: "link", rel: "canonical", href: `https://imfde.ai${origin}` },
    { property: "og:image", content: "https://imfde.ai/og.jpg" },
    { name: "twitter:image", content: "https://imfde.ai/og.jpg" },
  ];
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#fcfcfc" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const is404 = typeof error === "object" && error !== null && "status" in error && (error as { status?: number }).status === 404;
  return (
    <div className="min-h-dvh bg-[var(--color-canvas)]">
      <div className="mx-auto max-w-[640px] px-6 py-24 text-center">
        <p className="font-mono text-[13px] tracking-[0.14em] text-[var(--color-muted)] uppercase">
          {is404 ? "404" : "Error"}
        </p>
        <h1 className="mt-4 text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
          {is404 ? "这个页面不存在" : "出了一点问题"}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
          {is404
            ? "链接可能已经失效，或者这个 FDE 已经改了 handle。"
            : "我们已经记录，稍后再试一次。"}
        </p>
        <Link
          to="/discover"
          className="mt-8 inline-flex h-11 items-center rounded-full bg-[var(--color-ink)] px-6 text-[14px] font-medium text-white transition hover:opacity-85"
        >
          去发现 FDE
        </Link>
      </div>
    </div>
  );
}
