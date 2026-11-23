-- One-command rollback for scripts/seed.sql. Every seed row carries a stable
-- `seed_*` primary key, so nothing here can touch a real user or their content.
DELETE FROM acks WHERE id LIKE 'seed_ack_%';
DELETE FROM post_tags WHERE post_id LIKE 'seed_post_%';
DELETE FROM comments WHERE id LIKE 'seed_cmt_%';
DELETE FROM notifications WHERE id LIKE 'seed_ntf_%';
DELETE FROM bookmarks WHERE user_id LIKE 'seed_user_%';
DELETE FROM reactions WHERE user_id LIKE 'seed_user_%';
DELETE FROM follows WHERE follower_id LIKE 'seed_user_%' OR followed_id LIKE 'seed_user_%';
DELETE FROM posts WHERE id LIKE 'seed_post_%';
DELETE FROM project_skills WHERE project_id LIKE 'seed_proj_%';
DELETE FROM projects WHERE id LIKE 'seed_proj_%';
DELETE FROM profile_skills WHERE user_id LIKE 'seed_user_%';
DELETE FROM external_accounts WHERE id LIKE 'seed_ext_%';
DELETE FROM users WHERE id LIKE 'seed_user_%';
DELETE FROM prompts WHERE id LIKE 'seed_prompt_%';
DELETE FROM radar_items WHERE id LIKE 'seed_radar_%';
DELETE FROM ad_slots WHERE id LIKE 'seed_ad_%';
