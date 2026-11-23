-- ImFDE community seed data — high-fidelity FDE profiles, work, feed and interactions.
-- Every generated row uses a stable `seed_*` primary key and a `*@seed.imfde.invalid`
-- email, so scripts/unseed.sql can remove all of it without touching real accounts.
-- Timestamps are relative to insert time and spread over the last 40 minutes..12 days.

-- ─── 0. remove leftover QA/testing accounts (whitelist protected) ───────
-- Real accounts blues / victor / dasheng / dash and all seed_user_* are kept.
DELETE FROM users
 WHERE id NOT LIKE 'seed_user_%'
   AND handle NOT IN ('blues','victor','dasheng','dash')
   AND (handle LIKE 'live%' OR handle LIKE 'plana%' OR handle LIKE 'radar%'
        OR handle LIKE 'probe%' OR handle LIKE 'qa%' OR handle LIKE 'test%'
        OR id IN (SELECT user_id FROM profiles
                   WHERE display_name LIKE '%验收%' OR display_name LIKE '%排查%'
                      OR display_name LIKE '%线上ACK%' OR display_name LIKE '%测试%'));

-- ── A. people ───────────────────────────────────────────────────────────
INSERT OR IGNORE INTO users (id, email, password_hash, handle, kind, status, created_at) VALUES
 ('seed_user_kwu','kwu@seed.imfde.invalid','locked$seed_account_disabled','kwu','individual','active', CAST((strftime('%s','now') - 1036800) * 1000 AS INTEGER)),
 ('seed_user_ming','mchen@seed.imfde.invalid','locked$seed_account_disabled','mchen','individual','active', CAST((strftime('%s','now') - 950400) * 1000 AS INTEGER)),
 ('seed_user_siyu','siyu_z@seed.imfde.invalid','locked$seed_account_disabled','siyu_z','individual','active', CAST((strftime('%s','now') - 864000) * 1000 AS INTEGER)),
 ('seed_user_laok','laok@seed.imfde.invalid','locked$seed_account_disabled','laok','individual','active', CAST((strftime('%s','now') - 777600) * 1000 AS INTEGER)),
 ('seed_user_fieldcraft','fieldcraft@seed.imfde.invalid','locked$seed_account_disabled','fieldcraft','team','active', CAST((strftime('%s','now') - 691200) * 1000 AS INTEGER)),
 ('seed_user_linyu','linyu@seed.imfde.invalid','locked$seed_account_disabled','linyu','individual','active', CAST((strftime('%s','now') - 604800) * 1000 AS INTEGER));

