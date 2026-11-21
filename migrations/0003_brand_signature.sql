-- 0003: 品牌特异功能：每日稀缺同行致敬 (ACK) 与社区同题切磋 (prompts)
-- 纯增量：不修改 0001/0002，不 DROP 任何表。

CREATE TABLE acks (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  day_key    TEXT NOT NULL, -- UTC+8 日期键 YYYY-MM-DD，用于每日 2 次配额统计
  created_at INTEGER NOT NULL,
  UNIQUE (user_id, post_id)
);

CREATE INDEX idx_acks_post     ON acks(post_id);
CREATE INDEX idx_acks_user_day ON acks(user_id, day_key);

CREATE TABLE prompts (
  id         TEXT PRIMARY KEY,
  slug       TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  summary    TEXT NOT NULL,
  tag        TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  ends_at    INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_prompts_status ON prompts(status, ends_at);

ALTER TABLE posts ADD COLUMN prompt_id TEXT REFERENCES prompts(id) ON DELETE SET NULL;
CREATE INDEX idx_posts_prompt ON posts(prompt_id, deleted_at, created_at DESC);
