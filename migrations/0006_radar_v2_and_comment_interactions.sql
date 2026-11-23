-- 0006: 招聘/接单情报 v2 + 留言区同级互动。
-- 纯增量：保留 radar_items 兼容旧数据，只增新表/新列，不 DROP。

CREATE TABLE intel_items (
  id           TEXT PRIMARY KEY,
  kind         TEXT NOT NULL CHECK (kind IN ('job', 'gig')),
  region       TEXT NOT NULL CHECK (region IN ('domestic', 'overseas')),
  source       TEXT NOT NULL,
  source_url   TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  company      TEXT,
  location     TEXT,
  budget       TEXT,
  summary      TEXT NOT NULL,
  detail_md    TEXT NOT NULL,
  tag          TEXT NOT NULL,
  meta         TEXT,
  published_at INTEGER NOT NULL,
  fetched_at   INTEGER NOT NULL
);

CREATE INDEX idx_intel_kind_region_time ON intel_items(kind, region, fetched_at DESC, published_at DESC);

CREATE TABLE comment_likes (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, comment_id)
);

CREATE TABLE comment_acks (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  day_key    TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (user_id, comment_id)
);

CREATE TABLE comment_bookmarks (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, comment_id)
);

ALTER TABLE posts ADD COLUMN repost_comment_id TEXT REFERENCES comments(id) ON DELETE SET NULL;

CREATE INDEX idx_comment_likes_cid ON comment_likes(comment_id);
CREATE INDEX idx_comment_acks_cid ON comment_acks(comment_id);
CREATE INDEX idx_comment_acks_user_day ON comment_acks(user_id, day_key);
CREATE INDEX idx_comment_bookmarks_user ON comment_bookmarks(user_id);
CREATE INDEX idx_posts_repost_comment ON posts(repost_comment_id);
