import type { AppLoadContext } from "react-router";
import { batch, many, one, stmt } from "./db.server";
import { relativeTime } from "./format";

/** Fields an author hover-card needs, selected alongside any list row. */
export interface AuthorCardRow {
  author_id: string;
  author_headline: string | null;
  author_hide_follows: number;
  author_projects: number;
  author_followers: number;
}

export interface ProjectCardRow extends AuthorCardRow {
  id: string;
  slug: string;
  kind: string;
  title: string;
  summary: string;
  description: string | null;
  cover_url: string | null;
  featured: number;
  created_at: number;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  likes: number;
}

export interface PersonRow {
  id: string;
  skills: string[];
  preview_projects: Array<{
    id: string;
    slug: string;
    title: string;
    cover_url: string | null;
    kind: string;
  }>;
  handle: string;
  kind: string;
  display_name: string;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  projects: number;
  followers: number;
  hide_follows: number;
  following: number;
}

/**
 * Content visibility has two levels: the item's own `visibility`, and the
 * owner's profile visibility. A profile set to 私密 means "主页、作品和动态
 * 都不对其他人可见", so every public surface honours it — the owner excepted.
 */
const projectSelect = (viewerSlot: number) => `
  SELECT pr.id, pr.slug, pr.kind, pr.title, pr.summary, pr.description, pr.cover_url,
         pr.featured, pr.created_at,
         u.handle, p.display_name, p.avatar_url,
         pr.owner_id AS author_id, p.headline AS author_headline,
         p.hide_follows AS author_hide_follows,
         (SELECT COUNT(*) FROM projects ap WHERE ap.owner_id = pr.owner_id
            AND ap.visibility = 'public') AS author_projects,
         (SELECT COUNT(*) FROM follows af WHERE af.followed_id = pr.owner_id) AS author_followers,
         (SELECT COUNT(*) FROM reactions r
           WHERE r.target_type = 'project' AND r.target_id = pr.id) AS likes
    FROM projects pr
    JOIN users u   ON u.id = pr.owner_id
    JOIN profiles p ON p.user_id = pr.owner_id
   WHERE pr.visibility = 'public' AND u.status = 'active'
     AND (p.visibility = 'public' OR pr.owner_id = ?${viewerSlot})
`;

export async function latestProjects(
  context: AppLoadContext,
  viewerId: string | null,
  limit = 9,
): Promise<ProjectCardRow[]> {
  return many<ProjectCardRow>(
    context,
    `${projectSelect(1)} ORDER BY pr.featured DESC, pr.created_at DESC LIMIT ?2`,
    viewerId ?? "·none·",
    limit,
  );
}

export async function projectsByOwner(
  context: AppLoadContext,
  ownerId: string,
  viewerId: string | null = null,
): Promise<ProjectCardRow[]> {
  return many<ProjectCardRow>(
    context,
    `${projectSelect(2)} AND pr.owner_id = ?1
      ORDER BY pr.featured DESC, pr.created_at DESC`,
    ownerId,
    viewerId ?? "·none·",
  );
}

/* ── 广场：信息流查询 ───────────────────────────────────────────────── */

export interface RepostSource {
  id: string;
  kind: string;
  body: string;
  time_label: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  project_slug: string | null;
  project_title: string | null;
  project_cover_url: string | null;
}

