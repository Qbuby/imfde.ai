/**
 * Tags are typed inline (`#RAG`、`#客户成功`) rather than chosen from a list,
 * so the same parser has to run on the server (when writing post_tags) and in
 * the browser (when turning them into links). Keep it dependency-free.
 */

/** CJK, latin, digits and underscore — a tag cannot contain spaces. */
const TAG_RE = /#([\p{L}\p{N}_]{1,40})/gu;

export function extractTags(text: string, max = 8): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(TAG_RE)) {
    const tag = m[1]!.trim();
    if (!tag) continue;
    // dedupe case-insensitively, keep the first spelling the author used
    if (out.some((t) => t.toLowerCase() === tag.toLowerCase())) continue;
    out.push(tag);
    if (out.length >= max) break;
  }
  return out;
}

export type BodyPart =
  | { type: "text"; value: string }
  | { type: "tag"; value: string };

/** Split a body into literal text and `#tag` runs, preserving line breaks. */
export function splitBody(text: string): BodyPart[] {
  const parts: BodyPart[] = [];
  let last = 0;
  for (const m of text.matchAll(TAG_RE)) {
    const at = m.index ?? 0;
    if (at > last) parts.push({ type: "text", value: text.slice(last, at) });
    parts.push({ type: "tag", value: m[1]! });
    last = at + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

export function tagHref(tag: string): string {
  return `/feed?tag=${encodeURIComponent(tag)}`;
}
