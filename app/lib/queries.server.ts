import type { AppLoadContext } from "react-router";
import { many } from "./db.server";
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

const PROJECT_SELECT = `
  SELECT pr.id, pr.slug, pr.kind, pr.title, pr.summary, pr.cover_url,
         pr.featured, pr.created_at,
         u.handle, p.display_name, p.avatar_url,
         (SELECT COUNT(*) FROM reactions r
           WHERE r.target_type = 'project' AND r.target_id = pr.id) AS likes
    FROM projects pr
    JOIN users u   ON u.id = pr.owner_id
    JOIN profiles p ON p.user_id = pr.owner_id
   WHERE pr.visibility = 'public' AND u.status = 'active'
`;

export async function latestProjects(
  context: AppLoadContext,
  limit = 9,
): Promise<ProjectCardRow[]> {
  return many<ProjectCardRow>(
    context,
    `${PROJECT_SELECT} ORDER BY pr.featured DESC, pr.created_at DESC LIMIT ?1`,
    limit,
  );
}

export async function projectsByOwner(
  context: AppLoadContext,
  ownerId: string,
): Promise<ProjectCardRow[]> {
  return many<ProjectCardRow>(
    context,
    `${PROJECT_SELECT} AND pr.owner_id = ?1 ORDER BY pr.featured DESC, pr.created_at DESC`,
    ownerId,
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
  opts: { q?: string; kind?: string; sort?: string; limit?: number },
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

  const where = clauses.length ? ` AND ${clauses.join(" AND ")}` : "";
  const order =
    opts.sort === "likes" ? "likes DESC, pr.created_at DESC" : "pr.created_at DESC";

  return many<ProjectCardRow>(
    context,
    `${PROJECT_SELECT}${where} ORDER BY ${order} LIMIT ?${i}`,
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
