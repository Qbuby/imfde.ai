-- ImFDE community seed data — high-fidelity FDE profiles, work, feed and interactions.
-- Every generated row uses a stable `seed_*` primary key and a `*@seed.imfde.invalid`
-- email, so scripts/unseed.sql can remove all of it without touching real accounts.
-- Timestamps are relative to insert time and spread over the last 40 minutes..12 days.

-- ── 0. remove leftover test data from earlier QA runs ──────────────────
DELETE FROM users WHERE handle = 'live46279';
UPDATE posts SET deleted_at = CAST(strftime('%s','now') * 1000 AS INTEGER)
 WHERE id = '2d4eb2cf-b0b7-4150-b191-51df5100b2d4';

-- ── A. people ───────────────────────────────────────────────────────────
INSERT OR IGNORE INTO users (id, email, password_hash, handle, kind, status, created_at) VALUES
 ('seed_user_kwu','kwu@seed.imfde.invalid','locked$seed_account_disabled','kwu','individual','active', CAST((strftime('%s','now') - 1036800) * 1000 AS INTEGER)),
 ('seed_user_ming','mchen@seed.imfde.invalid','locked$seed_account_disabled','mchen','individual','active', CAST((strftime('%s','now') - 950400) * 1000 AS INTEGER)),
 ('seed_user_siyu','siyu_z@seed.imfde.invalid','locked$seed_account_disabled','siyu_z','individual','active', CAST((strftime('%s','now') - 864000) * 1000 AS INTEGER)),
 ('seed_user_laok','laok@seed.imfde.invalid','locked$seed_account_disabled','laok','individual','active', CAST((strftime('%s','now') - 777600) * 1000 AS INTEGER)),
 ('seed_user_fieldcraft','fieldcraft@seed.imfde.invalid','locked$seed_account_disabled','fieldcraft','team','active', CAST((strftime('%s','now') - 691200) * 1000 AS INTEGER)),
 ('seed_user_linyu','linyu@seed.imfde.invalid','locked$seed_account_disabled','linyu','individual','active', CAST((strftime('%s','now') - 604800) * 1000 AS INTEGER));

INSERT OR IGNORE INTO profiles (user_id, display_name, avatar_url, cover_url, headline, about, location, timezone, visibility, hide_follows, updated_at) VALUES
 ('seed_user_kwu','吴凯',NULL,NULL,'专接制造业和物流的脏数据现场，最近在把老 ERP 和多模态 OCR 缝在一起','做了 7 年企业数据集成，这两年主要驻场把大模型接到客户现有的 SAP/金蝶和仓储系统里。比起新模型发版，更关心扫描件带红章怎么不丢字段、断网机房怎么稳住显存。','上海','UTC+8','public',0, CAST((strftime('%s','now') - 7200) * 1000 AS INTEGER)),
 ('seed_user_ming','Ming Chen',NULL,NULL,'Voice AI & telephony FDE. Cutting p95 barge-in latency on noisy real calls.','Previously built WebRTC infra, now deploying real-time voice agents for healthcare & logistics call centers. Most of my week is spent staring at VAD traces and weird carrier SIP headers.','旧金山','UTC-8','public',0, CAST((strftime('%s','now') - 14400) * 1000 AS INTEGER)),
 ('seed_user_siyu','郑思雨',NULL,NULL,'企业知识库检索与评测，偏爱混合检索、小模型重排和能跑进内网的东西','帮法务、合规和研发团队做带严格出处的文档问答。坚持先搭 200 条真实难例评测集再动 Prompt，不信没有基准线的调优。','深圳','UTC+8','public',1, CAST((strftime('%s','now') - 21600) * 1000 AS INTEGER)),
 ('seed_user_laok','老K',NULL,NULL,'以前写后端和运维，现在负责把 Agent 真正落到客户内网且半夜不报警','主要处理私有化交付的最后一公里：离线镜像、老旧 CentOS/麒麟兼容、vLLM 显存分配、调用链路追踪和成本告警。','北京','UTC+8','public',0, CAST((strftime('%s','now') - 28800) * 1000 AS INTEGER)),
 ('seed_user_fieldcraft','Fieldcraft Studio',NULL,NULL,'3 人 FDE 小团队，专注客服工单自动化、影子评测与内部 Ops Agent 交付','不做通用平台，只按具体业务流驻场交付可观测的自动化系统。所有上线流程默认先跑两周 Shadow Mode 对比人工回复，达标再灰度切流量。','杭州','UTC+8','public',0, CAST((strftime('%s','now') - 36000) * 1000 AS INTEGER)),
 ('seed_user_linyu','林予',NULL,NULL,'Building browser automation & ERP bridges for cross-border supply chain ops','一半时间写 Playwright 和状态机，一半时间和清关、货代操作员坐在一起看他们每天重复点哪些老网页。','新加坡','UTC+8','public',0, CAST((strftime('%s','now') - 43200) * 1000 AS INTEGER));

INSERT OR IGNORE INTO profile_skills (user_id, skill_name, position) VALUES
 ('seed_user_kwu','私有部署',0),('seed_user_kwu','多模态OCR',1),('seed_user_kwu','RAG',2),('seed_user_kwu','Python',3),('seed_user_kwu','PostgreSQL',4),
 ('seed_user_ming','语音交互',0),('seed_user_ming','LiveKit',1),('seed_user_ming','Eval',2),('seed_user_ming','Go',3),('seed_user_ming','WebRTC',4),
 ('seed_user_siyu','RAG',0),('seed_user_siyu','Eval',1),('seed_user_siyu','Agent 编排',2),('seed_user_siyu','TypeScript',3),('seed_user_siyu','SQLite',4),
 ('seed_user_laok','私有部署',0),('seed_user_laok','vLLM',1),('seed_user_laok','可观测性',2),('seed_user_laok','Docker',3),('seed_user_laok','工作流自动化',4),
 ('seed_user_fieldcraft','工作流自动化',0),('seed_user_fieldcraft','Agent 编排',1),('seed_user_fieldcraft','Eval',2),('seed_user_fieldcraft','可观测性',3),('seed_user_fieldcraft','飞书',4),
 ('seed_user_linyu','工作流自动化',0),('seed_user_linyu','Playwright',1),('seed_user_linyu','Agent 编排',2),('seed_user_linyu','数据管道',3),('seed_user_linyu','开源',4);

