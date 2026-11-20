import { useRef, useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUpRight,
  Check,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/cn";
import { Avatar, CoverArt } from "./media";
import { PersonCard, ProjectCard, FeedCard } from "./cards";
import { AnimatedBackground } from "./motion/animated-background";
import { SlidingNumber } from "./motion/sliding-number";
import { Spotlight } from "./motion/spotlight";
import { Tilt } from "./motion/tilt";
import { InView } from "./motion/in-view";
import { Marquee } from "./magicui/marquee";
import { BorderBeam } from "./magicui/border-beam";
import { Terminal, TypingAnimation, AnimatedSpan } from "./magicui/terminal";
import { Confetti, type ConfettiRef } from "./magicui/confetti";
import type {
  FeedPostRow,
  PersonRow,
  ProjectCardRow,
} from "~/lib/queries.server";
import { PostBody } from "./post-body";

const DIRECTIONS = [
  { label: "Agent 编排", to: "/discover?skill=Agent", color: "#6ca3e0" },
  { label: "RAG 检索", to: "/discover?skill=RAG", color: "#10b981" },
  { label: "语音交互", to: "/discover?skill=语音", color: "#f59e0b" },
  { label: "私有部署", to: "/discover?skill=私有部署", color: "#8f6fdb" },
  { label: "工作流自动化", to: "/discover?skill=自动化", color: "#0ea5e9" },
  { label: "评估与可观测性", to: "/discover?skill=评估", color: "#f43f5e" },
  { label: "开源工具", to: "/discover?skill=开源", color: "#4e6b3c" },
];

type PreviewTab = "portfolio" | "terminal" | "square";

export function Landing({
  projects,
  people,
  posts,
}: {
  projects: ProjectCardRow[];
  people: PersonRow[];
  posts: FeedPostRow[];
}) {
  const [tab, setTab] = useState<PreviewTab>("portfolio");

  return (
    <div className="overflow-x-hidden pb-10">
      {/* ── Hero: one orchestrated moment, then quiet ──────────────── */}
      <section className="hero-glow dot-grid relative pt-10 sm:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/80 px-3 py-1.5 text-[12px] text-[var(--color-ink-soft)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-repost)] opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-repost)]" />
              </span>
              FDE 的主页、作品集与专业网络
            </span>

            <h1 className="display mt-6 max-w-[600px] text-[clamp(42px,5.2vw,68px)]">
              你的作品，
              <br />
              值得被找到。
            </h1>
            <p className="lead mt-6 max-w-[480px]">
              把散落在 GitHub、LinkedIn 和聊天记录里的证据，集中到一个能被搜索、能被分享的地址。
              不做交易撮合，不合成信用分，只展示可观察的事实。
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/join" className="btn btn-primary sweep !h-[54px] !px-7">
                免费建主页
              </Link>
              <Link to="/feed" className="btn btn-ghost !h-[54px] !px-7">
                逛 FDE 广场 <ArrowUpRight size={16} strokeWidth={1.65} aria-hidden />
              </Link>
            </div>
            <p className="mt-8 font-mono text-[10.5px] tracking-[0.14em] text-[var(--color-faint)] uppercase">
              不经手交易 · 不做信用分 · 只展示可观察的信息
            </p>
          </div>

          {/* interactive three-state stage */}
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <AnimatedBackground
                defaultValue="portfolio"
                onValueChange={(id) => id && setTab(id as PreviewTab)}
                className="rounded-full bg-[var(--color-ink)]"
              >
                {([
                  ["portfolio", "作品集"],
                  ["terminal", "Agent 部署"],
                  ["square", "实时广场"],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    data-id={id}
                    type="button"
                    className="rounded-full px-3 py-1.5 text-[11.5px] font-medium text-[var(--color-ink-soft)] transition-colors data-[checked=true]:text-white"
                  >
                    {label}
                  </button>
                ))}
              </AnimatedBackground>
            </div>

            <div className="relative overflow-hidden rounded-[18px]">
              <BorderBeam
                size={90}
                duration={9}
                colorFrom="#6ca3e0"
                colorTo="#f59e0b"
                borderWidth={1.2}
              />
              <Tilt rotationFactor={4} className="relative">
                <div className="surface-panel relative min-h-[380px] overflow-hidden p-5">
                  <Spotlight size={260} className="text-[var(--color-ink)]/6" />
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={tab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                      className="relative z-10"
                    >
                      {tab === "portfolio" && <PortfolioPreview projects={projects} />}
                      {tab === "terminal" && <TerminalPreview />}
                      {tab === "square" && <SquarePreview post={posts[0]} />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </Tilt>
            </div>
          </div>
        </div>
      </section>

      {/* ── hot directions: continuous, hover-pausable ─────────────── */}
      <section className="mt-16">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[1.3px] text-[var(--color-ink-soft)] uppercase">
              现场方向
            </p>
            <h2 className="section-title mt-1">大家正在做什么</h2>
          </div>
          <Link to="/discover" className="hidden text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] sm:block">
            全部方向 →
          </Link>
        </div>
        <div className="overflow-hidden">
        <Marquee pauseOnHover className="[--duration:36s]">
          {DIRECTIONS.map((d) => (
            <Link
              key={d.label}
              to={d.to}
              className="group flex shrink-0 items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-4 py-2.5 text-[13px] font-medium transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
              {d.label}
              <ArrowUpRight size={13} strokeWidth={1.65} className="text-[var(--color-faint)]" aria-hidden />
            </Link>
          ))}
        </Marquee>
        </div>
      </section>

      {/* ── search ─────────────────────────────────────────────────── */}
      <section className="mt-14">
        <form method="get" action="/discover" className="mx-auto max-w-[680px]">
          <div className="search-shell">
            <span className="text-[var(--color-faint)]" aria-hidden>
              <SearchIcon />
            </span>
            <input name="q" placeholder="找 FDE：Agent、语音、私有部署" aria-label="搜索 FDE" />
            <button className="btn btn-primary btn-sm !h-[44px] !px-6 shrink-0">搜索</button>
          </div>
          {people.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              {people.slice(0, 4).map((p) => (
                <Link key={p.id} to={`/@${p.handle}`} className="chip hover:bg-[var(--color-sunken-deep)]">
                  {p.display_name}
                </Link>
              ))}
            </div>
          )}
        </form>
      </section>

      {/* ── real work, or honestly labelled samples on a cold start ── */}
      {projects.length > 0 ? (
        <section className="mt-16">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="section-title">最近有人在做的</h2>
            <Link to="/discover/projects" className="text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              全部作品 →
            </Link>
          </div>
          <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
            {projects.slice(0, 4).map((p) => (
              <InView key={p.id} once viewOptions={{ amount: 0.2 }}>
                <ProjectCard project={p} />
              </InView>
            ))}
          </div>
        </section>
      ) : (
        <SampleGallery />
      )}

      {people.length > 0 && (
        <section className="mt-16">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="section-title">正在现场的人</h2>
            <Link to="/discover" className="text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              全部 FDE →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((p) => (
              <div key={p.id} className="surface-panel px-3 py-1">
                <PersonCard person={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="mt-16">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="section-title">最新现场动态</h2>
            <Link to="/feed" className="text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              进入广场 →
            </Link>
          </div>
          <div className="surface-panel px-4">
            {posts.slice(0, 4).map((post) => (
              <FeedCard key={post.id} post={post} showFollow={false} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-16 overflow-hidden rounded-[18px] bg-[var(--color-ink)] px-6 py-14 text-center sm:px-10">
        <h2 className="text-[32px] font-semibold tracking-[-0.03em] text-white">
          先把自己放上来。
        </h2>
        <p className="mx-auto mt-2.5 max-w-[460px] text-[15px] leading-relaxed text-white/65">
          注册不需要认证。填一个 handle，写一句话，贴一个作品，就足够开始了。
        </p>
        <Link to="/join" className="btn mt-7 bg-white text-[var(--color-ink)] hover:bg-white/90">
          免费建主页
        </Link>
      </section>
    </div>
  );
}

/* ── preview states ──────────────────────────────────────────────────── */

function PortfolioPreview({ projects }: { projects: ProjectCardRow[] }) {
  const covers = projects.slice(0, 3);
  return (
    <div className="grid h-[330px] grid-cols-[140px_minmax(0,1fr)] gap-4">
      <div>
        <div className="overflow-hidden rounded-[10px]">
          <CoverArt seed="preview-cover" aspect="2 / 1" photo={false} />
        </div>
        <div className="-mt-6 px-1">
          <Avatar name="林舟" size={46} ring />
          <p className="mt-2 text-[13px] font-semibold">林舟</p>
          <p className="micro-mono">@linzhou</p>
        </div>
        <p className="mt-2 text-[10.5px] leading-relaxed text-[var(--color-ink-soft)]">
          把企业系统接到大模型上的 FDE
        </p>
      </div>
      <div className="min-w-0">
        <p className="mb-2 font-mono text-[9.5px] tracking-[1px] text-[var(--color-ink-soft)] uppercase">作品集</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2 overflow-hidden rounded-[10px] border border-[var(--hairline)]">
            <CoverArt seed={covers[0]?.slug ?? "preview-hero"} src={covers[0]?.cover_url} aspect="16 / 7" />
            <div className="bg-white px-2.5 py-2">
              <p className="truncate text-[11.5px] font-semibold">{covers[0]?.title ?? "工单自动归档 Agent"}</p>
              <p className="mt-0.5 truncate text-[10px] text-[var(--color-faint)]">
                {covers[0]?.summary ?? "接 Zendesk webhook，按意图分派"}
              </p>
            </div>
          </div>
          {[0, 1].map((i) => (
            <div key={i} className="overflow-hidden rounded-[10px] border border-[var(--hairline)]">
              <CoverArt seed={covers[i + 1]?.slug ?? `preview-${i}`} src={covers[i + 1]?.cover_url} aspect="4 / 3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TerminalPreview() {
  return (
    <div className="flex h-[330px] flex-col">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[var(--color-repost)]" />
        <span className="font-mono text-[11px] text-[var(--color-ink-soft)]">deploy · agent-rag</span>
        <span className="micro-mono ml-auto">live</span>
      </div>
      <Terminal className="!max-w-none !border-[var(--color-line)] !bg-[#14171f] !text-[12px] text-white/85">
        <AnimatedSpan className="text-emerald-400">
          <Check size={12} className="mr-1 inline" /> 读取工作区 · 12 个文件
        </AnimatedSpan>
        <AnimatedSpan delay={700} className="text-sky-300">
          构建 RAG 索引 · 2,481 条向量
        </AnimatedSpan>
        <AnimatedSpan delay={1400} className="text-amber-300">
          连接 Zendesk webhook · 意图分类就绪
        </AnimatedSpan>
        <AnimatedSpan delay={2100} className="text-emerald-400">
          <Check size={12} className="mr-1 inline" /> 部署完成 · 首响 420ms
        </AnimatedSpan>
        <TypingAnimation delay={2800} className="text-white/70">
          $ curl -X POST /api/ticket/route -d @sample.json
        </TypingAnimation>
        <AnimatedSpan delay={4200} className="text-sky-300">
          {"{ \"intent\": \"billing\", \"queue\": \"L2\", \"confidence\": 0.94 }"}
        </AnimatedSpan>
      </Terminal>
    </div>
  );
}

function SquarePreview({ post }: { post?: FeedPostRow }) {
  const confettiRef = useRef<ConfettiRef>(null);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(24);

  function like() {
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    if (next) {
      void confettiRef.current?.fire({
        particleCount: 8,
        spread: 55,
        startVelocity: 22,
        scalar: 0.7,
        colors: ["#f43f5e", "#f59e0b", "#10b981", "#0ea5e9"],
      });
    }
  }

  const body = post?.body ?? "把工单 Agent 接上了真实流量，下一步压首响。#RAG";

  return (
    <div className="flex h-[330px] flex-col">
      <div className="mb-3 flex items-center gap-2 border-b border-[var(--color-line)] pb-2">
        <span className="rounded-full bg-[var(--color-ink)] px-2.5 py-1 text-[10.5px] font-medium text-white">全站最新</span>
        <span className="text-[10.5px] text-[var(--color-muted)]">关注</span>
        <span className="text-[10.5px] text-[var(--color-muted)]">收藏</span>
      </div>
      <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-2.5">
        <Avatar name={post?.display_name ?? "林舟"} src={post?.avatar_url} size={36} />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold">{post?.display_name ?? "林舟"}</span>
            <span className="micro-mono">@{post?.handle ?? "linzhou"}</span>
          </div>
          <PostBody body={body} className="mt-1.5 text-[11px] leading-relaxed text-[var(--color-ink)]" />
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-[var(--color-line-soft)] pt-3">
        <button
          type="button"
          onClick={like}
          aria-label={liked ? "取消赞" : "赞"}
          aria-pressed={liked}
          className={cn(
            "flex min-h-[34px] items-center gap-1 rounded-full px-2 text-[12px] transition",
            liked ? "text-[var(--color-like)]" : "text-[var(--color-muted)] hover:text-[var(--color-like)]",
          )}
        >
          <Heart size={16} strokeWidth={1.65} fill={liked ? "currentColor" : "none"} className={liked ? "like-pop" : ""} aria-hidden />
          <SlidingNumber value={count} />
        </button>
        <span className="flex items-center gap-1 text-[12px] text-[var(--color-muted)]">
          <MessageCircle size={16} strokeWidth={1.65} aria-hidden /> 8
        </span>
        <span className="flex items-center gap-1 text-[12px] text-[var(--color-muted)]">
          <Repeat2 size={16} strokeWidth={1.65} aria-hidden /> 5
        </span>
        <span className="flex items-center gap-1 text-[12px] text-[var(--color-muted)]">
          <Bookmark size={16} strokeWidth={1.65} aria-hidden />
        </span>
        <button
          type="button"
          aria-label="复制链接"
          onClick={() => {
            void navigator.clipboard?.writeText(window.location.origin + "/feed");
            toast.success("链接已复制");
          }}
          className="grid h-[34px] w-[34px] place-items-center rounded-full text-[var(--color-muted)] transition hover:text-[var(--color-link)]"
        >
          <Link2 size={16} strokeWidth={1.65} aria-hidden />
        </button>
      </div>
      {/* fires only on click; canvas is inert on SSR */}
      <Confetti ref={confettiRef} className="pointer-events-none absolute inset-0 z-20" />
    </div>
  );
}

/* ── cold-start gallery: elegant, honestly labelled samples ─────────── */

function SampleGallery() {
  const samples = [
    { seed: "sample-agent", title: "会议转写与纪要 Agent", summary: "接飞书录制，自动分段、去口头禅、产出可检索纪要。", kind: "Agent", cover: "" },
    { seed: "sample-rag", title: "企业文档 RAG 检索", summary: "把散落的 PDF 与 Wiki 接到同一个入口，回答带出处。", kind: "项目", cover: "/covers/03.webp" },
    { seed: "sample-deploy", title: "私有部署工具链", summary: "一套脚本把模型与向量库落到客户内网，可离线运行。", kind: "工具", cover: "/covers/05.webp" },
  ];
  return (
    <section className="mt-16">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[1.3px] text-[var(--color-ink-soft)] uppercase">画廊示例</p>
          <h2 className="section-title mt-1">精选示范作品</h2>
          <p className="mt-1.5 text-[12.5px] text-[var(--color-faint)]">
            以下是示例，用来展示作品页的形态；尚未对应任何真实用户。
          </p>
        </div>
        <Link to="/new/project" className="btn btn-primary btn-sm">
          上传我的第一个作品
        </Link>
      </div>
      <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
        {samples.map((s) => (
          <InView key={s.seed} once viewOptions={{ amount: 0.2 }}>
            <article className="group">
              <div className="cover-inner-stroke overflow-hidden rounded-[16px] border border-[var(--hairline)]">
                <div className="transition-transform duration-500 ease-out group-hover:scale-[1.05]">
                  <CoverArt seed={s.seed} src={s.cover || null} aspect="4 / 3" />
                </div>
              </div>
              <p className="mt-3 text-[10.5px] font-medium text-[var(--color-ink-soft)]">{s.kind}</p>
              <h3 className="mt-0.5 text-[15px] font-semibold">{s.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">{s.summary}</p>
            </article>
          </InView>
        ))}
      </div>
    </section>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.65" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.65" />
    </svg>
  );
}
