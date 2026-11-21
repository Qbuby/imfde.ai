import * as HoverCard from "@radix-ui/react-hover-card";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Avatar } from "./media";
import { compact } from "~/lib/format";
import { FollowButton } from "./follow-button";
import type { AuthorCardRow } from "~/lib/queries.server";

/**
 * X-style author preview. The fields come from the list query itself, so
 * hovering a card never fires a request. SSR-safe: Radix renders nothing until
 * the pointer actually enters, and motion only animates the portal.
 */
export function AuthorHoverCard({
  author,
  handle,
  displayName,
  avatarUrl,
  signedIn,
  following = false,
  children,
}: {
  author: AuthorCardRow;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  signedIn: boolean;
  following?: boolean;
  children: React.ReactNode;
}) {
  return (
    <HoverCard.Root openDelay={320} closeDelay={120}>
      <HoverCard.Trigger asChild>{children}</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          align="start"
          sideOffset={8}
          className="frost grain z-50 w-[288px] rounded-[14px] border border-[#e2e5ea] p-4 shadow-[var(--shadow-lift)]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
          >
            <Link to={`/@${handle}`} className="flex items-start gap-3">
              <Avatar name={displayName} src={avatarUrl} size={44} />
              <div className="min-w-0 pt-0.5">
                <p className="truncate text-[14px] font-semibold">{displayName}</p>
                <p className="micro-mono">@{handle}</p>
              </div>
            </Link>

            {author.author_headline && (
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-[var(--color-ink-soft)]">
                {author.author_headline}
              </p>
            )}

            <div className="mt-3 flex items-center gap-4 font-mono text-[11.5px] text-[var(--color-faint)] tabular-nums">
              <span>{author.author_projects} 作品</span>
              {author.author_hide_follows ? null : (
                <span>{compact(author.author_followers)} 关注者</span>
              )}
            </div>

            <div className="mt-3 border-t border-[var(--color-line-soft)] pt-3">
              <FollowButton
                targetId={author.author_id}
                following={following}
                signedIn={signedIn}
                size="sm"
                className="w-full [&>button]:w-full"
              />
            </div>
          </motion.div>
          <HoverCard.Arrow className="fill-white" width={10} height={5} />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
