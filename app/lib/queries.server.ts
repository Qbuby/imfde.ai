import type { AppLoadContext } from "react-router";
import { batch, many, stmt } from "./db.server";
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
  repost_of_id: string | null;
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
         po.project_id, po.repost_of_id,
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
         op.id AS r_id, op.kind AS r_kind, op.body AS r_body,
         op.created_at AS r_created_at,
         ou.handle AS r_handle, opf.display_name AS r_display_name,
         opf.avatar_url AS r_avatar_url,
         rpr.slug AS r_project_slug, rpr.title AS r_project_title,
         rpr.cover_url AS r_project_cover_url
    FROM posts po
    JOIN users u     ON u.id = po.author_id
    JOIN profiles p  ON p.user_id = po.author_id
    LEFT JOIN projects pr
           ON pr.id = po.project_id
          AND (pr.visibility <> 'private' OR pr.owner_id = ?${viewerSlot})
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
   WHERE po.visibility = 'public' AND po.deleted_at IS NULL AND u.status = 'active'
     AND (p.visibility = 'public' OR po.author_id = ?${viewerSlot})
`;

type RawFeedRow = Omit<FeedPostRow, "time_label" | "tags" | "repost"> & {
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
  return {
    hasMore,
    rows: page.map((r) => ({
      ...r,
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
    tags?: string[];
  },
): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  await batch(context, [
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
