import type { Route } from "./+types/actions-upload";
import { requireMe } from "~/lib/session.server";
import { stmt } from "~/lib/db.server";

/** Uploaded originals are compressed client-side; the server still enforces a hard 1MB cap. */
const MAX_BYTES = 1024 * 1024;
const ALLOWED = new Set(["image/webp", "image/jpeg", "image/png", "image/gif"]);
const KINDS = new Set(["avatar", "profile_cover", "project_cover"]);

export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ ok: false, error: "只支持 POST" }, { status: 405 });
  }
  const me = await requireMe(context, request);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "上传格式不对" }, { status: 400 });
  }

  const file = form.get("file");
  const kind = String(form.get("kind") ?? "");
  if (!(file instanceof File) || !file.size) {
    return Response.json({ ok: false, error: "请选择图片" }, { status: 400 });
  }
  if (!KINDS.has(kind)) {
    return Response.json({ ok: false, error: "图片用途不对" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return Response.json({ ok: false, error: "只支持 WebP / JPEG / PNG / GIF 图片" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ ok: false, error: "图片超过 1MB，请先压缩" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const now = Date.now();
  await stmt(
    context,
    `INSERT INTO media_blobs (id, owner_id, kind, content_type, size_bytes, data, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
    id, me.id, kind, file.type, file.size, bytes, now,
  ).run();

  if (form.get("apply_to_profile") === "1" && kind === "avatar") {
    await stmt(
      context,
      `UPDATE profiles SET avatar_url = ?1, updated_at = ?2 WHERE user_id = ?3`,
      `/media/${id}`, now, me.id,
    ).run();
  }

  return Response.json({ ok: true, url: `/media/${id}` });
}
