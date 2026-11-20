-- 0002: 广场（信息流）所需的最小增量
-- 原则：不引入外部服务，不新增可解释性之外的字段。转发与话题都只是
-- posts 的附加关系，删掉任何一边都不影响原文存在。

-- 引用转发 / 纯转发：指向被转发的原帖。原帖被删时转发的壳仍保留文字。
ALTER TABLE posts ADD COLUMN repost_of_id TEXT REFERENCES posts(id) ON DELETE SET NULL;

CREATE INDEX idx_posts_repost_of_id ON posts(repost_of_id);

-- #话题：一对多铺平，便于按标签筛选与统计热门标签。
CREATE TABLE post_tags (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag     TEXT NOT NULL,
  PRIMARY KEY (post_id, tag)
);

CREATE INDEX idx_post_tags_tag ON post_tags(tag);