INSERT OR IGNORE INTO profiles (user_id, display_name, avatar_url, cover_url, headline, about, location, timezone, visibility, hide_follows, updated_at) VALUES
 ('seed_user_kwu','吴凯',NULL,NULL,'做制造和物流系统集成，最近主要折腾 ERP + OCR','做了 7 年企业数据集成，这两年主要驻场把大模型接到客户现有的 SAP/金蝶和仓储系统里。比起新模型发版，更关心扫描件带红章怎么不丢字段、断网机房怎么稳住显存。','上海','UTC+8','public',0, CAST((strftime('%s','now') - 7200) * 1000 AS INTEGER)),
 ('seed_user_ming','Ming Chen',NULL,NULL,'Voice AI & telephony. Mostly debugging WebRTC, SIP and noisy calls.','Previously built WebRTC infra, now deploying real-time voice agents for healthcare & logistics call centers. Most of my week is spent staring at VAD traces and weird carrier SIP headers.','旧金山','UTC-8','public',0, CAST((strftime('%s','now') - 14400) * 1000 AS INTEGER)),
 ('seed_user_siyu','郑思雨',NULL,NULL,'企业文档检索和评测，偏重内网部署','帮法务、合规和研发团队做带严格出处的文档问答。坚持先搭 200 条真实难例评测集再动 Prompt，不信没有基准线的调优。','深圳','UTC+8','public',1, CAST((strftime('%s','now') - 21600) * 1000 AS INTEGER)),
 ('seed_user_laok','老K',NULL,NULL,'后端转私有化交付，常年跟离线机房和显存打交道','主要处理私有化交付的最后一公里：离线镜像、老旧 CentOS/麒麟兼容、vLLM 显存分配、调用链路追踪和成本告警。','北京','UTC+8','public',0, CAST((strftime('%s','now') - 28800) * 1000 AS INTEGER)),
 ('seed_user_fieldcraft','Fieldcraft Studio',NULL,NULL,'3 人小团队，做客服工单和内部运维自动化','不做通用平台，只按具体业务流驻场交付可观测的自动化系统。所有上线流程默认先跑两周 Shadow Mode 对比人工回复，达标再灰度切流量。','杭州','UTC+8','public',0, CAST((strftime('%s','now') - 36000) * 1000 AS INTEGER)),
 ('seed_user_linyu','林予',NULL,NULL,'Browser automation & ERP glue for cross-border logistics','一半时间写 Playwright 和状态机，一半时间和清关、货代操作员坐在一起看他们每天重复点哪些老网页。','新加坡','UTC+8','public',0, CAST((strftime('%s','now') - 43200) * 1000 AS INTEGER));

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
 ('seed_post_1','seed_user_kwu','build','刚把红章磅单那套 OCR 整理传上来了。以前直接整页喂 VLM 经常把金额小数点看串，先用 OpenCV 扣掉红通道再识稳很多 #OCR','seed_proj_1','public', CAST((strftime('%s','now') - 2400) * 1000 AS INTEGER), CAST((strftime('%s','now') - 2400) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_2','seed_user_ming','thought','调了一上午电话语音助手，客户老 PBX 动不动抖动 300ms，VAD 没做自适应缓冲直接把人家话打断了，听着太尴尬了 #语音交互',NULL,'public', CAST((strftime('%s','now') - 7200) * 1000 AS INTEGER), CAST((strftime('%s','now') - 7200) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_3','seed_user_siyu','discussion','财务报告里的跨页合并单元格你们一般怎么解？试了三个 PDF 解析器表头全丢，目前只能转图重叠丢小 VLM，有没有更省事的办法 #RAG',NULL,'public', CAST((strftime('%s','now') - 10800) * 1000 AS INTEGER), CAST((strftime('%s','now') - 10800) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_4','seed_user_laok','build','又进断网机房了，宿主机还是 CentOS 7，glibc 老得一批。索性把离线打包、CUDA 检查和 OOM 保护脚本整理开源了，省得下次再通宵 #私有部署','seed_proj_6','public', CAST((strftime('%s','now') - 18000) * 1000 AS INTEGER), CAST((strftime('%s','now') - 18000) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_5','seed_user_fieldcraft','show','飞书告警分诊助手整理了个案例页。上线前先在后台静默跑了两周对比 186 条真实告警，确认不太会乱 @ 人才敢放进值班群 #Agent','seed_proj_7','public', CAST((strftime('%s','now') - 28800) * 1000 AS INTEGER), CAST((strftime('%s','now') - 28800) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_6','seed_user_linyu','thought','客户又问能不能全自动清关不用人看。我还是坚持最后点提交前留给人扫一眼，省 15 分钟变成 10 秒已经够了，错一单谁也担不起',NULL,'public', CAST((strftime('%s','now') - 43200) * 1000 AS INTEGER), CAST((strftime('%s','now') - 43200) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_7','seed_user_kwu','thought','给客户包了个 SAP 只读接口，看日志才发现有人拿查询工具批量拖整张物料表。只读不代表安全，限流和字段脱敏还是得加上',NULL,'public', CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER), CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_8','seed_user_ming','show','p95 barge-in latency was 210ms in the office and jumped to 1.1s on highway call recordings. Never tune VAD on clean audio. #Eval',NULL,'public', CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER), CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_9','seed_user_siyu','build','拿 200 条法务难例跑了遍引用核查，页码编造基本能抓出来，但跨条款偷换前提还是容易漏，误报大概 11%，先这样上内测看看 #Eval','seed_proj_5','public', CAST((strftime('%s','now') - 259200) * 1000 AS INTEGER), CAST((strftime('%s','now') - 259200) * 1000 AS INTEGER), NULL, NULL),
 ('seed_post_10','seed_user_laok','thought','跨运营商线路抖动有时能飙到七八百毫秒，我们后来顺手把 TTS 首包预生成了才没那么卡',NULL,'public', CAST((strftime('%s','now') - 432000) * 1000 AS INTEGER), CAST((strftime('%s','now') - 432000) * 1000 AS INTEGER), NULL, 'seed_post_2'),
 ('seed_post_11','seed_user_fieldcraft','thought','我们也是切图加 15% 重叠送小模型，省心，就是比纯文本解析慢点',NULL,'public', CAST((strftime('%s','now') - 604800) * 1000 AS INTEGER), CAST((strftime('%s','now') - 604800) * 1000 AS INTEGER), NULL, 'seed_post_3'),
 ('seed_post_12','seed_user_linyu','show','',NULL,'public', CAST((strftime('%s','now') - 1036800) * 1000 AS INTEGER), CAST((strftime('%s','now') - 1036800) * 1000 AS INTEGER), NULL, 'seed_post_2');

INSERT OR IGNORE INTO post_tags (post_id, tag) VALUES
 ('seed_post_1','OCR'),
 ('seed_post_2','语音交互'),
 ('seed_post_3','RAG'),
 ('seed_post_4','私有部署'),
 ('seed_post_5','Agent'),
 ('seed_post_8','Eval'),
 ('seed_post_9','Eval');

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
 ('seed_cmt_1','seed_post_3','seed_user_kwu',NULL,'切图 + 15% 重叠送小 VLM，表头基本能回来，就是每页多一次调用', CAST((strftime('%s','now') - 9000) * 1000 AS INTEGER), NULL),
 ('seed_cmt_2','seed_post_3','seed_user_laok',NULL,'batch=4 大概 6G 显存，我们在 3060 上也能跑', CAST((strftime('%s','now') - 7200) * 1000 AS INTEGER), NULL),
 ('seed_cmt_3','seed_post_3','seed_user_siyu','seed_cmt_1','表头拼接是规则还是模型自己判断？我们这列名偶尔会变', CAST((strftime('%s','now') - 6300) * 1000 AS INTEGER), NULL),
 ('seed_cmt_4','seed_post_3','seed_user_kwu','seed_cmt_3','规则，第一页列名当 schema 固定住，后面只填值', CAST((strftime('%s','now') - 5400) * 1000 AS INTEGER), NULL),
 ('seed_cmt_5','seed_post_2','seed_user_fieldcraft',NULL,'VAD 阈值设多少？我们 350ms 触发，车载噪声下老误触发', CAST((strftime('%s','now') - 5400) * 1000 AS INTEGER), NULL),
 ('seed_cmt_6','seed_post_2','seed_user_ming','seed_cmt_5','别用固定阈值，按最近 2 秒底噪动态算，误触发少很多', CAST((strftime('%s','now') - 3600) * 1000 AS INTEGER), NULL),
 ('seed_cmt_7','seed_post_2','seed_user_laok',NULL,'还有个坑：有的运营商 RTP 包晚到七八百毫秒，得在 jitter buffer 那层稳一下', CAST((strftime('%s','now') - 1800) * 1000 AS INTEGER), NULL),
 ('seed_cmt_8','seed_post_1','seed_user_ming',NULL,'半透明红章直接减通道会伤到底下的字，我们一般先拉一下对比度', CAST((strftime('%s','now') - 1200) * 1000 AS INTEGER), NULL),
 ('seed_cmt_9','seed_post_1','seed_user_kwu','seed_cmt_8','对，先做对比度拉伸再分离就好，这类样本大概占 8%', CAST((strftime('%s','now') - 600) * 1000 AS INTEGER), NULL),
 ('seed_cmt_10','seed_post_5','seed_user_siyu',NULL,'误报 4% 你们怎么判定的？我们也想定个 Shadow Mode 的门槛', CAST((strftime('%s','now') - 21600) * 1000 AS INTEGER), NULL),
 ('seed_cmt_11','seed_post_5','seed_user_fieldcraft','seed_cmt_10','让值班同学盲评，只看助手判断，标会不会照着做', CAST((strftime('%s','now') - 18000) * 1000 AS INTEGER), NULL),
 ('seed_cmt_12','seed_post_6','seed_user_linyu','seed_cmt_11','留人工确认是对的。我们去掉过一次，箱号填错赔过钱', CAST((strftime('%s','now') - 36000) * 1000 AS INTEGER), NULL);

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

-- ── F. radar items: 每小时外部机会/新工具的初始示例（外部来源，平台不核实）──
INSERT OR IGNORE INTO radar_items
 (id, kind, source, source_url, title, summary, tag, meta, published_at, fetched_at) VALUES
 ('seed_radar_opp_1','opportunity','HN','https://news.ycombinator.com/item?id=seed1',
  '有团队在招能把 RAG 跑进内网的人',
  '帖子说文档检索原型在演示环境跑得通，一进客户内网就被权限和网络隔离卡住，想找能驻场把链路打通的人。',
  'RAG','HN · 63 评',
  CAST((strftime('%s','now') - 3600) * 1000 AS INTEGER), CAST((strftime('%s','now') - 600) * 1000 AS INTEGER)),
 ('seed_radar_opp_2','opportunity','HN','https://news.ycombinator.com/item?id=seed2',
  'Ask HN：语音机器人怎么扛住真实电话线',
  '提问者在线上遇到回声、断连和转写延迟，问有没有人实际在运营商线路上做过 voice agent 的落地。',
  '语音交互','HN · 41 评',
  CAST((strftime('%s','now') - 7200) * 1000 AS INTEGER), CAST((strftime('%s','now') - 900) * 1000 AS INTEGER)),
 ('seed_radar_opp_3','opportunity','HN','https://news.ycombinator.com/item?id=seed3',
  '离线机房里的模型更新还在靠 U 盘',
  '评论里有人描述客户现场没有外网，镜像、权重和校验都要人工带进去，问有没有更稳的做法。',
  '私有部署','HN · 28 评',
  CAST((strftime('%s','now') - 10800) * 1000 AS INTEGER), CAST((strftime('%s','now') - 1200) * 1000 AS INTEGER)),
 ('seed_radar_opp_4','opportunity','HN','https://news.ycombinator.com/item?id=seed4',
  '制造业客户想把旧单据表格自动录进系统',
  '扫描件跨页、盖章和字段错位让 OCR 提取一直返工，帖子在找能到现场调规则、对接 ERP 的人。',
  'OCR','HN · 19 评',
  CAST((strftime('%s','now') - 14400) * 1000 AS INTEGER), CAST((strftime('%s','now') - 1500) * 1000 AS INTEGER)),
 ('seed_radar_tool_1','tool','GitHub','https://github.com/seed-imfde/seed-mcp-tool',
  '给内部系统加 MCP 接口的轻量脚手架',
  '把已有的 REST 接口包成 MCP 工具，配置和鉴权写在一份清单里，适合现场快速接一个只读数据源。',
  'MCP','GitHub · 1.2k ★',
  CAST((strftime('%s','now') - 86400) * 1000 AS INTEGER), CAST((strftime('%s','now') - 700) * 1000 AS INTEGER)),
 ('seed_radar_tool_2','tool','GitHub','https://github.com/seed-imfde/seed-eval-tool',
  '按真实失败样本跑 Prompt 回归的评测脚本',
  '把线上出错的输入攒成用例集，改完提示词后在本地批量对比输出，避免凭感觉调参。',
  'Eval','GitHub · 860 ★',
  CAST((strftime('%s','now') - 172800) * 1000 AS INTEGER), CAST((strftime('%s','now') - 800) * 1000 AS INTEGER)),
 ('seed_radar_tool_3','tool','GitHub','https://github.com/seed-imfde/seed-ocr-tool',
  '扫描单据表格提取的字段校验层',
  '在 OCR 结果之上加一层字段规则和跨页合并，输出结构化 JSON，方便直接喂给业务系统。',
  'OCR','GitHub · 540 ★',
  CAST((strftime('%s','now') - 259200) * 1000 AS INTEGER), CAST((strftime('%s','now') - 950) * 1000 AS INTEGER)),
 ('seed_radar_tool_4','tool','GitHub','https://github.com/seed-imfde/seed-vllm-tool',
  '单卡机器上跑 vLLM 的部署检查清单',
  '把显存、并发和量化参数整理成一份可复用的检查步骤，适合在客户机房里按项核对。',
  '私有部署','GitHub · 320 ★',
  CAST((strftime('%s','now') - 345600) * 1000 AS INTEGER), CAST((strftime('%s','now') - 1100) * 1000 AS INTEGER));

-- ── G. 三处克制的赞助位示例（与自然内容分表，显式标注）──
INSERT OR IGNORE INTO ad_slots
 (id, placement, title, description, cta_label, target_url, image_url, badge, active, priority, created_at) VALUES
 ('seed_ad_left','left_rail','把项目放到同行面前','给在场做交付的人看作品，不写推荐语。','了解主页','https://imfde.ai/discover','', '赞助',1,10, CAST((strftime('%s','now')) * 1000 AS INTEGER)),
 ('seed_ad_right','right_rail','写点现场踩过的坑','一条短动态就够，别人会按方向找到你。','去广场','https://imfde.ai/feed','', '赞助',1,10, CAST((strftime('%s','now')) * 1000 AS INTEGER)),
 ('seed_ad_inline','feed_inline','把做过的项目放上来','发一条动态，同行会按方向找到你。','建主页','https://imfde.ai/join','', '赞助',1,10, CAST((strftime('%s','now')) * 1000 AS INTEGER));

-- ── H. 招聘信息与接单机会（intel_items，国内外 + 完整站内解读）──
INSERT OR IGNORE INTO intel_items
 (id, kind, region, source, source_url, title, company, location, budget, summary, detail_md, tag, meta, published_at, fetched_at) VALUES
 ('seed_intel_j1','job','overseas','Ashby','https://jobs.ashbyhq.com/cohere','Cohere 招驻场解决方案工程师','Cohere','多伦多 / 纽约 · Hybrid','$180k-$240k','企业客户把检索接到生产环境时，需要有人驻场把模型、权限和现有系统接起来，不是只交一份 POC。','需求/岗位背景：Cohere 的企业业务在金融与政企客户扩张，客户拿到模型后卡在权限、内网和现有系统的对接上，需要解决方案工程师到现场把链路跑通。' || char(10) || '核心要求：熟悉 RAG 与检索评测，能和客户的平台、安全团队直接沟通；有过私有化或 VPC 部署经验，能读懂日志与延迟指标。' || char(10) || '方式与备注：按客户项目出差，周期通常数周；投递前准备一个把检索系统接进真实业务流的案例，说明你会怎么处理权限与离线环境。','RAG','全职', CAST((strftime('%s','now') - 72000) * 1000 AS INTEGER), CAST((strftime('%s','now') - 720) * 1000 AS INTEGER)),
 ('seed_intel_j2','job','overseas','Greenhouse','https://boards.greenhouse.io/scaleai','Scale AI 找部署工程师','Scale AI','旧金山 · Hybrid','$190k-$250k','客户数据往往散在内网和旧系统里，这个岗位负责把模型评估与数据管线真正落到客户的环境中。','需求/岗位背景：Scale AI 的政府与企业团队需要有人在客户现场把评估流程、数据接入和标注系统串起来，而不是远程丢脚本。' || char(10) || '核心要求：能写可靠的 Python 服务，理解数据合规与权限边界；遇到客户的老系统能自己查接口、定方案。' || char(10) || '方式与备注：涉及政府项目，通常需要相应身份与现场条件；投递时把重点放在你做过的集成与排障，而不是模型调参。','FDE','全职', CAST((strftime('%s','now') - 158400) * 1000 AS INTEGER), CAST((strftime('%s','now') - 1080) * 1000 AS INTEGER)),
 ('seed_intel_j3','job','overseas','HN','https://news.ycombinator.com/item?id=41332221','AI Agent 初创招首批 FDE','Stealth Startup','纽约 / 远程','$160k-$220k','早期团队找第一个能上门的工程师：客户有多少 Agent 上线，取决于你能不能把接口和权限当场理清。','需求/岗位背景：一家做 Agent 平台的初创拿到设计伙伴后，发现每家客户的系统都不一样，需要第一个 FDE 帮他们把部署流程沉淀成可复用的方法。' || char(10) || '核心要求：全栈能力够用，能自己写 API、看日志、跟客户的 IT 打交道；对 Agent 的失败模式有实际判断。' || char(10) || '方式与备注：早期出差较多，股权占比可观但不承诺；先在帖子评论区确认团队与融资状态，再决定要不要投入。','Agent','远程', CAST((strftime('%s','now') - 244800) * 1000 AS INTEGER), CAST((strftime('%s','now') - 1500) * 1000 AS INTEGER)),
 ('seed_intel_j4','job','domestic','V2EX','https://www.v2ex.com/go/jobs','上海团队招大模型落地工程师','匿名 FDE 团队','上海 · 驻场','35-55k/月','客户是制造与物流企业，需求是把大模型接进 ERP 和内部文档系统，现场要能和业务人员一起调试。','需求/岗位背景：团队给制造和物流客户做私有化落地，项目从需求梳理到上线通常由两三个人跟到底，缺一个能驻场把链路打通的人。' || char(10) || '核心要求：做过 RAG 或文档检索，能读 ERP 接口；遇到扫描件、权限和内网限制有实际处理经验。' || char(10) || '方式与备注：驻场周期按项目算，通常一到三个月；发帖方在 V2EX 招聘节点，投递前确认社保与项目差旅安排。','私有部署','驻场', CAST((strftime('%s','now') - 36000) * 1000 AS INTEGER), CAST((strftime('%s','now') - 480) * 1000 AS INTEGER)),
 ('seed_intel_j5','job','domestic','电鸭','https://eleduck.com/','远程岗位：语音交互落地','AI 产品团队','北京 / 远程','30-45k/月','电话机器人进了真实线路才发现回声和转写延迟，团队需要有人能把 VAD 与缓冲策略按场景调稳。','需求/岗位背景：一家做语音交互的团队在车载与客服场景上线后，遇到运营商线路、弱网和回声问题，需要专门的人盯端到端延迟。' || char(10) || '核心要求：理解 WebRTC/SIP 链路，能定位转写延迟来自哪一段；有真实的电话线或车载音频调优经验。' || char(10) || '方式与备注：可远程，但每月需要一到两次现场联调；电鸭帖子确认是否签劳动合同，避免把驻场做成长期外包。','语音交互','远程', CAST((strftime('%s','now') - 122400) * 1000 AS INTEGER), CAST((strftime('%s','now') - 840) * 1000 AS INTEGER)),
 ('seed_intel_j6','job','domestic','V2EX','https://www.v2ex.com/t/930142','RAG 评测工程师，偏内网部署','企业服务团队','深圳 · 驻场','28-42k/月','客户在内网跑文档检索，评测集要从真实工单里建，而不是只跑公开 benchmark 的数字。','需求/岗位背景：团队给金融与制造企业做内网知识库，客户关心的是回答能不能追溯到原文、出错时能不能定位，需要一个懂评测的人。' || char(10) || '核心要求：能设计基于真实业务的评测集，熟悉检索召回与重排；能在没有外网的环境里搭起评测流程。' || char(10) || '方式与备注：现场工作为主；投递时准备一段说明你如何把评测结果转成客户可接受的改动，而不是罗列指标。','RAG','驻场', CAST((strftime('%s','now') - 187200) * 1000 AS INTEGER), CAST((strftime('%s','now') - 1320) * 1000 AS INTEGER)),
 ('seed_intel_g1','gig','overseas','HN','https://news.ycombinator.com/item?id=41320001','找人接手 ERP 的 Agent 集成','Ask HN','全球远程','预算 $6k-$10k','发帖方有一套老旧 ERP，想让 Agent 自动处理报关单据，缺一个能把接口和异常处理一起做掉的人。','需求/岗位背景：一家跨境物流团队想把报关单据的录入自动化，现有 ERP 没有开放 API，需要有人先确认可行的接入点再动手。' || char(10) || '核心要求：做过 ERP 或内部系统对接，能处理扫描件与字段错位；愿意先做一小段付费诊断再报总价。' || char(10) || '方式与备注：HN 帖子评论区联系，先要清楚数据样本和权限范围；把交付拆成诊断、试点、上线三段，避免一次性承诺。','Agent','项目', CAST((strftime('%s','now') - 28800) * 1000 AS INTEGER), CAST((strftime('%s','now') - 360) * 1000 AS INTEGER)),
 ('seed_intel_g2','gig','overseas','GitHub Bounty','https://github.com/topics/bounty','OCR 表格提取的悬赏任务','开源项目','全球远程','$2,500 赏金','项目需要把扫描单据里的跨页表格提取成结构化 JSON，现有方案在印章和错位字段上一直返工。','需求/岗位背景：一个开源发票处理项目在 GitHub 上挂了赏金，目标是把 OCR 结果整理成稳定的表格结构，输入是真实扫描件。' || char(10) || '核心要求：能处理表格检测与跨页合并，写清楚失败样例；交付包含测试和可复用的规则配置。' || char(10) || '方式与备注：赏金通过 GitHub 平台结算，先在 issue 里确认样本和验收口径；不要在没有样本的情况下估工期。','OCR','悬赏', CAST((strftime('%s','now') - 93600) * 1000 AS INTEGER), CAST((strftime('%s','now') - 960) * 1000 AS INTEGER)),
 ('seed_intel_g3','gig','overseas','Reddit','https://www.reddit.com/r/forhire/new/','求人做 MCP 接口封装','r/forhire','美国 / 远程','$3k-$5k','客户有若干内部 REST 服务，希望包成 MCP 工具给 Agent 调用，重点是把鉴权和只读边界写清楚。','需求/岗位背景：发帖方在做一套内部 Agent，需要把现有 REST 服务按 MCP 规范暴露出去，同时保证敏感接口只读。' || char(10) || '核心要求：熟悉 MCP 规范与工具描述，能处理 token 透传和字段裁剪；交付包含文档与本地联调脚本。' || char(10) || '方式与备注：Reddit 私信联系，先确认对方是否接受里程碑付款；把权限模型写进合同，避免后期追加范围。','MCP','项目', CAST((strftime('%s','now') - 57600) * 1000 AS INTEGER), CAST((strftime('%s','now') - 660) * 1000 AS INTEGER)),
 ('seed_intel_g4','gig','domestic','电鸭','https://eleduck.com/posts/8f3k2a','外包：私有化部署一个 RAG 原型','电鸭项目合作','北京 / 上海','预算 5-8 万','客户在内网环境做文档检索原型，要能在没有外网的机器上跑起来，并给出可交接的部署文档。','需求/岗位背景：一家企业服务团队接了个内网知识库项目，需要在客户机房里把一个 RAG 原型跑通并交给他们的运维。' || char(10) || '核心要求：能在离线环境装好模型与向量库，处理依赖和权重拷贝；写清部署步骤和常见故障排查。' || char(10) || '方式与备注：电鸭帖子可跟帖报价；建议按环境确认、部署试点、文档交接三段交付，尾款在验收后结。','私有部署','项目', CAST((strftime('%s','now') - 50400) * 1000 AS INTEGER), CAST((strftime('%s','now') - 540) * 1000 AS INTEGER)),
 ('seed_intel_g5','gig','domestic','V2EX','https://www.v2ex.com/t/931208','找人做工作流自动化改造','V2EX 外包','远程','预算 3-5 万','客户的工单和内部表格之间还在人工复制，希望用自动化脚本把重复录入和通知替换掉。','需求/岗位背景：一个十人小团队内部流程靠人工搬运数据，想先把工单到表格这一段自动化，后续再接更多系统。' || char(10) || '核心要求：做过工作流或 RPA 类项目，能读现有系统的接口或导出格式；交付包含异常处理和回退说明。' || char(10) || '方式与备注：V2EX 帖子联系；先做一页流程图确认范围，再按模块报价，避免把模糊需求一口吃下。','Agent','项目', CAST((strftime('%s','now') - 144000) * 1000 AS INTEGER), CAST((strftime('%s','now') - 1200) * 1000 AS INTEGER)),
 ('seed_intel_g6','gig','domestic','电鸭','https://eleduck.com/posts/2m7q9c','语音机器人联调外包','电鸭项目合作','上海 · 驻场','预算 4-6 万','电话机器人在运营商线路上有回声和断连，发帖方需要有人到现场把音频链路和转写延迟一起排查。','需求/岗位背景：一家客服系统团队在客户现场上线语音机器人后发现真实线路与测试环境差异很大，需要一次集中联调。' || char(10) || '核心要求：熟悉 SIP/WebRTC 链路，能抓包定位回声来源；现场和客户IT一起改配置并留下问题清单。' || char(10) || '方式与备注：电鸭可跟帖或私信；按人天报价并写明差旅，联调结束后留一份可复用的排查清单给客户。','语音交互','驻场', CAST((strftime('%s','now') - 223200) * 1000 AS INTEGER), CAST((strftime('%s','now') - 1680) * 1000 AS INTEGER));

-- ── A2. international FDE seeds (ja / ko / en / en) ─────────────────────
INSERT OR IGNORE INTO users (id, email, password_hash, handle, kind, status, created_at) VALUES
 ('seed_user_kenji','kenji@seed.imfde.invalid','locked$seed_account_disabled','ksato_fde','individual','active',CAST((strftime('%s','now') - 576000) * 1000 AS INTEGER)),
 ('seed_user_minji','minji@seed.imfde.invalid','locked$seed_account_disabled','minji_ops','individual','active',CAST((strftime('%s','now') - 547200) * 1000 AS INTEGER)),
 ('seed_user_elena','elena@seed.imfde.invalid','locked$seed_account_disabled','erostova','individual','active',CAST((strftime('%s','now') - 518400) * 1000 AS INTEGER)),
 ('seed_user_devon','devon@seed.imfde.invalid','locked$seed_account_disabled','dbrooks','individual','active',CAST((strftime('%s','now') - 489600) * 1000 AS INTEGER));

INSERT OR IGNORE INTO profiles (user_id, display_name, avatar_url, cover_url, headline, about, location, timezone, visibility, hide_follows, updated_at) VALUES
 ('seed_user_kenji','Kenji Sato (佐藤 健司)',NULL,NULL,'工場・物流向けのエッジ推論と画像検査の現場導入。古いPLCとの連携が多いです。','工場や物流現場で画像検査とエッジ推論を導入しています。古いPLCや独自プロトコルとの接続が仕事の半分。現場のネットワーク制約を前提に設計します。','東京','UTC+9','public',0,CAST((strftime('%s','now') - 432000) * 1000 AS INTEGER)),
 ('seed_user_minji','Minji Park (박민지)',NULL,NULL,'금융·커머스 고객사 Voice Agent 및 사내 RAG 구축. 실제 콜 로그 기반 Eval 위주로 작업합니다.','금융과 커머스 고객사에서 voice agent와 사내 RAG를 구축합니다. 데모보다 실제 콜 로그 기반 eval과 운영 안정성에 시간을 많이 씁니다.','首尔','UTC+9','public',0,CAST((strftime('%s','now') - 403200) * 1000 AS INTEGER)),
 ('seed_user_elena','Elena Rostova',NULL,NULL,'Forward deployed engineer wiring legacy SAP & SharePoint into auditable enterprise RAG.','I work on the unglamorous part of enterprise AI: connecting old SAP and SharePoint systems to retrieval that can actually be audited. Mostly on-site with regulated customers.','柏林','UTC+1','public',0,CAST((strftime('%s','now') - 374400) * 1000 AS INTEGER)),
 ('seed_user_devon','Devon Brooks',NULL,NULL,'Deploying claims triage agents for healthcare ops. Mostly writing eval harnesses and human-in-the-loop fallbacks.','Healthcare ops, claims triage agents. A lot of my time goes into eval harnesses and deciding where a human needs to stay in the loop before anything ships.','纽约','UTC-5','public',0,CAST((strftime('%s','now') - 345600) * 1000 AS INTEGER));

INSERT OR IGNORE INTO profile_skills (user_id, skill_name, position) VALUES
 ('seed_user_kenji','私有部署',0),
 ('seed_user_kenji','OCR',1),
 ('seed_user_kenji','vLLM',2),
 ('seed_user_kenji','Python',3),
 ('seed_user_kenji','Edge AI',4),
 ('seed_user_minji','语音交互',0),
 ('seed_user_minji','RAG',1),
 ('seed_user_minji','Eval',2),
 ('seed_user_minji','TypeScript',3),
 ('seed_user_minji','LiveKit',4),
 ('seed_user_elena','RAG',0),
 ('seed_user_elena','MCP',1),
 ('seed_user_elena','私有部署',2),
 ('seed_user_elena','Go',3),
 ('seed_user_elena','Eval',4),
 ('seed_user_devon','Agent 编排',0),
 ('seed_user_devon','Eval',1),
 ('seed_user_devon','工作流自动化',2),
 ('seed_user_devon','Python',3),
 ('seed_user_devon','Playwright',4);

INSERT OR IGNORE INTO external_accounts (id, user_id, provider, provider_user_id, profile_url, connection, position, created_at) VALUES
 ('seed_ext_kenji_gh','seed_user_kenji','github',NULL,'https://github.com/ksato-edge','link',0,CAST((strftime('%s','now') - 547200) * 1000 AS INTEGER)),
 ('seed_ext_kenji_web','seed_user_kenji','website',NULL,'https://ksato.dev','link',1,CAST((strftime('%s','now') - 547200) * 1000 AS INTEGER)),
 ('seed_ext_minji_gh','seed_user_minji','github',NULL,'https://github.com/minji-ops','link',0,CAST((strftime('%s','now') - 518400) * 1000 AS INTEGER)),
 ('seed_ext_minji_li','seed_user_minji','linkedin',NULL,'https://www.linkedin.com/in/minji-voice','link',1,CAST((strftime('%s','now') - 518400) * 1000 AS INTEGER)),
 ('seed_ext_elena_gh','seed_user_elena','github',NULL,'https://github.com/erostova','link',0,CAST((strftime('%s','now') - 489600) * 1000 AS INTEGER)),
 ('seed_ext_elena_li','seed_user_elena','linkedin',NULL,'https://www.linkedin.com/in/erostova-fde','link',1,CAST((strftime('%s','now') - 489600) * 1000 AS INTEGER)),
 ('seed_ext_devon_gh','seed_user_devon','github',NULL,'https://github.com/dbrooks-eval','link',0,CAST((strftime('%s','now') - 460800) * 1000 AS INTEGER)),
 ('seed_ext_devon_x','seed_user_devon','x',NULL,'https://x.com/dbrooks_ops','link',1,CAST((strftime('%s','now') - 460800) * 1000 AS INTEGER));

INSERT OR IGNORE INTO follows (follower_id, followed_id, created_at) VALUES
 ('seed_user_kenji','seed_user_linyu',CAST((strftime('%s','now') - 518400) * 1000 AS INTEGER)),
 ('seed_user_kenji','seed_user_minji',CAST((strftime('%s','now') - 489600) * 1000 AS INTEGER)),
 ('seed_user_minji','seed_user_ming',CAST((strftime('%s','now') - 489600) * 1000 AS INTEGER)),
 ('seed_user_minji','seed_user_elena',CAST((strftime('%s','now') - 460800) * 1000 AS INTEGER)),
 ('seed_user_elena','seed_user_siyu',CAST((strftime('%s','now') - 460800) * 1000 AS INTEGER)),
 ('seed_user_elena','seed_user_devon',CAST((strftime('%s','now') - 432000) * 1000 AS INTEGER)),
 ('seed_user_devon','seed_user_ming',CAST((strftime('%s','now') - 432000) * 1000 AS INTEGER)),
 ('seed_user_devon','seed_user_kenji',CAST((strftime('%s','now') - 403200) * 1000 AS INTEGER)),
 ('seed_user_kwu','seed_user_kenji',CAST((strftime('%s','now') - 345600) * 1000 AS INTEGER)),
 ('seed_user_linyu','seed_user_minji',CAST((strftime('%s','now') - 345600) * 1000 AS INTEGER));

INSERT OR IGNORE INTO posts (id, author_id, kind, body, project_id, visibility, created_at, updated_at, deleted_at, repost_of_id) VALUES
 ('seed_post_kenji','seed_user_kenji','build','古いPLCのファーム更新が工場停止時間とぶつかる。夜間バッチにずらしてから画像検査の再デプロイが安定した #OCR',NULL,'public',CAST((strftime('%s','now') - 504000) * 1000 AS INTEGER),CAST((strftime('%s','now') - 504000) * 1000 AS INTEGER),NULL,NULL),
 ('seed_post_minji','seed_user_minji','thought','콜 로그 200개쯤 모아서 eval 돌려보니 VAD 끝점을 80ms만 앞당겨도 끊김 체감이 확 달라졌다. 수치보다 체감이 먼저 바뀜 #语音交互',NULL,'public',CAST((strftime('%s','now') - 475200) * 1000 AS INTEGER),CAST((strftime('%s','now') - 475200) * 1000 AS INTEGER),NULL,NULL),
 ('seed_post_elena','seed_user_elena','build','SharePoint permissions changed twice mid-migration. Ended up snapshotting the ACLs per run so the RAG index can be audited later #RAG',NULL,'public',CAST((strftime('%s','now') - 446400) * 1000 AS INTEGER),CAST((strftime('%s','now') - 446400) * 1000 AS INTEGER),NULL,NULL),
 ('seed_post_devon','seed_user_devon','discussion','Anyone keep a human-in-the-loop rule that is not just "low confidence"? We are testing escalation on missing source citations instead #Eval',NULL,'public',CAST((strftime('%s','now') - 417600) * 1000 AS INTEGER),CAST((strftime('%s','now') - 417600) * 1000 AS INTEGER),NULL,NULL);