INSERT OR IGNORE INTO external_accounts (id, user_id, provider, provider_user_id, profile_url, connection, position, created_at) VALUES
 ('seed_ext_kwu_gh','seed_user_kwu','github',NULL,'https://github.com/kylewu-field','link',0, CAST((strftime('%s','now') - 950400) * 1000 AS INTEGER)),
 ('seed_ext_kwu_web','seed_user_kwu','website',NULL,'https://kwu.dev','link',1, CAST((strftime('%s','now') - 950400) * 1000 AS INTEGER)),
 ('seed_ext_ming_gh','seed_user_ming','github',NULL,'https://github.com/mchen-voice','link',0, CAST((strftime('%s','now') - 950400) * 1000 AS INTEGER)),
 ('seed_ext_ming_x','seed_user_ming','x',NULL,'https://x.com/mchen_voice','link',1, CAST((strftime('%s','now') - 950400) * 1000 AS INTEGER)),
 ('seed_ext_ming_li','seed_user_ming','linkedin',NULL,'https://www.linkedin.com/in/mchen-voice','link',2, CAST((strftime('%s','now') - 950400) * 1000 AS INTEGER)),
 ('seed_ext_siyu_gh','seed_user_siyu','github',NULL,'https://github.com/siyuz-rag','link',0, CAST((strftime('%s','now') - 864000) * 1000 AS INTEGER)),
 ('seed_ext_siyu_blog','seed_user_siyu','blog',NULL,'https://notes.siyuz.io','link',1, CAST((strftime('%s','now') - 864000) * 1000 AS INTEGER)),
 ('seed_ext_laok_gh','seed_user_laok','github',NULL,'https://github.com/laok-ops','link',0, CAST((strftime('%s','now') - 777600) * 1000 AS INTEGER)),
 ('seed_ext_laok_x','seed_user_laok','x',NULL,'https://x.com/laok_infra','link',1, CAST((strftime('%s','now') - 777600) * 1000 AS INTEGER)),
 ('seed_ext_field_web','seed_user_fieldcraft','website',NULL,'https://fieldcraft.studio','link',0, CAST((strftime('%s','now') - 691200) * 1000 AS INTEGER)),
 ('seed_ext_field_gh','seed_user_fieldcraft','github',NULL,'https://github.com/fieldcraft-studio','link',1, CAST((strftime('%s','now') - 691200) * 1000 AS INTEGER)),
 ('seed_ext_linyu_gh','seed_user_linyu','github',NULL,'https://github.com/linyu-ops','link',0, CAST((strftime('%s','now') - 604800) * 1000 AS INTEGER)),
 ('seed_ext_linyu_li','seed_user_linyu','linkedin',NULL,'https://www.linkedin.com/in/linyu-ops','link',1, CAST((strftime('%s','now') - 604800) * 1000 AS INTEGER));

