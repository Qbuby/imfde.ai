import type { Route } from "./+types/media-file";
import { one } from "~/lib/db.server";

/** Serves locally uploaded images from D1 with immutable caching + ETag/304. */
export async function loader({ params, request, context }: Route.LoaderArgs) {
  const id = String(params.id ?? "");
  const row = await one<{
    content_type: string;
    data: ArrayBuffer;
    size_bytes: number;
  }>(
    context,
    `SELECT content_type, data, size_bytes FROM media_blobs WHERE id = ?1`,
    id,
  );
  if (!row) return new Response("Not Found", { status: 404 });

  const etag = `"${id}"`;
  if (request.headers.get("If-None-Match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }
  const headers = {
    "Content-Type": row.content_type,
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: etag,
    "Content-Length": String(row.size_bytes),
  };
  return new Response(row.data as ArrayBuffer, { status: 200, headers });
}