export interface FeedPostRow extends AuthorCardRow {
  id: string;
  kind: string;
  body: string;
  created_at: number;
  time_label: string;
  author_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  project_id: string | null;
  project_slug: string | null;
  project_title: string | null;
  project_summary: string | null;
  project_cover_url: string | null;
  likes: number;
  comments: number;
  reposts: number;
  liked: number;
  bookmarked: number;
  /** 1 when the viewer already follows this post's author. */
  author_following: number;
  /** 1 when the viewer already has a live bare repost of this post. */
  reposted: number;
  /** Raw acknowledgement counts — no score, no ranking. */
  acks: number;
  acked: number;
  prompt_id: string | null;
  prompt_slug: string | null;
  prompt_title: string | null;
  preview_comment: {
    id: string;
    body: string;
    time_label: string;
    handle: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  repost_of_id: string | null;
  repost_comment_id: string | null;
  repost_comment: { id: string; body: string; handle: string; display_name: string; post_id: string } | null;
  tags: string[];
  /** Non-null when the original is still readable; null means it is gone. */
  repost: RepostSource | null;
}

/**
 * One statement per page. Counters are correlated subqueries and the
 * reposted original is joined in, so a 30-row page costs the same number of
 * round trips as a 3-row one. Tags are fetched afterwards for the whole page.
 *
 * The joins carry their own visibility conditions so a private or banned
 * original degrades to a null `repost` (rendered as a placeholder) instead of
 * leaking its body.
 */
const FEED_SELECT = (viewerSlot: number) => `
  SELECT po.id, po.kind, po.body, po.created_at, po.author_id,
         po.project_id, po.repost_of_id, po.repost_comment_id, po.prompt_id,
         prm.slug AS prompt_slug, prm.title AS prompt_title,
         u.handle, p.display_name, p.avatar_url,
         po.author_id AS author_id, p.headline AS author_headline,
         p.hide_follows AS author_hide_follows,
         (SELECT COUNT(*) FROM projects ap WHERE ap.owner_id = po.author_id
            AND ap.visibility = 'public') AS author_projects,
         (SELECT COUNT(*) FROM follows af WHERE af.followed_id = po.author_id) AS author_followers,
         pr.slug AS project_slug, pr.title AS project_title,
         pr.summary AS project_summary, pr.cover_url AS project_cover_url,
         (SELECT COUNT(*) FROM reactions r
           WHERE r.target_type = 'post' AND r.target_id = po.id AND r.type = 'like') AS likes,
         (SELECT COUNT(*) FROM comments c
           WHERE c.post_id = po.id AND c.deleted_at IS NULL) AS comments,
         (SELECT COUNT(*) FROM posts rp
           WHERE rp.repost_of_id = po.id AND rp.deleted_at IS NULL) AS reposts,
         (SELECT COUNT(*) FROM reactions r2
           WHERE r2.target_type = 'post' AND r2.target_id = po.id
             AND r2.type = 'like' AND r2.user_id = ?${viewerSlot}) AS liked,
         (SELECT COUNT(*) FROM bookmarks b
           WHERE b.user_id = ?${viewerSlot} AND b.target_type = 'post'
             AND b.target_id = po.id) AS bookmarked,
         (SELECT COUNT(*) FROM follows f
           WHERE f.follower_id = ?${viewerSlot} AND f.followed_id = po.author_id) AS author_following,
         (SELECT COUNT(*) FROM posts myrp
           WHERE myrp.repost_of_id = po.id AND myrp.author_id = ?${viewerSlot}
             AND myrp.body = '' AND myrp.deleted_at IS NULL) AS reposted,
         (SELECT COUNT(*) FROM acks a WHERE a.post_id = po.id) AS acks,
         (SELECT COUNT(*) FROM acks a2
           WHERE a2.post_id = po.id AND a2.user_id = ?${viewerSlot}) AS acked,
         op.id AS r_id, op.kind AS r_kind, op.body AS r_body,
         op.created_at AS r_created_at,
         ou.handle AS r_handle, opf.display_name AS r_display_name,
         opf.avatar_url AS r_avatar_url,
         rpr.slug AS r_project_slug, rpr.title AS r_project_title,
         rpr.cover_url AS r_project_cover_url,
         rc.id AS rc_id, rc.body AS rc_body, rc.post_id AS rc_post_id,
         rcu.handle AS rc_handle, rcp.display_name AS rc_display_name
    FROM posts po
    JOIN users u     ON u.id = po.author_id
    JOIN profiles p  ON p.user_id = po.author_id
    LEFT JOIN projects pr
           ON pr.id = po.project_id
          AND (pr.visibility <> 'private' OR pr.owner_id = ?${viewerSlot})
    LEFT JOIN prompts prm ON prm.id = po.prompt_id
    LEFT JOIN posts op
           ON op.id = po.repost_of_id
          AND op.deleted_at IS NULL
          AND op.visibility = 'public'
    LEFT JOIN users ou
           ON ou.id = op.author_id AND ou.status = 'active'
    LEFT JOIN profiles opf
           ON opf.user_id = op.author_id
          AND (opf.visibility <> 'private' OR op.author_id = ?${viewerSlot})
    LEFT JOIN projects rpr
           ON rpr.id = op.project_id
          AND (rpr.visibility <> 'private' OR rpr.owner_id = ?${viewerSlot})
    LEFT JOIN comments rc
           ON rc.id = po.repost_comment_id AND rc.deleted_at IS NULL
    LEFT JOIN users rcu ON rcu.id = rc.author_id AND rcu.status = 'active'
    LEFT JOIN profiles rcp ON rcp.user_id = rc.author_id AND rcp.visibility = 'public' 
   WHERE po.visibility = 'public' AND po.deleted_at IS NULL AND u.status = 'active'
     AND (p.visibility = 'public' OR po.author_id = ?${viewerSlot})
`;

type RawFeedRow = Omit<FeedPostRow, "time_label" | "tags" | "repost" | "repost_comment" | "preview_comment"> & {
  r_id: string | null;
  r_kind: string | null;
  r_body: string | null;
  r_created_at: number | null;
  r_handle: string | null;
  r_display_name: string | null;
  r_avatar_url: string | null;
  r_project_slug: string | null;
  r_project_title: string | null;
  r_project_cover_url: string | null;
  rc_id: string | null; rc_body: string | null; rc_handle: string | null;
  rc_display_name: string | null; rc_post_id: string | null;
};

export interface FeedPage {
  rows: FeedPostRow[];
  hasMore: boolean;
}

export async function feedPosts(
  context: AppLoadContext,
  opts: {
    viewerId: string | null;
    scope?: "all" | "following" | "bookmarks";
    kind?: string;
    /** Matched case-insensitively, so #RAG and #rag are the same topic. */
    tag?: string;
    authorId?: string;
    promptSlug?: string;
    sort?: "latest" | "active";
    limit?: number;
    offset?: number;
  },
): Promise<FeedPage> {
  // the viewer is always ?1: visibility guards, liked, bookmarked and
  // author_following all read it
  const params: unknown[] = [opts.viewerId ?? "·none·"];
  const clauses: string[] = [];
  let i = 2;

  if (opts.kind && opts.kind !== "all") {
    params.push(opts.kind);
    clauses.push(`po.kind = ?${i++}`);
  }
  if (opts.tag) {
    params.push(opts.tag);
    clauses.push(
      `po.id IN (SELECT post_id FROM post_tags WHERE tag = ?${i++} COLLATE NOCASE)`,
    );
  }
  if (opts.authorId) {
    params.push(opts.authorId);
    clauses.push(`po.author_id = ?${i++}`);
  }
  if (opts.promptSlug) {
    params.push(opts.promptSlug);
    clauses.push(`prm.slug = ?${i++}`);
  }
  if (opts.scope === "following") {
    clauses.push(
      `(po.author_id = ?1 OR po.author_id IN (
          SELECT followed_id FROM follows WHERE follower_id = ?1))`,
    );
  }
  if (opts.scope === "bookmarks") {
    clauses.push(
      `po.id IN (SELECT target_id FROM bookmarks
                  WHERE user_id = ?1 AND target_type = 'post')`,
    );
  }

  const limit = opts.limit ?? 30;
  const offset = opts.offset ?? 0;
  params.push(limit + 1, offset);
  const where = clauses.length ? ` AND ${clauses.join(" AND ")}` : "";
  const order =
    opts.sort === "active"
      ? "likes + comments + reposts DESC, po.created_at DESC"
      : "po.created_at DESC";

  const rows = await many<RawFeedRow>(
    context,
    `${FEED_SELECT(1)}${where} ORDER BY ${order} LIMIT ?${i} OFFSET ?${i + 1}`,
    ...params,
  );

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  const tags = await tagsForPosts(context, page.map((r) => r.id));
  const previews = await previewCommentsForPosts(context, page.map((r) => r.id));
  return {
    hasMore,
    rows: page.map((r) => ({
      preview_comment: previews.get(r.id) ?? null,
      ...r,
      repost_comment: r.rc_id && r.rc_body !== null && r.rc_handle
        ? { id: r.rc_id, body: r.rc_body, handle: r.rc_handle, display_name: r.rc_display_name ?? "", post_id: r.rc_post_id ?? "" }
        : null,
      time_label: relativeTime(r.created_at),
      tags: tags.get(r.id) ?? [],
      // joined-in original; null means deleted, private or banned
      repost:
        r.r_id && r.r_body !== null && r.r_handle
          ? {
              id: r.r_id,
              kind: r.r_kind ?? "thought",
              body: r.r_body,
              time_label: relativeTime(r.r_created_at ?? r.created_at),
              handle: r.r_handle,
              display_name: r.r_display_name ?? "",
              avatar_url: r.r_avatar_url,
              project_slug: r.r_project_slug,
              project_title: r.r_project_title,
              project_cover_url: r.r_project_cover_url,
            }
          : null,
    })),
  };
}

/** All tags for a set of posts, in one query — never per row. */
export async function tagsForPosts(
  context: AppLoadContext,
  postIds: string[],
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (!postIds.length) return out;

  const placeholders = postIds.map((_, n) => `?${n + 1}`).join(",");
  const rows = await many<{ post_id: string; tag: string }>(
    context,
    `SELECT post_id, tag FROM post_tags WHERE post_id IN (${placeholders})
      ORDER BY tag`,
    ...postIds,
  );
  for (const r of rows) {
    const list = out.get(r.post_id) ?? [];
    list.push(r.tag);
    out.set(r.post_id, list);
  }
  return out;
}

export interface HotTag {
  tag: string;
  n: number;
}

/**
 * Tags ranked by how many public posts carry them. Grouped with NOCASE so
 * "RAG" and "rag" collapse into a single topic instead of splitting counts.
 */
export async function hotTags(
  context: AppLoadContext,
  limit = 8,
): Promise<HotTag[]> {
  return many<HotTag>(
    context,
    `SELECT min(pt.tag) AS tag, COUNT(DISTINCT pt.post_id) AS n
       FROM post_tags pt
       JOIN posts po   ON po.id = pt.post_id
       JOIN users u    ON u.id = po.author_id
       JOIN profiles p ON p.user_id = po.author_id
      WHERE po.visibility = 'public' AND po.deleted_at IS NULL
        AND u.status = 'active' AND p.visibility = 'public'
      GROUP BY pt.tag COLLATE NOCASE
      ORDER BY n DESC, tag
      LIMIT ?1`,
    limit,
  );
}

/** The author's own work, for the composer's and editor's project picker. */
export async function projectsForComposer(
  context: AppLoadContext,
  ownerId: string,
  limit = 20,
): Promise<Array<{ id: string; title: string }>> {
  return many<{ id: string; title: string }>(
    context,
    `SELECT id, title FROM projects
      WHERE owner_id = ?1 AND visibility <> 'private'
      ORDER BY created_at DESC LIMIT ?2`,
    ownerId,
    limit,
  );
}

/**
 * Write a post and its tags together. Tags are derived from the body by the
 * caller (see lib/tags.ts) so the same parser feeds the links in the browser.
 */
export async function insertPost(
  context: AppLoadContext,
  input: {
    authorId: string;
    kind: string;
    body: string;
    projectId?: string | null;
    repostOfId?: string | null;
    repostCommentId?: string | null;
    promptId?: string | null;
    tags?: string[];
  },
): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  await batch(context, [
    stmt(
      context,
      `INSERT INTO posts
         (id, author_id, kind, body, project_id, repost_of_id, repost_comment_id, prompt_id, visibility,
          created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'public', ?9, ?9)`,
      id,
      input.authorId,
      input.kind,
      input.body,
      input.projectId ?? null,
      input.repostOfId ?? null,
      input.repostCommentId ?? null,
      input.promptId ?? null,
      now,
    ),
    ...(input.tags ?? []).map((tag) =>
      stmt(
        context,
        `INSERT OR IGNORE INTO post_tags (post_id, tag) VALUES (?1, ?2)`,
        id,
        tag,
      ),
    ),
  ]);
  return id;
}

