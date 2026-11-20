import type { AppLoadContext } from "react-router";
import { batch, many, stmt } from "./db.server";
import { relativeTime } from "./format";

export interface ProjectCardRow {
  id: string;
  slug: string;
  kind: string;
  title: string;
  summary: string;
  cover_url: string | null;
  featured: number;
  created_at: number;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  likes: number;
}

export interface PostCardRow {
  id: string;
  kind: string;
  body: string;
  created_at: number;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  likes: number;
  comments: number;
  /** Formatted once on the server so SSR and hydration agree. */
  time_label: string;
  project_slug: string | null;
  project_title: string | null;
  liked: number;
}

export interface PersonRow {
  id: string;
  handle: string;
  kind: string;
  display_name: string;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  projects: number;
  followers: number;
}

/**
 * Content visibility has two levels: the item's own `visibility`, and the
 * owner's profile visibility. A profile set to 私密 means "主页、作品和动态
 * 都不对其他人可见", so every public surface has to honour it — the owner
 * is the only exception.
 */
const projectSelect = (viewerSlot: number) => `
  SELECT pr.id, pr.slug, pr.kind, pr.title, pr.summary, pr.cover_url,
         pr.featured, pr.created_at,
         u.handle, p.display_name, p.avatar_url,
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

const POST_SELECT = `
  SELECT po.id, po.kind, po.body, po.created_at,
         u.handle, p.display_name, p.avatar_url,
         pr.slug AS project_slug, pr.title AS project_title,
         (SELECT COUNT(*) FROM reactions r
           WHERE r.target_type = 'post' AND r.target_id = po.id AND r.type = 'like') AS likes,
         (SELECT COUNT(*) FROM comments c
           WHERE c.post_id = po.id AND c.deleted_at IS NULL) AS comments,
         (SELECT COUNT(*) FROM reactions r2
           WHERE r2.target_type = 'post' AND r2.target_id = po.id
             AND r2.type = 'like' AND r2.user_id = ?2) AS liked
    FROM posts po
    JOIN users u    ON u.id = po.author_id
    JOIN profiles p ON p.user_id = po.author_id
    LEFT JOIN projects pr ON pr.id = po.project_id
   WHERE po.visibility = 'public' AND po.deleted_at IS NULL AND u.status = 'active'
     AND (p.visibility = 'public' OR po.author_id = ?2)
`;

export async function latestPosts(
  context: AppLoadContext,
  viewerId: string | null,
  limit = 20,
): Promise<PostCardRow[]> {
  const rows = await many<PostCardRow>(
    context,
    `${POST_SELECT} ORDER BY po.created_at DESC LIMIT ?1`,
    limit,
    viewerId ?? "·none·",
  );
  return rows.map((r) => ({ ...r, time_label: relativeTime(r.created_at) }));
}

export async function followingPosts(
  context: AppLoadContext,
  viewerId: string,
  limit = 20,
): Promise<PostCardRow[]> {
  const rows = await many<PostCardRow>(
    context,
    `${POST_SELECT}
       AND (po.author_id = ?2 OR po.author_id IN (
             SELECT followed_id FROM follows WHERE follower_id = ?2))
      ORDER BY po.created_at DESC LIMIT ?1`,
    limit,
    viewerId,
  );
  return rows.map((r) => ({ ...r, time_label: relativeTime(r.created_at) }));
}

export async function postsByAuthor(
  context: AppLoadContext,
  authorId: string,
  viewerId: string | null,
  limit = 20,
): Promise<PostCardRow[]> {
  const rows = await many<PostCardRow>(
    context,
    `${POST_SELECT} AND po.author_id = ?3 ORDER BY po.created_at DESC LIMIT ?1`,
    limit,
    viewerId ?? "·none·",
    authorId,
  );
  return rows.map((r) => ({ ...r, time_label: relativeTime(r.created_at) }));
}

const PERSON_SELECT = `
  SELECT u.id, u.handle, u.kind, p.display_name, p.avatar_url,
         p.headline, p.location, p.updated_at,
         (SELECT COUNT(*) FROM projects pr
           WHERE pr.owner_id = u.id AND pr.visibility = 'public') AS projects,
         (SELECT COUNT(*) FROM follows f WHERE f.followed_id = u.id) AS followers
    FROM users u JOIN profiles p ON p.user_id = u.id
   WHERE u.status = 'active' AND p.visibility = 'public'