-- ── B. work ─────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO projects (id, owner_id, slug, kind, title, summary, description, cover_url, demo_url, docs_url, repo_url, role, stage, access_mode, limitations, visibility, featured, created_at, updated_at) VALUES
 ('seed_proj_1','seed_user_kwu','stamped-invoice-agent','agent','带红章扫描件与手写磅单提取 Agent',
  '处理物流和工厂现场的倾斜扫描单、红章压字与多页联单，自动校验勾稽关系后写回 ERP。',
  '客户每天收 3000+ 张地磅单和送货单，扫描件倾斜、红章压住金额小数点、多页联单表头只出现在第一页。上一版直接把整页丢给 VLM，金额字段错率 14%，财务根本不敢用。' || char(10) || '' || char(10) || '做法是先做版面纠正和红通道分离，把印章当噪点抹掉再进 OCR，然后对"净重 × 单价 = 金额"做勾稽校验，不一致的才走 VLM 二次识别。多页联单用第一页表头 + 后续页行数据拼结构化对象。写回 ERP 前全部进人工复核队列，只自动放行置信度 > 0.98 且勾稽通过的字段。' || char(10) || '' || char(10) || '上线 11 周，字段级准确率从 86% 到 98.2%，单张推理成本从 0.19 元降到 0.08 元，财务每天人工复核量从 700 单降到 40 单左右。',
  '/covers/01.webp',NULL,NULL,'https://github.com/kylewu-field/stamped-invoice-agent',
  '我负责 OCR 预处理、勾稽规则引擎、ERP 写回接口和现场部署；客户 IT 提供 SAP 接口权限和测试集。',
  '生产运行中','私有部署','需要客户内网 GPU（至少 1 张 16G 显存）和 SAP RFC 只读权限；手写体特别潦草的单据仍需人工确认。','public',1,
  CAST((strftime('%s','now') - 864000) * 1000 AS INTEGER), CAST((strftime('%s','now') - 7200) * 1000 AS INTEGER)),

 ('seed_proj_2','seed_user_kwu','sap-rfc-readonly-mcp','tool','SAP RFC 只读白名单 MCP 桥接层',
  '把老旧 SAP RFC 函数封装成带字段脱敏和速率限制的只读工具，让 Agent 安全查库存与订单。',
  '现场需求很直接：Agent 要查库存和订单状态，但不能给写权限，也不能把客户地址、联系人电话原样喂给模型。SAP 那套 RFC 又老又杂，直接暴露等于把整张表交出去。' || char(10) || '' || char(10) || '我按函数建了白名单，只放行 7 个查询函数；每个函数定义了字段级脱敏规则（地址只留城市、电话中间四位打码）和每秒调用上限。工具返回统一 JSON，附带数据时间和来源系统，方便回答时说明依据。' || char(10) || '' || char(10) || '现在两个客户的 Agent 通过这层查数据，跑了 3 个月没有一次越权调用。日志里被拒的调用主要集中在有人试图查不在白名单里的供应商表。',
  '/covers/02.webp',NULL,NULL,'https://github.com/kylewu-field/sap-rfc-readonly-mcp',
  '独立设计与实现，含白名单配置、脱敏规则和审计日志；SAP 权限配置由客户完成。',
  '维护中','开源代码','面向 SAP ECC 的 RFC 接口，S/4HANA 需要另配 OData 版本；白名单规则要按客户权限模型手工维护。','public',0,
  CAST((strftime('%s','now') - 691200) * 1000 AS INTEGER), CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),

 ('seed_proj_3','seed_user_ming','barge-in-latency-bench','oss','电话语音 Agent 打断延迟压测套件',
  '用 120 段真实噪声电话录音（车载、回声、中英混说）自动化测量 VAD 与首字延迟 p50/p95。',
  '实验室里用干净录音调出来的 VAD 阈值，一到真实电话就崩：车载噪声、运营商回声、说话人中英混着来，barge-in 经常触发不了或者误触发。光看 demo 视频根本发现不了。' || char(10) || '' || char(10) || '这个套件把 120 段脱敏后的真实通话做成可重放的输入，用固定时间轴注入噪声和抖动，分别测 VAD 触发延迟和首字音频延迟的 p50/p95。每个配置跑一遍出对比报告，直接看出改一个端点检测参数在车载场景下是变好还是变坏。' || char(10) || '' || char(10) || '目前在 3 个客户现场用，把最差场景的 barge-in p95 从 1.1s 压到 430ms。声学模型不同结果差异很大，套件故意不绑定具体厂商。',
  '/covers/03.webp',NULL,'https://bargein.mchen.dev/docs','https://github.com/mchen-voice/barge-in-bench',
  '我写了回放框架、指标计算和报告生成；录音由合作方脱敏后提供。',
  '已上线','开源代码','录音必须脱敏且取得授权；指标只覆盖端点检测与首字延迟，不评估语义正确性。','public',1,
  CAST((strftime('%s','now') - 777600) * 1000 AS INTEGER), CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER)),

 ('seed_proj_4','seed_user_ming','dental-triage-voice','case','连锁齿科电话预约与改期语音助手',
  '接管 4 家诊所前台约 62% 的预约改期来电，端到端响应压在 680ms 内；涉及医保报价强制转人工。',
  '4 家诊所共用一套电话系统，前台上午最忙时平均 8 个未接来电，大部分是改期和问营业时间。诊所老板最担心 AI 把医保报价说错，所以这条线从一开始就划了硬边界。' || char(10) || '' || char(10) || '系统只处理营业时间查询、预约改期、医生排班三类意图，任何涉及价格、医保、投诉的关键词立刻转人工并带上通话摘要。为了压延迟，把 ASR 流式结果与意图分类并行跑，端到端 p95 控在 680ms。' || char(10) || '' || char(10) || '跑满 6 周，约 62% 的来电无需人工介入，改期类任务的完成率 91%。剩下的转人工里约三成是医保相关，属于设计内的兜底。',
  '/covers/04.webp',NULL,NULL,NULL,
  '负责语音管线、意图路由、转人工策略和现场调参；诊所提供排班系统接口。',
  '生产运行中','仅 Demo 展示','只对三类意图开放，价格与医保强制转人工；目前仅接了这一家连锁的 PBX，方言口音识别率仍需人工兜底。','public',0,
  CAST((strftime('%s','now') - 604800) * 1000 AS INTEGER), CAST((strftime('%s','now') - 259200) * 1000 AS INTEGER)),

 ('seed_proj_5','seed_user_siyu','citation-guard-rag','tool','RAG 引用幻觉自动核查器',
  '在生成回答返回前逐句核对召回片段，标出"页码编造"与"跨条款偷换前提"的高风险句。',
  '法务团队最怕的不是答不上来，而是答得像真的但出处是编的。常规 RAG 只告诉你"参考了哪几篇文档"，不保证每句话都真能从那几篇里找到依据。' || char(10) || '' || char(10) || '核查器在回答返回前按句切分，逐句回查召回片段：数字、条款号、页码必须能在原文定位；同时检查一句话里是否混用了两个条款的前提。命中的高风险句直接标出来，前端把那几句话用黄色底纹提示"需人工核对"。' || char(10) || '' || char(10) || '在自建的 200 条难例上，页码编造类幻觉召回率 87%，跨条款偷换前提召回率 72%，误报率 11%。误报主要来自同义改写，目前选择宁可多标也不漏标。',
  '/covers/05.webp','https://citation-guard.siyuz.io',NULL,'https://github.com/siyuz-rag/citation-guard',
  '独立实现核查规则、评测集和前端标注组件。',
  '内测','在线体验','依赖 PDF 解析质量，扫描件需要先 OCR；跨条款类问题仍有 28% 漏检，不适合无人复核场景。','public',1,
  CAST((strftime('%s','now') - 518400) * 1000 AS INTEGER), CAST((strftime('%s','now') - 259200) * 1000 AS INTEGER)),

 ('seed_proj_6','seed_user_laok','airgap-vllm-bundle','oss','离线内网大模型一键打包与健康检查脚本',
  '针对断网机房与老旧 CentOS 7 / 麒麟环境，把镜像、权重校验、Prometheus 指标与 OOM 保护打包成单目录交付物。',
  '客户机房不通外网，操作系统还是 CentOS 7，glibc 版本老到很多新轮子直接装不上。之前每次进场都靠现场翻聊天记录找当时用的 wheel，装到凌晨是常事。' || char(10) || '' || char(10) || '现在把镜像 tar、权重 SHA256 校验清单、兼容 wheel、CUDA 自检脚本和 Prometheus 指标导出打成一个目录，进场只需要跑一个 check.sh：先查 glibc 和驱动版本，不兼容直接给出明确报错而不是构建到一半失败。OOM 熔断按显存占用设阈值，超了自动降 max_tokens 而不是整进程被 kill。' || char(10) || '' || char(10) || '在 4 个断网现场复用，单机部署时间从平均 6 小时降到 50 分钟，权重校验拦下过一次传输损坏。',
  '/covers/06.webp',NULL,NULL,'https://github.com/laok-ops/airgap-vllm-bundle',
  '打包脚本、健康检查、显存保护和现场部署文档都是我写的。',
  '维护中','开源代码','只覆盖 x86_64 + CUDA 路线，国产卡和 ARM 环境还没适配；权重文件本身需要客户自行获取并校验授权。','public',1,
  CAST((strftime('%s','now') - 432000) * 1000 AS INTEGER), CAST((strftime('%s','now') - 18000) * 1000 AS INTEGER)),

 ('seed_proj_7','seed_user_fieldcraft','feishu-oncall-triage','automation','飞书告警群自动分诊与提交回溯助手',
  '监听线上报错栈，自动关联近 24 小时 Git 变更与日志上下文，20 秒内在群内发出根因假设与回滚清单。',
  '客户的值班群里每天几百条告警，真正需要处理的不到一成，大部分是同一个已知问题的重复刷屏。值班同学每次都要手动翻 Git 提交和日志，平均定位时间 15 分钟起。' || char(10) || '' || char(10) || '助手收到告警后先做指纹去重，再拉近 24 小时的提交记录和相邻时间窗的错误日志，给出最多 3 条根因假设和对应的回滚步骤。上线前两周刻意只跑 Shadow Mode，只在后台记录判断结果不 @ 人，对比了 186 条真实告警，确认误报率低于 4% 才开正式推送。' || char(10) || '' || char(10) || '正式跑起来之后，值班同学的中位定位时间从 15 分钟降到 4 分钟，重复告警的群消息量减少约 70%。',
  '/covers/07.webp','https://fieldcraft.studio/cases/feishu-oncall',NULL,NULL,
  '团队三人一起做：我负责分诊逻辑和 Shadow Mode 评测，另外两位分别做日志接入和飞书机器人。',
  '生产运行中','仅 Demo 展示','依赖客户 Git 与日志系统的可访问性；根因假设只是排序建议，不自动执行回滚。','public',1,
  CAST((strftime('%s','now') - 345600) * 1000 AS INTEGER), CAST((strftime('%s','now') - 28800) * 1000 AS INTEGER)),

 ('seed_proj_8','seed_user_linyu','customs-portal-autofill','agent','跨境清关老旧网页表单回填与人工复核 Agent',
  '针对无开放 API 的船司和清关后台，用 Playwright 确定性脚本加视觉兜底完成 90% 字段回填，提交前由操作员一键复核。',
  '几家船司和清关后台没有开放 API，操作员每天在四五个老网页之间复制同样的提单号、箱号、件毛重，一天下来光重复录入就两三个小时。页面还经常改版，纯 XPath 脚本两周就失效一次。' || char(10) || '' || char(10) || '做法是 Playwright 走确定性路径填 90% 的字段，关键字段再加一层视觉定位兜底，页面结构变了先报警而不是静默填错。所有表单在提交前停在复核页，操作员看 10 秒确认即可，不追求无人值守。' || char(10) || '' || char(10) || '现在单票处理时间从 15 分钟压到约 50 秒，操作员一天能多处理 60% 的单量。页面改版导致的失败率大约每月 2 次，都在提交前被拦下。',
  '/covers/08.webp',NULL,NULL,NULL,
  '我负责 Playwright 脚本、视觉兜底和复核界面；客户的操作员参与现场验收与误填样本标注。',
  '已上线','私有部署','只覆盖现有四家船司/清关后台；页面大改版需要重新录制路径，涉及申报金额最后一步必须人工确认。','public',1,
  CAST((strftime('%s','now') - 259200) * 1000 AS INTEGER), CAST((strftime('%s','now') - 43200) * 1000 AS INTEGER));