const personSelect = (viewerSlot: number) => `
  SELECT u.id, u.handle, u.kind, p.display_name, p.avatar_url,
         p.headline, p.location, p.updated_at, p.hide_follows,
         (SELECT COUNT(*) FROM projects pr
           WHERE pr.owner_id = u.id AND pr.visibility = 'public') AS projects,
         (SELECT COUNT(*) FROM follows f WHERE f.followed_id = u.id) AS followers,
         (SELECT COUNT(*) FROM follows f2
           WHERE f2.follower_id = ?${viewerSlot} AND f2.followed_id = u.id) AS following
    FROM users u JOIN profiles p ON p.user_id = u.id
   WHERE u.status = 'active' AND p.visibility = 'public'
`;

/** Batch-fetch skills for a set of people: one query, never one per card. */
export async function skillsForUsers(
  context: AppLoadContext,
  userIds: string[],
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (!userIds.length) return out;
  const ph = userIds.map((_, n) => `?${n + 1}`).join(",");
  const rows = await many<{ user_id: string; skill_name: string }>(
    context,
    `SELECT user_id, skill_name FROM profile_skills WHERE user_id IN (${ph}) ORDER BY position`,
    ...userIds,
  );
  for (const r of rows) {
    const list = out.get(r.user_id) ?? [];
    if (list.length < 3) list.push(r.skill_name);
    out.set(r.user_id, list);
  }
  return out;
}

