import { Link } from "react-router";
import { splitBody, tagHref } from "~/lib/tags";

/**
 * Post text with `#话题` turned into links. Line breaks are preserved, and
 * nothing is passed through as raw HTML.
 */
export function PostBody({
  body,
  className = "",
}: {
  body: string;
  className?: string;
}) {
  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {splitBody(body).map((part, i) =>
        part.type === "tag" ? (
          <Link
            key={i}
            to={tagHref(part.value)}
            className="underline decoration-[var(--color-line)] decoration-1 underline-offset-2 transition hover:decoration-[var(--color-ink)]"
          >
            #{part.value}
          </Link>
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </p>
  );
}

/** Compact tag chip row, used under a post and in the feed's filter bar. */
export function TagLinks({
  tags,
  className = "",
}: {
  tags: string[];
  className?: string;
}) {
  if (!tags.length) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {tags.map((tag) => (
        <Link
          key={tag}
          to={tagHref(tag)}
          className="chip transition hover:!bg-[var(--color-sunken-deep)]"
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
}
