import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  AudioLines,
  Bot,
  Boxes,
  Check,
  ChevronRight,
  CircleDot,
  FileSearch,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Radio,
  Search,
  ServerCog,
  Sparkles,
  Workflow,
} from "lucide-react";
import { cn } from "~/lib/cn";
import { Avatar, CoverArt } from "./media";
import { PersonCard, ProjectCard, FeedCard } from "./cards";
import { PostBody } from "./post-body";
import { AnimatedBackground } from "./motion/animated-background";
import { SlidingNumber } from "./motion/sliding-number";
import { Spotlight } from "./motion/spotlight";
import { Tilt } from "./motion/tilt";
import { InView } from "./motion/in-view";
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogContainer,
  MorphingDialogClose,
  MorphingDialogTitle,
} from "./motion/morphing-dialog";
import { Marquee } from "./magicui/marquee";
import { BorderBeam } from "./magicui/border-beam";
import { Terminal, TypingAnimation, AnimatedSpan } from "./magicui/terminal";
import { fireLikeBurst } from "~/lib/burst";
import type { FeedPostRow, PersonRow, ProjectCardRow } from "~/lib/queries.server";

const DIRECTIONS = [
  {
    label: "Agent 编排",
    desc: "接企业工单、Webhook 与多步工具调用",
    to: "/discover?q=Agent",
    icon: Bot,
    color: "#6ca3e0",
  },
  {
    label: "RAG 检索",
    desc: "把散落的文档接到一个带出处的入口",
    to: "/discover?q=RAG",
    icon: FileSearch,
    color: "#10b981",
  },
  {
    label: "语音与实时交互",
    desc: "转写、断句、延迟优化与实时问答",
    to: "/discover?q=语音",
    icon: AudioLines,
    color: "#f59e0b",
  },
  {
    label: "私有化部署",
    desc: "把模型与向量库落进客户内网",
    to: "/discover?q=私有部署",
    icon: ServerCog,
    color: "#8f6fdb",
  },
  {
    label: "工作流自动化",
    desc: "让重复的流程自己跑完并留下记录",
    to: "/discover?q=自动化",
    icon: Workflow,
    color: "#0ea5e9",
  },
  {
    label: "评估与可观测性",
    desc: "看清一次调用哪里慢、哪里错",
    to: "/discover?q=评估",
    icon: Radio,
    color: "#f43f5e",
  },
  {
    label: "开源工具",
    desc: "把可复用的那一小块公开出来",
    to: "/discover?q=开源",
    icon: Boxes,
    color: "#4e6b3c",
  },
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
  const [tab, setTab] = useState<PreviewTab>("terminal");
  const [touched, setTouched] = useState(false);

  //Auto-rotate until the visitor takes control.
  useEffect(() => {
    if (touched) return;
    const timer = window.setInterval(() => {
      setTab((current) =>
        current === "terminal" ? "square" : current === "square" ? "portfolio" : "terminal",
      );
    }, 6000);
    return () => window.clearInterval(timer);
  }, [touched]);

  const choose = (id: PreviewTab) => {
    setTouched(true);
    setTab(id);
  };

  return (
    <div className="overflow-x-hidden pb-10">
      {/* ── Hero: alive within one second ─────────────────────────── */}
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
          </div>

          {/* interactive three-state stage */}
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <AnimatedBackground
                defaultValue="terminal"
                onValueChange={(id) => id && choose(id as PreviewTab)}
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
              {!touched && (
                <span className="micro-mono ml-auto hidden sm:inline">自动演示中</span>
              )}
            </div>

            <Tilt rotationFactor={7} className="[perspective:1200px]">
              <div className="surface-panel relative min-h-[380px] overflow-hidden p-5 [transform-style:preserve-3d]">
                <BorderBeam
                  size={140}
                  duration={8}
                  borderWidth={1.8}
                  colorFrom="#38bdf8"
                  colorTo="#c4b5fd"
                />
                <Spotlight
                  size={300}
                  className="opacity-90"
                  fill="radial-gradient(circle at center, rgba(56,189,248,0.22), rgba(167,139,250,0.14) 45%, transparent 72%)"
                />
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
      </section>

      {/* ── search, integrated right under the hero ───────────────── */}
      <section className="mt-12">
        <div className="relative mx-auto max-w-[760px]">
          <BorderBeam size={70} duration={11} borderWidth={1.2} colorFrom="#6ca3e0" colorTo="#f59e0b" />
          <form method="get" action="/discover" className="relative">
            <div className="search-shell !min-h-[68px] !rounded-[22px]">
              <span className="text-[var(--color-faint)]" aria-hidden>
                <Search size={19} strokeWidth={1.65} />
              </span>
              <input
                name="q"
                placeholder="找 FDE：Agent、语音、私有部署"
                aria-label="搜索 FDE"
                className="!text-[16px]"
              />
              <button className="btn btn-primary btn-sm !h-[46px] !px-7 shrink-0">搜索</button>
            </div>
          </form>
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
      </section>

      {/* ── rich direction cards, Contra-style band ───────────────── */}
      <section className="mt-14">
        <div className="mb-5 flex items-end justify-between gap-4">
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
          <Marquee pauseOnHover className="[--duration:48s]">
            {DIRECTIONS.map((d) => {
              const Icon = d.icon;
              return (
                <Link
                  key={d.label}
                  to={d.to}
                  className="group relative flex w-[260px] shrink-0 flex-col gap-2 rounded-[14px] border border-[var(--color-line)] bg-white p-4 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
                >
                  <span
                    className="grid h-10 w-10 place-items-center rounded-[10px]"
                    style={{ background: `${d.color}18`, color: d.color }}
                  >
                    <Icon size={18} strokeWidth={1.65} aria-hidden />
                  </span>
                  <span className="flex items-center gap-2 text-[14px] font-semibold">
                    {d.label}
                    <ArrowUpRight
                      size={14}
                      strokeWidth={1.65}
                      className="ml-auto text-[var(--color-faint)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                  <span className="line-clamp-2 text-[12px] leading-relaxed text-[var(--color-ink-soft)]">
                    {d.desc}
                  </span>
                </Link>
              );
            })}
          </Marquee>
        </div>
      </section>

      {/* ── obsidian gallery theatre: real work or live samples ───── */}
      <ObsidianTheatre projects={projects} />

      {people.length > 0 && (
        <section className="mt-16">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="section-title">正在现场的人</h2>
            <Link to="/discover" className="text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              全部 FDE →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {people.slice(0, 3).map((p) => (
              <div key={p.id} className="surface-panel px-3 py-1">
                <PersonCard person={p} />
              </div>
            ))}
            {people.length < 3 && <ClaimHandleCard />}
          </div>
        </section>
      )}
      {people.length === 0 && (
        <section className="mt-16">
          <h2 className="section-title mb-5">正在现场的人</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ClaimHandleCard />
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
        <h2 className="text-[32px] font-semibold tracking-[-0.03em] text-white">先把自己放上来。</h2>
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
      <div className="min-h-0 flex-1 overflow-hidden rounded-[10px] bg-[#0d1117] p-3">
        <Terminal className="!max-h-none !max-w-none !rounded-none !border-0 !bg-transparent !p-0 font-mono !text-[11px] leading-[1.8]">
          <AnimatedSpan className="text-emerald-400">
            <Check size={12} className="mr-1 inline" /> 读取工作区 · 12 个文件
          </AnimatedSpan>
          <AnimatedSpan delay={600} className="text-sky-300">
            构建 RAG 索引 · 2,481 条向量
          </AnimatedSpan>
          <AnimatedSpan delay={1200} className="text-amber-300">
            连接 Zendesk webhook · 意图分类就绪
          </AnimatedSpan>
          <AnimatedSpan delay={1800} className="text-emerald-400">
            <Check size={12} className="mr-1 inline" /> 部署完成 · 首响 420ms
          </AnimatedSpan>
          <TypingAnimation delay={2400} className="text-slate-300">
            $ curl -X POST /api/ticket/route -d @sample.json
          </TypingAnimation>
          <AnimatedSpan delay={3800} className="text-sky-300">
            {"{ \"intent\": \"billing\", \"queue\": \"L2\", \"confidence\": 0.94 }"}
          </AnimatedSpan>
        </Terminal>
      </div>
    </div>
  );
}

