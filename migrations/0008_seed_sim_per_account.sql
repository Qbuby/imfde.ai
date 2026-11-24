-- 0008: each seed account carries its own next-run timestamp. New accounts
-- set their own value at creation time. Pure additive, no old-file edits.
ALTER TABLE users ADD COLUMN sim_next_at INTEGER;
UPDATE users SET sim_next_at = CAST((strftime('%s','now') * 1000) AS INTEGER) WHERE id LIKE 'seed_user_%';