/** Batch-fetch up to two public preview works per person. */
export async function previewProjectsForUsers(
  context: AppLoadContext,
  userIds: string[],
): Promise<Map<string, PersonRow["preview_projects"]>> {
  const out = new Map<string, PersonRow["preview_projects"]>();
  if (!userIds.length) return out;
  const ph = userIds.map((_, n) => `?${n + 1}`).join(",");
  const rows = await many<{
    id: string; owner_id: string; slug: string; title: string;
    cover_url: string | null; kind: string;
  }>(
    context,
    `SELECT id, owner_id, slug, title, cover_url, kind FROM projects
      WHERE owner_id IN (${ph}) AND visibility = 'public'
      ORDER BY featured DESC, created_at DESC`,
    ...userIds,
  );
  for (const r of rows) {
    const list = out.get(r.owner_id) ?? [];
    if (list.length < 2) {
      list.push({
        id: r.id, slug: r.slug, title: r.title,
        cover_url: r.cover_url, kind: r.kind,
      });
      out.set(r.owner_id, list);
    }
  }
  return out;
}

/** Attach both batch lookups to a list of people with two extra queries. */
export async function hydratePeople(
  context: AppLoadContext,
  rows: PersonRow[],
): Promise<PersonRow[]> {
  if (!rows.length) return rows;
  const ids = rows.map((r) => r.id);
  const [skills, projects] = await Promise.all([
    skillsForUsers(context, ids),
    previewProjectsForUsers(context, ids),
  ]);
  return rows.map((r) => ({
    ...r,
    skills: skills.get(r.id) ?? [],
    preview_projects: projects.get(r.id) ?? [],
  }));
}