function SquarePreview({ post }: { post?: FeedPostRow }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(24);
  const btnRef = useRef<HTMLButtonElement>(null);

  function like() {
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    if (next) fireLikeBurst(btnRef.current);
  }

  const body = post?.body ?? "把工单 Agent 接上了真实流量，下一步压首响。#RAG";

  return (
    <div className="flex h-[330px] flex-col">
      <div className="mb-3 flex items-center gap-2 border-b border-[var(--color-line)] pb-2">
        <span className="rounded-full bg-[var(--color-ink)] px-2.5 py-1 text-[10.5px] font-medium text-white">全站最新</span>
        <span className="text-[10.5px] text-[var(--color-muted)]">关注</span>
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
          ref={btnRef}
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
        <span className="flex items-center gap-1 text-[12px] text-[var(--color-muted)]"><MessageCircle size={16} strokeWidth={1.65} aria-hidden /> 8</span>
        <span className="flex items-center gap-1 text-[12px] text-[var(--color-muted)]"><Repeat2 size={16} strokeWidth={1.65} aria-hidden /> 5</span>
        <span className="flex items-center gap-1 text-[12px] text-[var(--color-muted)]"><Bookmark size={16} strokeWidth={1.65} aria-hidden /></span>
      </div>
    </div>
  );
}

