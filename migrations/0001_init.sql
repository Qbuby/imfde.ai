-- iMFDE MVP schema
-- 原则：所有 "自述 / 外部链接 / 已连接账号 / 平台行为" 在数据层就是不同字段，
-- 不允许在展示层模糊成 "已认证"。

PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  handle        TEXT NOT NULL UNIQUE,
  kind          TEXT NOT NULL DEFAULT 'individual'
                CHECK (kind IN ('individual','team')),
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','limited','banned')),
  created_at    INTEGER NOT NULL
);

CREATE TABLE profiles (
  user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url   TEXT,
  cover_url    TEXT,
  headline     TEXT,
  about        TEXT,
  location     TEXT,
  timezone     TEXT,
  visibility   TEXT NOT NULL DEFAULT 'public'
               CHECK (visibility IN ('public','private')),
  hide_follows INTEGER NOT NULL DEFAULT 0,
  updated_at   INTEGER NOT NULL
);

CREATE TABLE profile_skills (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, skill_name)
);

CREATE TABLE external_accounts (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL
                   CHECK (provider IN ('github','linkedin','huggingface','website','x','blog')),
  provider_user_id TEXT,
  profile_url      TEXT NOT NULL,
  connection       TEXT NOT NULL DEFAULT 'link'
                   CHECK (connection IN ('link','connected')),
  position         INTEGER NOT NULL DEFAULT 0,
  created_at       INTEGER NOT NULL,
  UNIQUE (user_id, provider, profile_url)
);

CREATE TABLE projects (
  id          TEXT PRIMARY KEY,
  owner_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'project'
              CHECK (kind IN ('project','agent','tool','automation','case','oss')),
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL,
  description TEXT,
  cover_url   TEXT,
  demo_url    TEXT,
  docs_url    TEXT,
  repo_url    TEXT,
  role        TEXT,
  stage       TEXT,
  access_mode TEXT,
  limitations TEXT,
  visibility  TEXT NOT NULL DEFAULT 'public'
              CHECK (visibility IN ('public','unlisted','private')),
  featured    INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  UNIQUE (owner_id, slug)
);

CREATE TABLE project_skills (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, skill_name)
);

CREATE TABLE posts (
  id         TEXT PRIMARY KEY,
  author_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL
             CHECK (kind IN ('show','build','thought','discussion')),
  body       TEXT NOT NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'public'
             CHECK (visibility IN ('public','private')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE post_media (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  position   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE follows (
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);

CREATE TABLE reactions (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post','project')),
  target_id   TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'like' CHECK (type IN ('like')),
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, target_type, target_id, type)
);

CREATE TABLE comments (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id  TEXT,
  body       TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE bookmarks (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post','project')),
  target_id   TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, target_type, target_id)
);

CREATE TABLE notifications (
  id           TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  type         TEXT NOT NULL
               CHECK (type IN ('follow','like','comment','repost','mention')),
  target_type  TEXT,
  target_id    TEXT,
  read_at      INTEGER,
  created_at   INTEGER NOT NULL
);

CREATE TABLE reports (
  id          TEXT PRIMARY KEY,
  reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user','post','project','comment')),
  target_id   TEXT NOT NULL,
  reason      TEXT NOT NULL,
  detail      TEXT,
  status      TEXT NOT NULL DEFAULT 'open'
              CHECK (status IN ('open','ignored','removed','limited')),
  handled_by  TEXT,
  handled_at  INTEGER,
  created_at  INTEGER NOT NULL
);

-- feed / discovery indexes
CREATE UNIQUE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_owner       ON projects(owner_id, visibility);
CREATE INDEX idx_projects_recent      ON projects(visibility, created_at DESC);
CREATE INDEX idx_posts_recent         ON posts(visibility, deleted_at, created_at DESC);
CREATE INDEX idx_posts_author         ON posts(author_id, deleted_at, created_at DESC);
CREATE INDEX idx_follows_followed     ON follows(followed_id);
CREATE INDEX idx_comments_post        ON comments(post_id, created_at);
CREATE INDEX idx_reactions_target     ON reactions(target_type, target_id);
CREATE INDEX idx_notifications_owner  ON notifications(recipient_id, created_at DESC);
CREATE INDEX idx_ext_accounts_owner   ON external_accounts(user_id, position);
CREATE INDEX idx_profile_skills_owner ON profile_skills(user_id, position);