export async function featuredPeople(
  context: AppLoadContext,
  viewerId: string | null,
  limit = 6,
): Promise<PersonRow[]> {
  return hydratePeople(
    context,
    await many<PersonRow>(
      context,
      `${personSelect(1)} ORDER BY followers DESC, projects DESC, p.updated_at DESC LIMIT ?2`,
      viewerId ?? "·none·",
      limit,
    ),
  );
}

export async function recommendedPeople(
  context: AppLoadContext,
  viewerId: string,
  limit = 4,
): Promise<PersonRow[]> {
  return hydratePeople(
    context,
    await many<PersonRow>(
      context,
      `${personSelect(1)} AND u.id <> ?1
         AND u.id NOT IN (SELECT followed_id FROM follows WHERE follower_id = ?1)
        ORDER BY followers DESC, projects DESC LIMIT ?2`,
      viewerId,
      limit,
    ),
  );
}

export async function searchPeople(
  context: AppLoadContext,
  opts: {
    q?: string;
    kind?: string;
    skill?: string;
    sort?: string;
    limit?: number;
    viewerId?: string | null;
  },
): Promise<PersonRow[]> {
  // the select needs the viewer first, so filters start at ?2
  const params: unknown[] = [opts.viewerId ?? "·none·"];
  const clauses: string[] = [];
  let i = 2;

  if (opts.q) {
    params.push(`%${opts.q}%`);
    clauses.push(
      `(p.display_name LIKE ?${i} OR u.handle LIKE ?${i} OR p.headline LIKE ?${i})`,
    );
    i++;
  }
  if (opts.kind === "individual" || opts.kind === "team") {
    params.push(opts.kind);
    clauses.push(`u.kind = ?${i++}`);
  }
  if (opts.skill) {
    // partial skill names should find people: "RAG" matches "RAG 检索",
    // "语音" matches "语音交互". Also scan the one-line headline.
    const skillPattern = `%${opts.skill}%`;
    params.push(skillPattern);
    clauses.push(
      `(u.id IN (SELECT user_id FROM profile_skills
                  WHERE skill_name LIKE ?${i} COLLATE NOCASE)
        OR p.headline LIKE ?${i} COLLATE NOCASE)`,
    );
    i += 1;
  }

  const where = clauses.length ? ` AND ${clauses.join(" AND ")}` : "";
  const order =
    opts.sort === "new"
      ? "p.updated_at DESC"
      : opts.sort === "projects"
        ? "projects DESC, followers DESC"
        : "followers DESC, projects DESC";

  params.push(opts.limit ?? 24);
  return hydratePeople(
    context,
    await many<PersonRow>(
      context,
      `${personSelect(1)}${where} ORDER BY ${order} LIMIT ?${i}`,
      ...params,
    ),
  );
}