/* ── obsidian gallery: live miniature product previews ──────────────── */

const SAMPLES = [
  { seed: "sample-agent", title: "会议转写与纪要 Agent", kind: "Agent", skills: ["语音转写", "Agent"], summary: "接飞书录制，自动分段去口头禅，产出可检索纪要。" },
  { seed: "sample-rag", title: "企业文档 RAG 检索", kind: "项目", skills: ["RAG", "检索"], summary: "把散落的 PDF 与 Wiki 接到同一个入口，回答带出处。" },
  { seed: "sample-deploy", title: "私有部署工具链", kind: "工具", skills: ["私有部署", "DevOps"], summary: "一套脚本把模型与向量库落到客户内网，可离线运行。" },
] as const;

function ObsidianTheatre({ projects }: { projects: ProjectCardRow[] }) {
  const hasReal = projects.length > 0;
  return (
    <section className="obsidian-band relative mt-16 overflow-hidden rounded-[28px] px-6 py-14 sm:px-10">
      <div className="relative z-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] tracking-[1.2px] text-white/70 uppercase">
              {hasReal ? "现场作品" : "形态预览 · 示例作品"}
            </span>
            <h2 className="mt-4 text-[30px] font-semibold tracking-[-0.03em] text-white">
              {hasReal ? "他们真的把它跑起来了" : "作品页长什么样"}
            </h2>
            <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-white/60">
              {hasReal
                ? "项目、Agent、自动化流程。每一条都由作者本人写下。"
                : "下面三张是会自己动的微型产品界面，展示 FDE 如何呈现证据与过程。它们不是任何真实用户的作品。"}
            </p>
          </div>
          <Link
            to="/new/project"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-[14px] font-semibold text-[#0e1117] transition hover:bg-white/90"
          >
            {hasReal ? "上传我的作品" : "上传我的第一个作品，占领首页画廊"}{" "}
            <ArrowUpRight size={15} strokeWidth={1.65} aria-hidden />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {hasReal
            ? projects.slice(0, 3).map((p) => (
                <InView key={p.id} once viewOptions={{ amount: 0.15 }}>
                  <div className="on-dark rounded-[16px] border border-white/12 bg-white/5 p-3">
                    <ProjectCard project={p} />
                  </div>
                </InView>
              ))
            : SAMPLES.map((s) => (
                <InView key={s.seed} once viewOptions={{ amount: 0.15 }}>
                  <SampleCard sample={s} />
                </InView>
              ))}
        </div>
      </div>
    </section>
  );
}

function SampleCard({ sample }: { sample: (typeof SAMPLES)[number] }) {
  const preview =
    sample.kind === "Agent" ? (
      <WaveformMini />
    ) : sample.kind === "项目" ? (
      <RagMini />
    ) : (
      <DeployMini />
    );

  return (
    <MorphingDialog transition={{ type: "spring", stiffness: 260, damping: 28 }}>
      <MorphingDialogTrigger className="group block w-full overflow-hidden rounded-[16px] border border-white/12 bg-[#151a22] text-left">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Spotlight
            size={240}
            fill="radial-gradient(circle at center, rgba(255,255,255,0.18), rgba(56,189,248,0.12) 45%, transparent 72%)"
          />
          <div className="relative z-10 h-full w-full">{preview}</div>
          <span className="frost absolute left-3 top-3 z-20 rounded-full border border-white/50 px-2.5 py-1 font-mono text-[10px] text-[#14171f]">
            {sample.kind}
          </span>
          <span className="frost absolute right-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-full border border-white/50 text-[#14171f] opacity-0 transition group-hover:opacity-100">
            <ArrowUpRight size={14} strokeWidth={1.65} aria-hidden />
          </span>
        </div>
        <div className="p-4">
          <h3 className="text-[15px] font-semibold text-white">{sample.title}</h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-white/60">{sample.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sample.skills.map((sk) => (
              <span key={sk} className="rounded-full border border-white/15 px-2 py-0.5 text-[10.5px] text-white/70">
                {sk}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
            <Avatar name={sample.title} size={22} />
            <span className="text-[11.5px] text-white/70">作者本人填写 · 未经平台核实</span>
          </div>
        </div>
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent className="w-[min(94vw,720px)] overflow-hidden rounded-[18px] bg-[#151a22]">
          <div className="aspect-[16/10] w-full">{preview}</div>
          <div className="flex items-center justify-between gap-4 p-4">
            <MorphingDialogTitle className="text-[15px] font-semibold text-white">{sample.title}</MorphingDialogTitle>
            <MorphingDialogClose className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/80 transition hover:bg-white/10">
              <span aria-hidden>✕</span>
            </MorphingDialogClose>
          </div>
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}

function WaveformMini() {
  const bars = [12, 26, 18, 34, 22, 40, 16, 30, 20, 36, 14, 28, 24, 38, 18, 32];
  return (
    <div className="flex h-full flex-col gap-3 bg-[#0b0f15] p-4">
      <div className="flex items-center gap-2 font-mono text-[10px] text-emerald-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> 转写中 · 00:42
      </div>
      <div className="flex h-14 items-center gap-[3px]">
        {bars.map((h, i) => (
          <motion.span
            key={i}
            className="flex-1 rounded-full bg-emerald-400/60"
            animate={{ height: [`${h * 0.5}%`, `${h}%`, `${h * 0.6}%`] }}
            transition={{ duration: 1.1 + (i % 4) * 0.2, repeat: Infinity, repeatType: "mirror" }}
          />
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, repeat: Infinity, repeatType: "reverse" }}
        className="rounded-[8px] border border-emerald-400/25 bg-emerald-400/8 px-3 py-2 text-[11px] leading-relaxed text-emerald-200"
      >
        ✓ 待办：下周三前回传部署文档 · 00:38
      </motion.div>
    </div>
  );
}

function RagMini() {
  const quotes = ["[来源 #1] 产品手册 p.12", "[来源 #2] 内部 Wiki · 部署章节", "[来源 #3] API 文档 v2"];
  return (
    <div className="flex h-full flex-col gap-2 bg-[#0b0f15] p-4">
      <div className="self-start rounded-[10px] rounded-tl-sm bg-sky-500/15 px-3 py-2 text-[11px] text-sky-200">
        私有部署支持离线运行吗？
      </div>
      {quotes.map((q, i) => (
        <motion.div
          key={q}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.5, duration: 0.35, repeat: Infinity, repeatDelay: 2.2 }}
          className="rounded-[8px] border border-sky-400/20 bg-sky-400/8 px-3 py-1.5 font-mono text-[10px] text-sky-300"
        >
          {q}
        </motion.div>
      ))}
    </div>
  );
}

function DeployMini() {
  return (
    <div className="flex h-full flex-col gap-3 bg-[#0b0f15] p-4">
      <div className="flex items-center gap-2 font-mono text-[10px] text-violet-300">
        <CircleDot size={12} /> cluster · 3/3 healthy
      </div>
      {["gateway", "vector-db", "model-runner"].map((name, i) => (
        <div key={name} className="flex items-center gap-3 rounded-[8px] border border-white/10 bg-white/4 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="flex-1 font-mono text-[10.5px] text-white/70">{name}</span>
          <motion.span
            className="font-mono text-[10px] text-violet-300"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2 + i * 0.3, repeat: Infinity }}
          >
            {18 + i * 7}ms
          </motion.span>
        </div>
      ))}
    </div>
  );
}

function ClaimHandleCard() {
  return (
    <div className="group relative overflow-hidden rounded-[14px] border border-dashed border-[var(--color-line)] bg-[var(--color-paper)] p-4">
      <Spotlight size={220} />
      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
        <div>
          <Sparkles size={20} strokeWidth={1.65} className="text-[var(--color-ink-soft)]" aria-hidden />
          <p className="mt-3 text-[14px] font-semibold">认领你的 imfde.ai/@handle</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-ink-soft)]">
            一个能被搜索、被分享的稳定地址。填一个 handle 就能开始。
          </p>
        </div>
        <Link to="/join" className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition hover:opacity-70">
          免费建主页 <ChevronRight size={14} strokeWidth={1.65} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
