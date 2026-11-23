# ImFDE

FDE（Forward Deployed Engineer）的展示网络。一个主页、一份作品集、一条能持续更新的动态。

线上：[imfde.ai](https://imfde.ai)

## 这个产品是什么

FDE 做的事通常散在 GitHub、LinkedIn、demo 视频和聊天记录里。ImFDE 把它们收拢到一个可以搜索、可以分享、可以写进简历和邮件签名的地址：`imfde.ai/@你的名字`。

它刻意不是这些东西：

- 不是交易市场：平台不经手合同、不收款、不做托管
- 不是认证机构：不给信用分、不给能力等级、不给排行榜
- 不是招聘网站：主页长得像作品集，不像简历

平台只做一件事：把可观察的信息展示清楚，让访问者自己判断。所以每个页面都会标明信息从哪来——本人自述、外部链接、平台行为，三者分开列。

## 技术栈

- **Cloudflare Workers** 承载全部请求（SSR）
- **D1** 存数据，SQLite 语法
- **React Router v7** framework mode，服务端渲染 + 类型化路由
- **Tailwind CSS v4**，设计 token 写在 `app/app.css`
- 字体自托管（Onest Variable + 自托管分片 OPPO Sans 4.0），不依赖外部 CDN

## 本地跑起来

```bash
npm install
npx wrangler d1 migrations apply imfde --local   # 建本地库
printf 'SECRET_KEY=%s
' "$(openssl rand -hex 32)" > .dev.vars
npm run dev                                      # 改代码即时生效
```

想看和线上一致的构建产物：

```bash
npm run build
npx wrangler dev --port 8866 --local
```

## 部署

```bash
npx wrangler d1 create imfde                 # 首次：把 id 填进 wrangler.jsonc
npx wrangler d1 migrations apply imfde --remote
npx wrangler secret put SECRET_KEY           # 会话 cookie 的 HMAC 密钥
npm run deploy
```

`www.imfde.ai` 由 zone 里的 Workers route 加一条代理 CNAME 提供，不写进 `routes`，否则会和已有记录冲突。

## 目录

```
app/
  routes/           每个页面对应一个路由模块
    shell.tsx       导航与页脚，所有登录态页面都挂在它下面
    home.tsx        落地页（未登录）/ 动态流（已登录）
    profile.tsx     /@id 主页
    project.tsx     /projects/{slug} 作品详情
    post.tsx        /posts/{id} 动态详情与评论
    discover*.tsx   发现 FDE 与发现作品
    settings-*.tsx  主页、外部账号、隐私
    actions-*.tsx   点赞 / 关注 / 评论（resource route）
  lib/
    db.server.ts    D1 绑定与查询 helpers
    auth.server.ts  PBKDF2 密码、HMAC 会话 cookie
    queries.server.ts 列表与搜索
    format.ts       时间、计数、封面配色
  components/       卡片、头像、封面
workers/app.ts      Worker 入口，把请求交给 React Router
migrations/         D1 schema
docs/PRD.md         产品需求文档 v0.1
```

## 四条不能破的规矩

1. **不合成评分。** 关注数、点赞数、作品数分别显示，不汇总成一个总分，也不做等级。
2. **注明信息来源。** 自述、外部链接、平台行为在数据层就是不同字段，展示时不许混成「已认证」。
3. **不经手交易。** 没有订单、支付、托管、佣金，也不展示成交与收入。
4. **先展示，再判断。** 页面给事实，不给结论。

## 许可

MIT。
