import type { Route } from "./+types/profile-projects";
import { Link } from "react-router";
import { getMe, normalizeHandle } from "~/lib/session.server";
import { one } from "~/lib/db.server";
import { ProjectCard } from "~/components/cards";
import { Avatar } from "~/components/media";
import { projectsByOwner } from "~/lib/queries.server";

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const handle = normalizeHandle(params.handle);
  if (!handle) throw new Response("Not Found", { status: 404 });

  const me = await getMe(context, request);
  const user = await one<{
    id: string;
    handle: string;
    display_name: string;
    avatar_url: string | null;
    visibility: string;
  }>(
    context,
    `SELECT u.id, u.handle, p.display_name, p.avatar_url, p.visibility
       FROM users u JOIN profiles p ON p.user_id = u.id
      WHERE u.handle = ?1 AND u.status = 'active'`,
    handle,
  );

  if (!user) throw new Response("Not Found", { status: 404 });
  if (user.visibility === "private" && user.id !== me?.id) {
    throw new Response("Not Found", { status: 404 });
  }

  const projects = await projectsByOwner(context, user.id);
  return { user, projects, isSelf: me?.id === user.id };
}

export default function ProfileProjects({ loaderData }: Route.ComponentProps) {
  const { user, projects, isSelf } = loaderData;

  return (
    <div>
      <Link
        to={`/@${user.handle}`}
        className="inline-flex items-center gap-2.5 transition hover:opacity-80"
      >
        <Avatar name={user.display_name} src={user.avatar_url} size={38} />
        <div>
          <p className="text-[14px] font-medium">{user.display_name}</p>
          <p className="font-mono text-[11px] tracking-wide text-[var(--color-faint)]">
            @{user.handle}
          </p>
        </div>
      </Link>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="eyebrow">Work</p>
          <h1 className="display mt-2 text-[clamp(26px,3vw,38px)]">
            全部作品
          </h1>
        </div>
        <p className="font-mono text-[11.5px] tracking-[0.1em] text-[var(--color-faint)] uppercase">
          {projects.length} 个
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="card mt-8 px-6 py-16 text-center">
          <p className="text-[13.5px] text-[var(--color-muted)]">
            这个人还没有公开作品。
          </p>
          {isSelf && (
            <Link to="/new/project" className="btn btn-primary btn-sm mt-4">
              上传第一个
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
