# AGENTS.md — iMFDE 工程与设计约定

给后续接手的人（也包括 AI 代理）的一份最短约束。违反这里任意一条，就等于改变了产品。

## 技术栈

- **React Router v7**（framework 模式，`app/routes.ts` 配置路由，SSR）。
- **Cloudflare Workers + Static Assets**：入口 `workers/app.ts` 包住 `build/server/index.js`。
  不要引入 `@cloudflare/vite-plugin`——它和 `react-router build` 的输出目录会打架。
- **Cloudflare D1（SQLite）**：所有查询走 `app/lib/db.server.ts` 的 `one/many/run/stmt/batch`。
  迁移文件在 `migrations/`，只增不改旧文件。
- **Tailwind CSS v4** + `app/app.css` 中的 `@theme` token。不要新增颜色变量，
  除非它确实属于现有体系（`--color-canvas / paper / sunken / ink / ink-soft / muted / faint / line`）。
- **lucide-react** 图标（`strokeWidth={1.65}`）、**sonner** Toast、**Radix**（popover / dialog）。
  除此之外不加 UI 依赖，尤其不加动画/图表库。

## 四条产品红线

1. **不做交易撮合**：没有支付、订单、议价、佣金、成交记录。任何"联系我们成交"的入口都不写。
2. **不做黑箱信用分**：没有等级、评分、能力排行榜、认证徽章。计数只呈现原始事实
   （作品数、关注者、赞数），页面必须说明"平台不合成任何评分"。
3. **信息分层不可模糊**：`本人自述 / 外部链接 / 平台行为` 在数据层就是不同字段，
   展示层也必须分开标注。外部链接一律 `target="_blank" rel="noopener noreferrer nofollow"`。
4. **不引入外部服务依赖**：无图片 CDN、无第三方分析、无邮件服务、无 AI 调用。
   图片放 `public/`，数据只在 D1。

## 前端视觉与交互规范

- **克制**：白底 / 浅灰 / 深墨，细边框 `#e3e5ea`。禁止彩虹渐变、霓虹、重阴影、玻璃拟态。
- **状态完整**：每个可交互元素要有 Default / Hover / Focus-visible / Active /
  Pending(disabled) 五态。异步提交必须显式禁用并给出"发布中…"一类文案。
- **数字不跳**：所有计数（赞、评论、转发、关注者、作品数）用 `tabular-nums`。
- **热区**：图标按钮最小 32×32，且必须有 `aria-label`。
- **禁止嵌套**：`<a>` 里不能有 `<a>` 或 `<button>`。正文内含 `#话题` 链接的段落，
  外层不能再包 `<Link>`；否则 HTML 解析器会切树，React 报 #418。
- **浮层**：一律用 Radix popover/dialog —— ESC、点击外部、焦点回收都由它处理，
  不要自己写 keydown 监听，也不要用浏览器原生 `confirm()`。
- **动效 CSS-first**：过渡用 `transition`；进场用 `app.css` 里的 `pop-in` / `fade-in` /
  `fade-up`；点赞用 `like-pop`。不写 JS 动画，尊重 `prefers-reduced-motion`。
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
