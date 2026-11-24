-- 0007: 种子拟真互动的随机调度状态。
-- 纯增量，不改动旧迁移。只有一行状态，真正实现 5 分钟~4 小时的随机触发周期。
CREATE TABLE seed_sim_state (
  key   TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);

INSERT OR IGNORE INTO seed_sim_state (key, value) VALUES ('next_run_at', 0);
