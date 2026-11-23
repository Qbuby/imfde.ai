-- 0004: 每小时雷达抓取的机会与新工具条目。
-- 纯增量：保留 prompts 表不动（历史帖子还指着它），不修改 0001-0003，不 DROP 任何表。
-- 外部链接只在这里落一条客观记录；所有提炼摘要遵守 imfde-unslop。

CREATE TABLE radar_items (
  id            TEXT PRIMARY KEY,
  kind          TEXT NOT NULL CHECK (kind IN ('opportunity', 'tool')),
  source        TEXT NOT NULL,           -- 如 HN / GitHub
  source_url    TEXT NOT NULL UNIQUE,    -- 防重复入库
  title         TEXT NOT NULL,
  summary       TEXT NOT NULL,
  tag           TEXT NOT NULL,
  meta          TEXT,                    -- 客观指标，如 GitHub · 1.2k ★ / HN · 84 评
  published_at  INTEGER NOT NULL,
  fetched_at    INTEGER NOT NULL
);

CREATE INDEX idx_radar_kind_time ON radar_items(kind, fetched_at DESC, published_at DESC);