export async function searchProjects(
  context: AppLoadContext,
  opts: {
    q?: string;
    kind?: string;
    sort?: string;
    limit?: number;
    viewerId?: string | null;
    accessMode?: string;
  },
): Promise<ProjectCardRow[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (opts.q) {
    params.push(`%${opts.q}%`);
    clauses.push(`(pr.title LIKE ?${i} OR pr.summary LIKE ?${i})`);
    i++;
  }
  if (opts.kind && opts.kind !== "all") {
    params.push(opts.kind);
    clauses.push(`pr.kind = ?${i}`);
    i++;
  }
  if (opts.accessMode && opts.accessMode !== "all") {
    params.push(opts.accessMode);
    clauses.push(`pr.access_mode = ?${i}`);
    i++;
  }

  const viewerSlot = i;
  params.push(opts.viewerId ?? "·none·");
  i++;

  const where = clauses.length ? ` AND ${clauses.join(" AND ")}` : "";
  const order =
    opts.sort === "likes" ? "likes DESC, pr.created_at DESC" : "pr.created_at DESC";

  return many<ProjectCardRow>(
    context,
    `${projectSelect(viewerSlot)}${where} ORDER BY ${order} LIMIT ?${i}`,
    ...params,
    opts.limit ?? 24,
  );
}

export async function countsForProfile(
  context: AppLoadContext,
  userId: string,
): Promise<{ followers: number; following: number; posts: number; projects: number; acks_received: number }> {
  const rows = await many<{
    followers: number;
    following: number;
    posts: number;
    projects: number;
    acks_received: number;
  }>(
    context,
    `SELECT
       (SELECT COUNT(*) FROM follows WHERE followed_id = ?1) AS followers,
       (SELECT COUNT(*) FROM follows WHERE follower_id = ?1) AS following,
       (SELECT COUNT(*) FROM posts WHERE author_id = ?1
          AND deleted_at IS NULL AND visibility = 'public') AS posts,
       (SELECT COUNT(*) FROM projects WHERE owner_id = ?1
          AND visibility = 'public') AS projects,
       (SELECT COUNT(*) FROM acks a
          JOIN posts ap ON ap.id = a.post_id
         WHERE ap.author_id = ?1 AND ap.deleted_at IS NULL
           AND ap.visibility = 'public') AS acks_received`,
    userId,
  );
  return rows[0] ?? { followers: 0, following: 0, posts: 0, projects: 0, acks_received: 0 };
}

/** Skills clustered across public work — the feed's "trending" rail. */
export async function topSkills(
  context: AppLoadContext,
  limit = 4,
): Promise<Array<{ skill_name: string; n: number }>> {
  return many<{ skill_name: string; n: number }>(
    context,
    `SELECT ps.skill_name, COUNT(*) AS n
       FROM project_skills ps
       JOIN projects pr ON pr.id = ps.project_id
       JOIN users u     ON u.id = pr.owner_id
       JOIN profiles p  ON p.user_id = pr.owner_id
      WHERE pr.visibility = 'public' AND u.status = 'active'
        AND p.visibility = 'public'
      GROUP BY ps.skill_name
      ORDER BY n DESC, ps.skill_name
      LIMIT ?1`,
    limit,
  );
}

/* ── brand signature: ACK quota, reply previews, 同题切磋 ─────────────── */

/** Daily ACK quota: at most 2 per UTC+8 day. */
export async function ackQuotaToday(
  context: AppLoadContext,
  userId: string,
  dayKey: string,
): Promise<{ used: number; limit: 2; remaining: number }> {
  const row = await one<{ n: number }>(
    context,
    `SELECT COUNT(*) AS n FROM acks WHERE user_id = ?1 AND day_key = ?2`,
    userId,
    dayKey,
  );
  const used = row?.n ?? 0;
  return { used, limit: 2, remaining: Math.max(0, 2 - used) };
}