`;

export async function featuredPeople(
  context: AppLoadContext,
  limit = 6,
): Promise<PersonRow[]> {
  return many<PersonRow>(
    context,
    `${PERSON_SELECT} ORDER BY followers DESC, projects DESC, p.updated_at DESC LIMIT ?1`,
    limit,
  );
}

export async function recommendedPeople(
  context: AppLoadContext,
  viewerId: string,
  limit = 4,
): Promise<PersonRow[]> {
  return many<PersonRow>(
    context,
    `${PERSON_SELECT} AND u.id <> ?1
       AND u.id NOT IN (SELECT followed_id FROM follows WHERE follower_id = ?1)
      ORDER BY followers DESC, projects DESC LIMIT ?2`,
    viewerId,
    limit,
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
  },
): Promise<PersonRow[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (opts.q) {
    params.push(`%${opts.q}%`);
    clauses.push(
      `(p.display_name LIKE ?${i} OR u.handle LIKE ?${i} OR p.headline LIKE ?${i})`,
    );
    i++;
  }
  if (opts.kind === "individual" || opts.kind === "team") {
    params.push(opts.kind);
    clauses.push(`u.kind = ?${i}`);
    i++;
  }
  if (opts.skill) {
    params.push(opts.skill);
    clauses.push(
      `u.id IN (SELECT user_id FROM profile_skills WHERE skill_name = ?${i})`,
    );
    i++;
  }

  const where = clauses.length ? ` AND ${clauses.join(" AND ")}` : "";
  const order =
    opts.sort === "new"
      ? "p.updated_at DESC"
      : opts.sort === "projects"
        ? "projects DESC, followers DESC"
        : "followers DESC, projects DESC";

  return many<PersonRow>(
    context,
    `${PERSON_SELECT}${where} ORDER BY ${order} LIMIT ?${i}`,
    ...params,
    opts.limit ?? 24,
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
): Promise<{ followers: number; following: number; posts: number; projects: number }> {
  const rows = await many<{
    followers: number;
    following: number;
    posts: number;
    projects: number;
  }>(
    context,
    `SELECT
       (SELECT COUNT(*) FROM follows WHERE followed_id = ?1) AS followers,
       (SELECT COUNT(*) FROM follows WHERE follower_id = ?1) AS following,
       (SELECT COUNT(*) FROM posts WHERE author_id = ?1
          AND deleted_at IS NULL AND visibility = 'public') AS posts,
       (SELECT COUNT(*) FROM projects WHERE owner_id = ?1
          AND visibility = 'public') AS projects`,
    userId,
  );
  return rows[0] ?? { followers: 0, following: 0, posts: 0, projects: 0 };
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
}

export interface FeedPostRow {
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
  likes: number;
  comments: number;
  reposts: number;
  liked: number;
  bookmarked: number;
  tags: string[];
  /** Non-null when this row is a repost; the original is inlined for display. */
  repost: RepostSource | null;
}

/**
 * One statement per page: counters come from correlated subqueries and the
 * reposted original is joined in, so a 30-row page costs the same number of
 * round trips as a 3-row one. Tags are fetched afterwards for the whole page
 * in a single `IN (...)` query.
 */
const FEED_SELECT = `
  SELECT po.id, po.kind, po.body, po.created_at, po.author_id,
         po.project_id, po.repost_of_id,
         u.handle, p.display_name, p.avatar_url,
         pr.slug AS project_slug, pr.title AS project_title, pr.summary AS project_summary,
         (SELECT COUNT(*) FROM reactions r
           WHERE r.target_type = 'post' AND r.target_id = po.id AND r.type = 'like') AS likes,
         (SELECT COUNT(*) FROM comments c
           WHERE c.post_id = po.id AND c.deleted_at IS NULL) AS comments,
         (SELECT COUNT(*) FROM posts rp
           WHERE rp.repost_of_id = po.id AND rp.deleted_at IS NULL) AS reposts,
         (SELECT COUNT(*) FROM reactions r2
           WHERE r2.target_type = 'post' AND r2.target_id = po.id
             AND r2.type = 'like' AND r2.user_id = ?1) AS liked,
         (SELECT COUNT(*) FROM bookmarks b
           WHERE b.user_id = ?1 AND b.target_type = 'post' AND b.target_id = po.id) AS bookmarked,
         op.id AS r_id, op.kind AS r_kind, op.body AS r_body,
         op.created_at AS r_created_at,
         ou.handle AS r_handle, opf.display_name AS r_display_name,
         opf.avatar_url AS r_avatar_url, opf.visibility AS r_visibility,
         rpr.slug AS r_project_slug, rpr.title AS r_project_title
    FROM posts po
    JOIN users u     ON u.id = po.author_id
    JOIN profiles p  ON p.user_id = po.author_id
    LEFT JOIN projects pr ON pr.id = po.project_id
    LEFT JOIN posts op    ON op.id = po.repost_of_id AND op.deleted_at IS NULL
    LEFT JOIN users ou    ON ou.id = op.author_id
    LEFT JOIN profiles opf ON opf.user_id = op.author_id
    LEFT JOIN projects rpr ON rpr.id = op.project_id
   WHERE po.visibility = 'public' AND po.deleted_at IS NULL AND u.status = 'active'
     AND (p.visibility = 'public' OR po.author_id = ?1)