INSERT OR IGNORE INTO project_skills (project_id, skill_name, position) VALUES
 ('seed_proj_1','多模态OCR',0),('seed_proj_1','私有部署',1),('seed_proj_1','Python',2),('seed_proj_1','PostgreSQL',3),
 ('seed_proj_2','MCP',0),('seed_proj_2','私有部署',1),('seed_proj_2','Python',2),
 ('seed_proj_3','语音交互',0),('seed_proj_3','Eval',1),('seed_proj_3','LiveKit',2),('seed_proj_3','Go',3),
 ('seed_proj_4','语音交互',0),('seed_proj_4','WebRTC',1),('seed_proj_4','Eval',2),
 ('seed_proj_5','RAG',0),('seed_proj_5','Eval',1),('seed_proj_5','TypeScript',2),('seed_proj_5','混合检索',3),
 ('seed_proj_6','私有部署',0),('seed_proj_6','vLLM',1),('seed_proj_6','Docker',2),('seed_proj_6','可观测性',3),
 ('seed_proj_7','工作流自动化',0),('seed_proj_7','Agent 编排',1),('seed_proj_7','可观测性',2),('seed_proj_7','飞书',3),
 ('seed_proj_8','工作流自动化',0),('seed_proj_8','Playwright',1),('seed_proj_8','Agent 编排',2);