/** Newest non-deleted comment for each post, in ONE query — no N+1. */
export async function previewCommentsForPosts(
  context: AppLoadContext,
  postIds: string[],
): Promise<Map<string, { id: string; body: string; time_label: string; handle: string; display_name: string; avatar_url: string | null }>> {
  const out = new Map<string, { id: string; body: string; time_label: string; handle: string; display_name: string; avatar_url: string | null }>();
  if (!postIds.length) return out;
  const ph = postIds.map((_, n) => `?${n + 1}`).join(",");
  const rows = await many<{
    id: string;
    post_id: string;
    body: string;
    created_at: number;
    handle: string;
    display_name: string;
    avatar_url: string | null;
  }>(
    context,
    `SELECT c.id, c.post_id, c.body, c.created_at,
            u.handle, p.display_name, p.avatar_url
       FROM comments c
       JOIN users u    ON u.id = c.author_id AND u.status = 'active'
       JOIN profiles p ON p.user_id = c.author_id AND p.visibility = 'public'
      WHERE c.deleted_at IS NULL AND c.post_id IN (${ph})
      ORDER BY c.created_at DESC`,
    ...postIds,
  );
  for (const r of rows) {
    if (out.has(r.post_id)) continue; // rows are newest-first
    out.set(r.post_id, {
      id: r.id,
      body: r.body,
      time_label: relativeTime(r.created_at),
      handle: r.handle,
      display_name: r.display_name,
      avatar_url: r.avatar_url,
    });
  }
  return out;
}

export interface ActivePrompt {
  id: string;
  slug: string;
  title: string;
  summary: string;
  tag: string;
  ends_at: number;
  created_at: number;
  submissions: number;
  participants: Array<{ handle: string; display_name: string; avatar_url: string | null }>;
}

/** Active prompts with submission counts and up to 3 distinct participants each. */
export async function activePrompts(
  context: AppLoadContext,
  limit = 3,
): Promise<ActivePrompt[]> {
  const rows = await many<Omit<ActivePrompt, "participants">>(
    context,
    `SELECT pr.id, pr.slug, pr.title, pr.summary, pr.tag, pr.ends_at, pr.created_at,
            (SELECT COUNT(*) FROM posts po
              WHERE po.prompt_id = pr.id AND po.deleted_at IS NULL
                AND po.visibility = 'public') AS submissions
       FROM prompts pr
      WHERE pr.status = 'active'
      ORDER BY pr.ends_at ASC LIMIT ?1`,
    limit,
  );
  if (!rows.length) return rows.map((r) => ({ ...r, participants: [] }));
  const ids = rows.map((r) => r.id);
  const ph = ids.map((_, n) => `?${n + 1}`).join(",");
  const people = await many<{
    prompt_id: string;
    handle: string;
    display_name: string;
    avatar_url: string | null;
  }>(
    context,
    `SELECT po.prompt_id, u.handle, p.display_name, p.avatar_url
       FROM posts po
       JOIN users u    ON u.id = po.author_id AND u.status = 'active'
       JOIN profiles p ON p.user_id = u.id AND p.visibility = 'public'
      WHERE po.prompt_id IN (${ph}) AND po.deleted_at IS NULL
        AND po.visibility = 'public'
      ORDER BY po.created_at DESC`,
    ...ids,
  );
  const byPrompt = new Map<string, ActivePrompt["participants"]>();
  for (const row of people) {
    const list = byPrompt.get(row.prompt_id) ?? [];
    if (list.length >= 3 || list.some((x) => x.handle === row.handle)) continue;
    list.push({ handle: row.handle, display_name: row.display_name, avatar_url: row.avatar_url });
    byPrompt.set(row.prompt_id, list);
  }
  return rows.map((r) => ({ ...r, participants: byPrompt.get(r.id) ?? [] }));
}

