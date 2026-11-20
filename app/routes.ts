import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/shell.tsx", [
    index("routes/home.tsx"),

    route("feed", "routes/feed.tsx"),

    route("discover", "routes/discover.tsx"),
    route("discover/projects", "routes/discover-projects.tsx"),

    route("projects/:slug/edit", "routes/project-edit.tsx"),
    route("projects/:slug", "routes/project.tsx"),
    route("posts/:id/edit", "routes/post-edit.tsx"),
    route("posts/:id", "routes/post.tsx"),

    route("notifications", "routes/notifications.tsx"),

    route("settings/profile", "routes/settings-profile.tsx"),
    route("settings/accounts", "routes/settings-accounts.tsx"),
    route("settings/privacy", "routes/settings-privacy.tsx"),

    route("new/post", "routes/new-post.tsx"),
    route("new/project", "routes/new-project.tsx"),

    route(":handle", "routes/profile.tsx"),
    route(":handle/projects", "routes/profile-projects.tsx"),

    route("actions/like", "routes/actions-like.tsx"),
    route("actions/follow", "routes/actions-follow.tsx"),
    route("actions/comment", "routes/actions-comment.tsx"),
    route("actions/bookmark", "routes/actions-bookmark.tsx"),
    route("actions/repost", "routes/actions-repost.tsx"),
  ]),

  // auth lives outside the shell: full-bleed, no nav chrome
  route("join", "routes/join.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
] satisfies RouteConfig;