`;

type RawFeedRow = Omit<FeedPostRow, "time_label" | "tags" | "repost"> & {
  r_id: string | null;
  r_kind: string | null;
  r_body: string | null;
  r_created_at: number | null;
  r_handle: string | null;
  r_display_name: string | null;
  r_avatar_url: string | null;
  r_visibility: string | null;
  r_project_slug: string | null;
  r_project_title: string | null;
};

export async function feedPosts(
  context: AppLoadContext,
  opts: {
    viewerId: string | null;
    scope?: "all" | "following";
    kind?: string;
    tag?: string;
    limit?: number;
  },
): Promise<FeedPostRow[]> {
  const params: unknown[] = [opts.viewerId ?? "·none·"];
  const clauses: string[] = [];
  let i = 2;

  if (opts.kind && opts.kind !== "all") {
    params.push(opts.kind);
    clauses.push(`po.kind = ?${i++}`);
  }
  if (opts.tag) {
    params.push(opts.tag);
    clauses.push(`po.id IN (SELECT post_id FROM post_tags WHERE tag = ?${i++})`);
  }
  if (opts.scope === "following") {
    // ?1 is the viewer, so this only narrows when someone is signed in
    clauses.push(
      `(po.author_id = ?1 OR po.author_id IN (
          SELECT followed_id FROM follows WHERE follower_id = ?1))`,
    );
  }

  params.push(opts.limit ?? 30);
  const where = clauses.length ? ` AND ${clauses.join(" AND ")}` : "";

  const rows = await many<RawFeedRow>(
    context,
    `${FEED_SELECT}${where} ORDER BY po.created_at DESC LIMIT ?${i}`,
    ...params,
  );

  const tags = await tagsForPosts(context, rows.map((r) => r.id));
  return rows.map((r) => ({
    ...r,
    time_label: relativeTime(r.created_at),
    tags: tags.get(r.id) ?? [],
    // a reposted original disappears if its author went private
    repost:
      r.r_id && r.r_body !== null && r.r_visibility !== "private"
        ? {
            id: r.r_id,
            kind: r.r_kind ?? "thought",
            body: r.r_body,
            time_label: relativeTime(r.r_created_at ?? r.created_at),
            handle: r.r_handle ?? "",
            display_name: r.r_display_name ?? "",
            avatar_url: r.r_avatar_url,
            project_slug: r.r_project_slug,
            project_title: r.r_project_title,
          }
        : null,
  }));
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

/** Tags ranked by how many public posts carry them. */
export async function hotTags(
  context: AppLoadContext,
  limit = 8,
): Promise<HotTag[]> {
  return many<HotTag>(
    context,
    `SELECT pt.tag, COUNT(*) AS n
       FROM post_tags pt
       JOIN posts po   ON po.id = pt.post_id
       JOIN users u    ON u.id = po.author_id
       JOIN profiles p ON p.user_id = po.author_id
      WHERE po.visibility = 'public' AND po.deleted_at IS NULL
        AND u.status = 'active' AND p.visibility = 'public'
      GROUP BY pt.tag
      ORDER BY n DESC, pt.tag
      LIMIT ?1`,
    limit,
  );
}

 /** The logged-in author's own work, for the composer's project picker. */
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
    tags?: string[];
  },
): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const statements = [
    stmt(
      context,
      `INSERT INTO posts
         (id, author_id, kind, body, project_id, repost_of_id, visibility,
          created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'public', ?7, ?7)`,
      id,
      input.authorId,
      input.kind,
      input.body,
      input.projectId ?? null,
      input.repostOfId ?? null,
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
  ];
  await batch(context, statements);
  return id;
}