-- ── C. feed posts ───────────────────────────────────────────────────────
INSERT OR IGNORE INTO posts (id, author_id, kind, body, project_id, visibility, created_at, updated_at, deleted_at, repost_of_id) VALUES
 ('seed_post_1','seed_user_kwu','build','现场扫出来的物流磅单，红章正好盖在金额小数点上。直接喂给 VLM 错率 14%，先用 OpenCV 分离红通道再进模型，错率直接掉到 1.8%，顺便把单张推理成本砍了一半。#私有部署 #多模态OCR','seed_proj_1','public', CAST((strftime('%s','now') - 2400) * 1000 AS INTEGER), CAST((strftime('%s','now') - 2400) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_2','seed_user_ming','thought','语音 Agent 现场落地最大的隐形杀手不是模型智商，是客户 PBX 网关偶尔多出来的 300ms 抖动。如果不在静音检测前做自适应缓冲，用户说完话等一秒没反应就会开始喂喂喂，然后整个对话状态机直接雪崩。#语音交互 #现场踩坑',NULL,'public', CAST((strftime('%s','now') - 7200) * 1000 AS INTEGER), CAST((strftime('%s','now') - 7200) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_3','seed_user_siyu','discussion','做企业文档 #RAG 大家现在怎么处理“跨页合并单元格”？我们试了三种 PDF 解析器，一遇到财务附注里的跨页表还是会丢表头。目前最稳的土办法是转图切页重叠送小 VLM 还原 Markdown，有更轻量的方案吗？#Eval',NULL,'public', CAST((strftime('%s','now') - 10800) * 1000 AS INTEGER), CAST((strftime('%s','now') - 10800) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_4','seed_user_laok','build','给客户内网装机第 4 次踩到同一颗雷：宿主机 glibc 太老，很多新轮子直接跑不起来。把离线镜像打包、CUDA 版本自检和 OOM 熔断脚本整理出来开源了，下次进断网机房少熬半宿。#私有部署 #可观测性','seed_proj_6','public', CAST((strftime('%s','now') - 18000) * 1000 AS INTEGER), CAST((strftime('%s','now') - 18000) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_5','seed_user_fieldcraft','show','把我们给 SaaS 客户做的飞书告警分诊助手整理成了案例页。上线前两周刻意只跑 Shadow Mode 不 @ 人，对比了 186 条真实告警，确认误报率低于 4% 才开正式推送。#工作流自动化 #Agent','seed_proj_7','public', CAST((strftime('%s','now') - 28800) * 1000 AS INTEGER), CAST((strftime('%s','now') - 28800) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_6','seed_user_linyu','thought','客户总问能不能做“全自动无人值守清关”。我的建议一直很明确：90% 机械填表交给脚本和 Agent，最后按“确认申报”那一下必须留给人看 10 秒。把人工从 15 分钟压到 10 秒，比硬冲 100% 自动但错一单赔十万靠谱得多。#Agent #工作流自动化',NULL,'public', CAST((strftime('%s','now') - 43200) * 1000 AS INTEGER), CAST((strftime('%s','now') - 43200) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_7','seed_user_kwu','thought','SAP RFC 白名单做了三个月，被拒最多的不是供应商表，是有人想用查询函数间接导出整张物料主数据。只读不等于安全，字段级脱敏和调用频率限制都得单独做一层。#私有部署 #MCP',NULL,'public', CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER), CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_8','seed_user_ming','show','打断延迟压测套件放到 120 段真实通话上了，车载噪声那组最狠：同样参数，安静环境 p95 是 210ms，车载直接飙到 1.1s。加自适应缓冲之后才压回 430ms。别拿实验室录音调 VAD 阈值。#语音交互 #Eval',NULL,'public', CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER), CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_9','seed_user_siyu','build','引用核查器在自建 200 条难例上跑完了：页码编造召回 87%，跨条款偷换前提只有 72%，误报 11%。后面一类真的难，同义改写经常被判成偷换。现在选择宁可多标也不漏标，法务那边接受这个取舍。#RAG #Eval','seed_proj_5','public', CAST((strftime('%s','now') - 259200) * 1000 AS INTEGER), CAST((strftime('%s','now') - 259200) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_10','seed_user_laok','thought','补一个现场数据：我们这边 PBX 抖动比 300ms 还夸张，跨运营商那几条线偶尔能到 800ms。除了自适应缓冲，我把 TTS 首包也做了预生成，不然用户听到的是一段很长的沉默。@mchen 你们的 bench 能不能加一组跨运营商的样本？#语音交互 #现场踩坑',NULL,'public', CAST((strftime('%s','now') - 432000) * 1000 AS INTEGER), CAST((strftime('%s','now') - 432000) * 1000 AS INTEGER), NULL, 'seed_post_2'),
 ('seed_post_11','seed_user_fieldcraft','thought','跨页合并单元格这个坑我们也踩过。财务附注里表头只在第一页，后面几页全是续行，PDF 解析器一律丢表头。最后是按页切图做 15% 重叠再送小 VLM 还原 Markdown，成本比换解析器低。另外建议先攒 200 条真实难例再调，不然优化没有基准线。#RAG #Eval',NULL,'public', CAST((strftime('%s','now') - 604800) * 1000 AS INTEGER), CAST((strftime('%s','now') - 604800) * 1000 AS INTEGER), NULL, 'seed_post_3'),
 ('seed_post_12','seed_user_linyu','show','',NULL,'public', CAST((strftime('%s','now') - 1036800) * 1000 AS INTEGER), CAST((strftime('%s','now') - 1036800) * 1000 AS INTEGER), NULL, 'seed_post_2');

INSERT OR IGNORE INTO post_tags (post_id, tag) VALUES
 ('seed_post_1','私有部署'),('seed_post_1','多模态OCR'),
 ('seed_post_2','语音交互'),('seed_post_2','现场踩坑'),
 ('seed_post_3','RAG'),('seed_post_3','Eval'),
 ('seed_post_4','私有部署'),('seed_post_4','可观测性'),
 ('seed_post_5','工作流自动化'),('seed_post_5','Agent'),
 ('seed_post_6','Agent'),('seed_post_6','工作流自动化'),
 ('seed_post_7','私有部署'),('seed_post_7','MCP'),
 ('seed_post_8','语音交互'),('seed_post_8','Eval'),
 ('seed_post_9','RAG'),('seed_post_9','Eval'),
 ('seed_post_10','语音交互'),('seed_post_10','现场踩坑'),
 ('seed_post_11','RAG'),('seed_post_11','Eval');

-- ── D1. follows: natural cross-following, 3–5 followers each ───────────
INSERT OR IGNORE INTO follows (follower_id, followed_id, created_at) VALUES
 ('seed_user_kwu','seed_user_ming', CAST((strftime('%s','now') - 950400) * 1000 AS INTEGER)),
 ('seed_user_kwu','seed_user_siyu', CAST((strftime('%s','now') - 921600) * 1000 AS INTEGER)),
 ('seed_user_kwu','seed_user_laok', CAST((strftime('%s','now') - 864000) * 1000 AS INTEGER)),
 ('seed_user_kwu','seed_user_fieldcraft', CAST((strftime('%s','now') - 777600) * 1000 AS INTEGER)),
 ('seed_user_ming','seed_user_kwu', CAST((strftime('%s','now') - 940000) * 1000 AS INTEGER)),
 ('seed_user_ming','seed_user_siyu', CAST((strftime('%s','now') - 864000) * 1000 AS INTEGER)),
 ('seed_user_ming','seed_user_linyu', CAST((strftime('%s','now') - 691200) * 1000 AS INTEGER)),
 ('seed_user_siyu','seed_user_kwu', CAST((strftime('%s','now') - 950400) * 1000 AS INTEGER)),
 ('seed_user_siyu','seed_user_ming', CAST((strftime('%s','now') - 864000) * 1000 AS INTEGER)),
 ('seed_user_siyu','seed_user_laok', CAST((strftime('%s','now') - 777600) * 1000 AS INTEGER)),
 ('seed_user_siyu','seed_user_fieldcraft', CAST((strftime('%s','now') - 604800) * 1000 AS INTEGER)),
 ('seed_user_siyu','seed_user_linyu', CAST((strftime('%s','now') - 518400) * 1000 AS INTEGER)),
 ('seed_user_laok','seed_user_kwu', CAST((strftime('%s','now') - 864000) * 1000 AS INTEGER)),
 ('seed_user_laok','seed_user_ming', CAST((strftime('%s','now') - 777600) * 1000 AS INTEGER)),
 ('seed_user_laok','seed_user_fieldcraft', CAST((strftime('%s','now') - 604800) * 1000 AS INTEGER)),
 ('seed_user_fieldcraft','seed_user_kwu', CAST((strftime('%s','now') - 777600) * 1000 AS INTEGER)),
 ('seed_user_fieldcraft','seed_user_siyu', CAST((strftime('%s','now') - 691200) * 1000 AS INTEGER)),
 ('seed_user_fieldcraft','seed_user_linyu', CAST((strftime('%s','now') - 432000) * 1000 AS INTEGER)),
 ('seed_user_linyu','seed_user_kwu', CAST((strftime('%s','now') - 864000) * 1000 AS INTEGER)),
 ('seed_user_linyu','seed_user_ming', CAST((strftime('%s','now') - 777600) * 1000 AS INTEGER)),
 ('seed_user_linyu','seed_user_siyu', CAST((strftime('%s','now') - 691200) * 1000 AS INTEGER)),
 ('seed_user_linyu','seed_user_laok', CAST((strftime('%s','now') - 604800) * 1000 AS INTEGER));

-- ── D2. reactions: 1–5 likes per project / post ─────────────────────────
INSERT OR IGNORE INTO reactions (user_id, target_type, target_id, type, created_at) VALUES
 ('seed_user_ming','project','seed_proj_1','like', CAST((strftime('%s','now') - 7200) * 1000 AS INTEGER)),
 ('seed_user_siyu','project','seed_proj_1','like', CAST((strftime('%s','now') - 21600) * 1000 AS INTEGER)),
 ('seed_user_laok','project','seed_proj_1','like', CAST((strftime('%s','now') - 43200) * 1000 AS INTEGER)),
 ('seed_user_fieldcraft','project','seed_proj_1','like', CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_user_kwu','project','seed_proj_3','like', CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER)),
 ('seed_user_siyu','project','seed_proj_3','like', CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER)),
 ('seed_user_linyu','project','seed_proj_3','like', CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_user_kwu','project','seed_proj_4','like', CAST((strftime('%s','now') - 259200) * 1000 AS INTEGER)),
 ('seed_user_laok','project','seed_proj_4','like', CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER)),
 ('seed_user_kwu','project','seed_proj_5','like', CAST((strftime('%s','now') - 259200) * 1000 AS INTEGER)),
 ('seed_user_ming','project','seed_proj_5','like', CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER)),
 ('seed_user_laok','project','seed_proj_5','like', CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_user_fieldcraft','project','seed_proj_5','like', CAST((strftime('%s','now') - 43200) * 1000 AS INTEGER)),
 ('seed_user_kwu','project','seed_proj_6','like', CAST((strftime('%s','now') - 432000) * 1000 AS INTEGER)),
 ('seed_user_ming','project','seed_proj_6','like', CAST((strftime('%s','now') - 18000) * 1000 AS INTEGER)),
 ('seed_user_siyu','project','seed_proj_6','like', CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_user_linyu','project','seed_proj_6','like', CAST((strftime('%s','now') - 43200) * 1000 AS INTEGER)),
 ('seed_user_kwu','project','seed_proj_7','like', CAST((strftime('%s','now') - 28800) * 1000 AS INTEGER)),
 ('seed_user_ming','project','seed_proj_7','like', CAST((strftime('%s','now') - 21600) * 1000 AS INTEGER)),
 ('seed_user_siyu','project','seed_proj_7','like', CAST((strftime('%s','now') - 43200) * 1000 AS INTEGER)),
 ('seed_user_laok','project','seed_proj_7','like', CAST((strftime('%s','now') - 43200) * 1000 AS INTEGER)),
 ('seed_user_linyu','project','seed_proj_7','like', CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_user_kwu','project','seed_proj_8','like', CAST((strftime('%s','now') - 259200) * 1000 AS INTEGER)),
 ('seed_user_ming','project','seed_proj_8','like', CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER)),
 ('seed_user_siyu','project','seed_proj_8','like', CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_user_ming','post','seed_post_1','like', CAST((strftime('%s','now') - 1800) * 1000 AS INTEGER)),
 ('seed_user_siyu','post','seed_post_1','like', CAST((strftime('%s','now') - 1200) * 1000 AS INTEGER)),
 ('seed_user_laok','post','seed_post_1','like', CAST((strftime('%s','now') - 600) * 1000 AS INTEGER)),
 ('seed_user_fieldcraft','post','seed_post_1','like', CAST((strftime('%s','now') - 2400) * 1000 AS INTEGER)),
 ('seed_user_kwu','post','seed_post_2','like', CAST((strftime('%s','now') - 5400) * 1000 AS INTEGER)),
 ('seed_user_laok','post','seed_post_2','like', CAST((strftime('%s','now') - 3600) * 1000 AS INTEGER)),
 ('seed_user_fieldcraft','post','seed_post_2','like', CAST((strftime('%s','now') - 7200) * 1000 AS INTEGER)),
 ('seed_user_kwu','post','seed_post_3','like', CAST((strftime('%s','now') - 9000) * 1000 AS INTEGER)),
 ('seed_user_ming','post','seed_post_3','like', CAST((strftime('%s','now') - 7200) * 1000 AS INTEGER)),
 ('seed_user_laok','post','seed_post_3','like', CAST((strftime('%s','now') - 5400) * 1000 AS INTEGER)),
 ('seed_user_fieldcraft','post','seed_post_3','like', CAST((strftime('%s','now') - 3600) * 1000 AS INTEGER)),
 ('seed_user_ming','post','seed_post_4','like', CAST((strftime('%s','now') - 14400) * 1000 AS INTEGER)),
 ('seed_user_siyu','post','seed_post_4','like', CAST((strftime('%s','now') - 10800) * 1000 AS INTEGER)),
 ('seed_user_linyu','post','seed_post_4','like', CAST((strftime('%s','now') - 7200) * 1000 AS INTEGER)),
 ('seed_user_kwu','post','seed_post_5','like', CAST((strftime('%s','now') - 21600) * 1000 AS INTEGER)),
 ('seed_user_ming','post','seed_post_5','like', CAST((strftime('%s','now') - 18000) * 1000 AS INTEGER)),
 ('seed_user_siyu','post','seed_post_6','like', CAST((strftime('%s','now') - 36000) * 1000 AS INTEGER)),
 ('seed_user_laok','post','seed_post_6','like', CAST((strftime('%s','now') - 28800) * 1000 AS INTEGER)),
 ('seed_user_fieldcraft','post','seed_post_6','like', CAST((strftime('%s','now') - 21600) * 1000 AS INTEGER)),
 ('seed_user_linyu','post','seed_post_6','like', CAST((strftime('%s','now') - 43200) * 1000 AS INTEGER)),
 ('seed_user_laok','post','seed_post_7','like', CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_user_fieldcraft','post','seed_post_7','like', CAST((strftime('%s','now') - 43200) * 1000 AS INTEGER)),
 ('seed_user_kwu','post','seed_post_8','like', CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER)),
 ('seed_user_siyu','post','seed_post_8','like', CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_user_laok','post','seed_post_8','like', CAST((strftime('%s','now') - 43200) * 1000 AS INTEGER)),
 ('seed_user_kwu','post','seed_post_9','like', CAST((strftime('%s','now') - 259200) * 1000 AS INTEGER)),
 ('seed_user_ming','post','seed_post_9','like', CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER)),
 ('seed_user_linyu','post','seed_post_9','like', CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_user_linyu','post','seed_post_10','like', CAST((strftime('%s','now') - 432000) * 1000 AS INTEGER)),
 ('seed_user_kwu','post','seed_post_10','like', CAST((strftime('%s','now') - 216000) * 1000 AS INTEGER)),
 ('seed_user_kwu','post','seed_post_11','like', CAST((strftime('%s','now') - 604800) * 1000 AS INTEGER)),
 ('seed_user_laok','post','seed_post_11','like', CAST((strftime('%s','now') - 302400) * 1000 AS INTEGER)),
 ('seed_user_siyu','post','seed_post_11','like', CAST((strftime('%s','now') - 216000) * 1000 AS INTEGER));

-- ── D3. comments: peer discussion + author replies ────────────────────
INSERT OR IGNORE INTO comments (id, post_id, author_id, parent_id, body, created_at, deleted_at) VALUES
 ('seed_cmt_1','seed_post_3','seed_user_kwu',NULL,'我们最后是按页切图、上下留 15% 重叠送小 VLM 还原 Markdown，表头基本能带回来。比换解析器便宜，代价是每页多一次调用。', CAST((strftime('%s','now') - 9000) * 1000 AS INTEGER), NULL),
 ('seed_cmt_2','seed_post_3','seed_user_laok',NULL,'显存占用实测：batch=4 的时候小 VLM 大概 6G，比上 7B 模型省一半。我们在 3060 上跑得动。', CAST((strftime('%s','now') - 7200) * 1000 AS INTEGER), NULL),
 ('seed_cmt_3','seed_post_3','seed_user_siyu','seed_cmt_1','这个思路和我们现在做的接近。想追问一下你们表头拼接是规则还是让模型自己判断？跨页表格列名偶尔会变。', CAST((strftime('%s','now') - 6300) * 1000 AS INTEGER), NULL),
 ('seed_cmt_4','seed_post_3','seed_user_kwu','seed_cmt_3','规则，用第一页的列名当 schema 固定住，后面页只允许填值。列名变了就整组标出来让人看，不敢让模型自由发挥。', CAST((strftime('%s','now') - 5400) * 1000 AS INTEGER), NULL),
 ('seed_cmt_5','seed_post_2','seed_user_fieldcraft',NULL,'VAD 阈值你们最后设多少？我们在呼叫中心场景 350ms 触发，安静环境没问题，一上车载噪声就误触发。', CAST((strftime('%s','now') - 5400) * 1000 AS INTEGER), NULL),
 ('seed_cmt_6','seed_post_2','seed_user_ming','seed_cmt_5','固定阈值不行，我们改成按最近 2 秒噪声底噪动态算，静音段自适应抬阈值。车载那批样本误触发降了大半，参数是每 5 分钟重估一次。', CAST((strftime('%s','now') - 3600) * 1000 AS INTEGER), NULL),
 ('seed_cmt_7','seed_post_2','seed_user_laok',NULL,'补充一个坑：有些运营商的 RTP 包会晚到 300~800ms，光调 VAD 解决不了，得在 jitter buffer 那层先稳定时间轴。', CAST((strftime('%s','now') - 1800) * 1000 AS INTEGER), NULL),
 ('seed_cmt_8','seed_post_1','seed_user_ming',NULL,'红通道分离这招在盖章场景很实用。我们用类似办法处理过手写签名压字，不过要注意有些红章是半透明的，直接减通道会伤到下面的字。', CAST((strftime('%s','now') - 1200) * 1000 AS INTEGER), NULL),
 ('seed_cmt_9','seed_post_1','seed_user_kwu','seed_cmt_8','对，半透明那种我们先做了一次对比度拉伸再分离，不然确实会把数字一起抹掉。这个 case 在样本里大概占 8%。', CAST((strftime('%s','now') - 600) * 1000 AS INTEGER), NULL),
 ('seed_cmt_10','seed_post_5','seed_user_siyu',NULL,'186 条告警里误报 4% 是怎么判定的？我们也想给 Shadow Mode 定一个能开工的门槛。', CAST((strftime('%s','now') - 21600) * 1000 AS INTEGER), NULL),
 ('seed_cmt_11','seed_post_5','seed_user_fieldcraft','seed_cmt_10','让值班同学盲评，只看助手给的判断不看是不是真告警，标“会照着做”还是“会忽略”。4% 是标错的占比，不是准确率。', CAST((strftime('%s','now') - 18000) * 1000 AS INTEGER), NULL),
 ('seed_cmt_12','seed_post_6','seed_user_linyu','seed_cmt_11','同意留人工确认那一下。我们试过去掉复核，单票省 3 秒，但有一次箱号填错赔了钱，之后就再没动过这个设计。', CAST((strftime('%s','now') - 36000) * 1000 AS INTEGER), NULL);

-- ── D4. bookmarks + notifications ─────────────────────────────────────
INSERT OR IGNORE INTO bookmarks (user_id, target_type, target_id, created_at) VALUES
 ('seed_user_ming','project','seed_proj_1', CAST((strftime('%s','now') - 7200) * 1000 AS INTEGER)),
 ('seed_user_siyu','project','seed_proj_6', CAST((strftime('%s','now') - 43200) * 1000 AS INTEGER)),
 ('seed_user_linyu','project','seed_proj_5', CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_user_kwu','post','seed_post_11', CAST((strftime('%s','now') - 216000) * 1000 AS INTEGER)),
 ('seed_user_fieldcraft','post','seed_post_8', CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_user_siyu','post','seed_post_1', CAST((strftime('%s','now') - 1800) * 1000 AS INTEGER));

INSERT OR IGNORE INTO notifications (id, recipient_id, actor_id, type, target_type, target_id, read_at, created_at) VALUES
 ('seed_ntf_1','seed_user_kwu','seed_user_ming','like','post','seed_post_1',NULL, CAST((strftime('%s','now') - 1800) * 1000 AS INTEGER)),
 ('seed_ntf_2','seed_user_kwu','seed_user_ming','comment','post','seed_post_1',NULL, CAST((strftime('%s','now') - 1200) * 1000 AS INTEGER)),
 ('seed_ntf_3','seed_user_siyu','seed_user_kwu','comment','post','seed_post_3',NULL, CAST((strftime('%s','now') - 5400) * 1000 AS INTEGER)),
 ('seed_ntf_4','seed_user_ming','seed_user_fieldcraft','comment','post','seed_post_2', CAST((strftime('%s','now') - 3600) * 1000 AS INTEGER), CAST((strftime('%s','now') - 3600) * 1000 AS INTEGER)),
 ('seed_ntf_5','seed_user_fieldcraft','seed_user_siyu','comment','post','seed_post_5',NULL, CAST((strftime('%s','now') - 18000) * 1000 AS INTEGER)),
 ('seed_ntf_6','seed_user_linyu','seed_user_kwu','follow','user','seed_user_kwu',NULL, CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER));

-- ── E. brand signature: 同题切磋 (prompts) + 稀缺 ACK ──────────────────
INSERT OR IGNORE INTO prompts (id, slug, title, summary, tag, status, ends_at, created_at) VALUES
 ('seed_prompt_tables','dirty-pdf-tables','脏 PDF 跨页表格怎么解','财务附注、扫描单据里的跨页合并单元格，大家线上怎么稳住表头？','RAG','active',
  CAST((strftime('%s','now') + 345600) * 1000 AS INTEGER), CAST((strftime('%s','now') - 259200) * 1000 AS INTEGER)),
 ('seed_prompt_voice','voice-barge-in-500ms','把语音打断压到 500ms 内','真实车载、弱网和运营商回声下，你的 VAD 和缓冲策略是什么？','语音交互','active',
  CAST((strftime('%s','now') + 777600) * 1000 AS INTEGER), CAST((strftime('%s','now') - 432000) * 1000 AS INTEGER));

UPDATE posts SET prompt_id = 'seed_prompt_tables' WHERE id IN ('seed_post_3','seed_post_11');
UPDATE posts SET prompt_id = 'seed_prompt_voice' WHERE id IN ('seed_post_2','seed_post_8','seed_post_10');

-- Historical ACKs on yesterday / the day before, so real logged-in users keep
-- their full 2-per-day quota. No money, no ranking — just raw acknowledgements.
INSERT OR IGNORE INTO acks (id, user_id, post_id, day_key, created_at) VALUES
 ('seed_ack_1','seed_user_ming','seed_post_1',date('now','+8 hours','-1 day'), CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_ack_2','seed_user_siyu','seed_post_1',date('now','+8 hours','-1 day'), CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_ack_3','seed_user_laok','seed_post_1',date('now','+8 hours','-2 day'), CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER)),
 ('seed_ack_4','seed_user_kwu','seed_post_2',date('now','+8 hours','-1 day'), CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_ack_5','seed_user_fieldcraft','seed_post_2',date('now','+8 hours','-1 day'), CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_ack_6','seed_user_linyu','seed_post_3',date('now','+8 hours','-2 day'), CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER)),
 ('seed_ack_7','seed_user_kwu','seed_post_5',date('now','+8 hours','-1 day'), CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_ack_8','seed_user_ming','seed_post_6',date('now','+8 hours','-2 day'), CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER)),
 ('seed_ack_9','seed_user_siyu','seed_post_8',date('now','+8 hours','-1 day'), CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER)),
 ('seed_ack_10','seed_user_laok','seed_post_9',date('now','+8 hours','-2 day'), CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER));
