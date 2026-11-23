-- 0005: 本地媒体 blob + 三处可上下线的广告位。
-- 纯增量：不改旧迁移、不 DROP 任何表。广告与自然内容分表，带显式「赞助」标识。

CREATE TABLE media_blobs (
  id            TEXT PRIMARY KEY,
  owner_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('avatar', 'profile_cover', 'project_cover')),
  content_type  TEXT NOT NULL,
  size_bytes    INTEGER NOT NULL,
  data          BLOB NOT NULL,
  created_at    INTEGER NOT NULL
);

CREATE INDEX idx_media_owner ON media_blobs(owner_id, created_at DESC);

CREATE TABLE ad_slots (
  id           TEXT PRIMARY KEY,
  placement    TEXT NOT NULL CHECK (placement IN ('left_rail', 'right_rail', 'feed_inline')),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  cta_label    TEXT NOT NULL,
  target_url   TEXT NOT NULL,
  image_url    TEXT,
  badge        TEXT NOT NULL DEFAULT '赞助',
  active       INTEGER NOT NULL DEFAULT 1,
  priority     INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL
);

CREATE INDEX idx_ad_slots_active ON ad_slots(placement, active, priority DESC);