export async function promptBySlug(
  context: AppLoadContext,
  slug: string,
): Promise<ActivePrompt | null> {
  const rows = await many<ActivePrompt>(
    context,
    `SELECT pr.id, pr.slug, pr.title, pr.summary, pr.tag, pr.ends_at, pr.created_at,
            (SELECT COUNT(*) FROM posts po
              WHERE po.prompt_id = pr.id AND po.deleted_at IS NULL
                AND po.visibility = 'public') AS submissions
       FROM prompts pr WHERE pr.slug = ?1 AND pr.status = 'active' LIMIT 1`,
    slug,
  );
  if (!rows.length) return null;
  const prompt = rows[0];
  const people = await many<{
    handle: string;
    display_name: string;
    avatar_url: string | null;
  }>(
    context,
    `SELECT u.handle, p.display_name, p.avatar_url
       FROM posts po
       JOIN users u    ON u.id = po.author_id AND u.status = 'active'
       JOIN profiles p ON p.user_id = u.id AND p.visibility = 'public'
      WHERE po.prompt_id = ?1 AND po.deleted_at IS NULL
        AND po.visibility = 'public'
      ORDER BY po.created_at DESC LIMIT 3`,
    prompt.id,
  );
  return { ...prompt, participants: people };
}

/** Intel items (hourly job / gig intelligence), newest first. */
export interface IntelItem {
  id: string;
  kind: "job" | "gig";
  region: "domestic" | "overseas";
  source: string;
  source_url: string;
  title: string;
  company: string | null;
  location: string | null;
  budget: string | null;
  summary: string;
  detail_md: string;
  tag: string;
  meta: string | null;
  published_at: number;
  fetched_at: number;
}

export async function latestIntel(
  context: AppLoadContext,
  kind: "job" | "gig",
  limit = 3,
): Promise<IntelItem[]> {
  return many<IntelItem>(
    context,
    `SELECT * FROM intel_items WHERE kind = ?1
      ORDER BY fetched_at DESC, published_at DESC LIMIT ?2`,
    kind,
    limit,
  );
}

export async function countIntel(context: AppLoadContext): Promise<{ jobs: number; gigs: number }> {
  const row = await one<{ jobs: number; gigs: number }>(
    context,
    `SELECT
       (SELECT COUNT(*) FROM intel_items WHERE kind='job') AS jobs,
       (SELECT COUNT(*) FROM intel_items WHERE kind='gig') AS gigs`,
  );
  return { jobs: row?.jobs ?? 0, gigs: row?.gigs ?? 0 };
}

export async function listIntel(
  context: AppLoadContext,
  opts: { kind: "job" | "gig"; region?: "domestic" | "overseas" | ""; tag?: string; q?: string; limit?: number },
): Promise<IntelItem[]> {
  const where = ["kind = ?1"];
  const params: unknown[] = [opts.kind];
  if (opts.region) { where.push("region = ?2"); params.push(opts.region); }
  let i = params.length + 1;
  if (opts.tag) { where.push(`tag = ?${i++}`); params.push(opts.tag); }
  if (opts.q) { where.push(`(title LIKE ?${i} OR summary LIKE ?${i} OR COALESCE(company,'') LIKE ?${i})`); params.push(`%${opts.q}%`); i++; }
  params.push(opts.limit ?? 60);
  return many<IntelItem>(
    context,
    `SELECT * FROM intel_items WHERE ${where.join(" AND ")}
      ORDER BY fetched_at DESC, published_at DESC LIMIT ?${i}`,
    ...params,
  );
}

export async function intelById(context: AppLoadContext, id: string): Promise<IntelItem | null> {
  return one<IntelItem>(context, `SELECT * FROM intel_items WHERE id = ?1`, id);
}

/** Active sponsorship slots grouped by placement; independent of community data. */
export interface AdItem {
  id: string;
  placement: "left_rail" | "right_rail" | "feed_inline";
  title: string;
  description: string;
  cta_label: string;
  target_url: string;
  image_url: string | null;
  badge: string;
}

export async function activeAds(
  context: AppLoadContext,
): Promise<Record<"left_rail" | "right_rail" | "feed_inline", AdItem[]>> {
  const rows = await many<AdItem>(
    context,
    `SELECT id, placement, title, description, cta_label, target_url, image_url, badge
       FROM ad_slots WHERE active = 1
      ORDER BY placement, priority DESC, created_at DESC`,
  );
  const grouped: Record<"left_rail" | "right_rail" | "feed_inline", AdItem[]> = {
    left_rail: [], right_rail: [], feed_inline: [],
  };
  for (const row of rows) grouped[row.placement].push(row);
  return grouped;
}
