# AGENTS.md — ImFDE 工程与设计约定

给后续接手的人（也包括 AI 代理）的一份最短约束。违反这里任意一条，就等于改变了产品。

## 技术栈

- **React Router v7**（framework 模式，`app/routes.ts` 配置路由，SSR）。
- **Cloudflare Workers + Static Assets**：入口 `workers/app.ts` 包住 `build/server/index.js`。
  不要引入 `@cloudflare/vite-plugin`——它和 `react-router build` 的输出目录会打架。
- **Cloudflare D1（SQLite）**：所有查询走 `app/lib/db.server.ts` 的 `one/many/run/stmt/batch`。
  迁移文件在 `migrations/`，只增不改旧文件。
- **Tailwind CSS v4** + `app/app.css` 中的 `@theme` token。配色只有 X + Contra 两套：
  `--color-canvas(#fff) / --color-surface-subtle(#f7f9f9) / --color-hairline(#eff3f4) /
  --color-border(#e2e5ea) / --color-ink(#0f1419) / --color-ink-soft(#536471) / --color-faint(#8b93a3)`
  与语义互动色（like/repost/link）。不要新增装饰性颜色变量。
- **lucide-react** 图标（`strokeWidth={1.65}`）、**sonner** Toast、**Radix**（popover / dialog / hover-card）、
  **motion**（`motion/react`，根节点 `MotionConfig reducedMotion="user"`）、
  **clsx + tailwind-merge**（`app/lib/cn.ts`）。
  `app/components/motion/` 只保留 `sliding-number.tsx`、`morphing-dialog.tsx` 与工具 `use-click-outside.ts`；
  `app/components/magicui/` 已清空。除此之外不加 UI 依赖，尤其不加图表库或特效库。

## 字体约束

- 字体为 **Onest Variable**（英文/数字/符号，`@fontsource-variable/onest`，Vite 打包）
  \+ **OPPO Sans 4.0**（中文，自托管分片于 `public/fonts/oppo-sans/`，经 `result.css` 的
  `unicode-range` 按需加载，可变字重 100-700）。两者都经 Cloudflare Static Assets 自托管。
  **禁止**改回 Inter / Instrument Sans / Microsoft YaHei 回退，禁止引入 Google Fonts 或任何外部字体 CDN，
  禁止把未切片的完整 `.ttf` 放进 `public/`。真实代码片段与 ⌘K / ESC 快捷键才用 `font-mono`；
  handle、时间戳、计数用 `font-sans tabular-nums`。
- 中文回退顺序：`PingFang SC` → `Hiragino Sans GB` → `Microsoft YaHei`；
  计数、时间戳与 `@handle` 必须保留 `font-variant-numeric: tabular-nums`。

## 文案规范

- 任何 UI 文案、空态、示例数据必须遵守 `imfde-unslop`（`.claude/skills/imfde-unslop/SKILL.md`）：
  功能词优先、平实口语、长短参差；禁止 PRD 免责说教、否定对比句式、三连排比广告句与工整四股文。

## 四条产品红线

1. **不做交易撮合**：没有支付、订单、议价、佣金、成交记录。任何"联系我们成交"的入口都不写。
2. **不做黑箱信用分**：没有等级、评分、能力排行榜、认证徽章。计数只呈现原始事实
   （作品数、关注者、赞数），页面必须说明"平台不合成任何评分"。
3. **信息分层不可模糊**：`本人自述 / 外部链接 / 平台行为` 在数据层就是不同字段，
   展示层也必须分开标注。外部链接一律 `target="_blank" rel="noopener noreferrer nofollow"`。
4. **不引入外部服务依赖**：无图片 CDN、无第三方分析、无邮件服务、无 AI 调用。
   图片放 `public/`，数据只在 D1。

## 前端视觉与交互规范

- **材质**：只有两种语言。X（`/feed`、`/posts/:id`、`/notifications`）：纯白底、
  `1px #eff3f4` 线条网格、3px 滑动下划线 Tab、`#f7f9f9` 无边框无阴影右栏、轻量语义互动反馈。
  Contra（`/`、`/discover*`、`/@handle`、`/projects/:slug`、`/join`、`/login`）：纯白画布、
  零阴影 1px 细线卡片、单层扁平筛选条、干净空状态。
  **禁止**：大块黑底营销区、`Spotlight`/`BorderBeam`/`Tilt`/`Marquee`/`dot-grid`/`hero-glow`/`sweep`、
  胶囊套胶囊筛选栏、全大写英文装饰标、普通内容卡片的 `box-shadow`、虚线空占位大框。
  阴影仅允许：首页主搜索栏、Popover/Dialog/HoverCard 浮层、Toast。动效只服务交互反馈。
- **状态完整**：每个可交互元素要有 Default / Hover / Focus-visible / Active /
  Pending(disabled) 五态。异步提交必须显式禁用并给出"发布中…"一类文案。
- **数字不跳**：所有计数（赞、评论、转发、关注者、作品数）用 `tabular-nums`。
- **热区**：图标按钮最小 32×32，且必须有 `aria-label`。
- **禁止嵌套**：`<a>` 里不能有 `<a>` 或 `<button>`。正文内含 `#话题` 链接的段落，
  外层不能再包 `<Link>`；否则 HTML 解析器会切树，React 报 #418。
- **浮层**：一律用 Radix popover/dialog —— ESC、点击外部、焦点回收都由它处理，
  不要自己写 keydown 监听，也不要用浏览器原生 `confirm()`。
- **动效**：共享元素滑块用 `motion` 的 `layoutId`（`rail-active-pill` / `feed-tab-indicator` /
  `profile-tab-underline`），按钮反馈用 `whileTap`，点赞/转发/收藏用 `useAnimationControls`。
  **SSR 红线**：任何容器都不能在首屏以 `opacity:0` 渲染；`AnimatePresence` 用 `initial={false}`，
  第一个状态必须在服务端就存在。`MotionConfig reducedMotion="user"` 已挂在根节点。
  进场也可复用 `app.css` 的 `pop-in` / `fade-in` / `like-pop`。
- **未登录**：任何写操作（赞/关注/收藏/转发/发帖）在未登录时渲染成
  `<Link to="/login?next=<当前页>">`，不要提交到 `/actions/*` 后靠后端 302。

## 隐私与可见性

三层过滤，缺一不可：

1. 条目自身 `visibility`（`public` / `unlisted` / `private`）。
2. 作者主页 `profiles.visibility = 'private'` → 其作品与动态只对本人可见。
3. `users.status = 'active'`（封禁者内容不出现）。

列表查询统一在 `queries.server.ts` 里用 viewer 参数拼谓词；详情 loader 单独再校验一次。
关联数据（关联作品、被转发原帖）在 JOIN 时就要带可见性条件，让不可见的一方退化成
`null`（渲染占位），而不是先查出来再判断。

## 代码组织

- `app/lib/*.server.ts`：只在服务端运行（session、db、queries）。
- `app/lib/*.ts`：同构工具（`format`、`tags`、`validate`）。
- 查询函数集中在 `queries.server.ts`，避免在 route 里写 SQL。
- 列表页最多 1 条主查询 + 1 条批量附属查询（如标签），不要 N+1。

## 提交前必跑

```bash
npm run db:migrate:local
npm run typecheck     # tsconfig 已 noEmit，不会往 app/ 写 .js
npm run build
```

`.qa/` 下是验证脚本（`e2e.py`、`probe*.py`），改动涉及鉴权/可见性/发帖时请重跑。
