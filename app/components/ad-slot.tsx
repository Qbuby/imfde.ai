import type { AdItem } from "~/lib/queries.server";

/**
 * Explicitly labelled sponsorship. No likes, no ACK, no discussion buttons —
 * these cards never share an interaction surface with community content.
 */
function SponsorBadge({ text }: { text: string }) {
  return <span className="rounded-[5px] bg-[#eef0f2] px-1.5 py-0.5 text-[10.5px] font-medium text-[#697386]">{text}</span>;
}

const FALLBACK: Record<"left" | "right" | "inline", AdItem> = {
  left: {
    id: "fallback-left", placement: "left_rail", title: "合作推广位",
    description: "面向一线 FDE 与 AI 工程团队。", cta_label: "联系合作",
    target_url: "mailto:hello@imfde.ai", image_url: null, badge: "赞助",
  },
  right: {
    id: "fallback-right", placement: "right_rail", title: "合作推广位",
    description: "面向一线 FDE 与 AI 工程团队。", cta_label: "联系合作",
    target_url: "mailto:hello@imfde.ai", image_url: null, badge: "赞助",
  },
  inline: {
    id: "fallback-inline", placement: "feed_inline", title: "合作推广位",
    description: "面向一线 FDE 与 AI 工程团队。", cta_label: "联系合作",
    target_url: "mailto:hello@imfde.ai", image_url: null, badge: "赞助",
  },
};

export function AdSlot({ variant, ad }: { variant: "left" | "right" | "inline"; ad?: AdItem | null }) {
  const item = ad ?? FALLBACK[variant];
  const label = item.badge || "赞助";

  if (variant === "inline") {
    return (
      <div className="border-b border-[#eff3f4] px-4 py-3.5">
        <aside className="flex items-center gap-3 rounded-[14px] border border-[#eceff2] bg-[#f7f9f9] px-3.5 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <SponsorBadge text={label} />
              <span className="truncate text-[13.5px] font-semibold text-[#0f1419]">{item.title}</span>
            </div>
            <p className="mt-1 truncate text-[12.5px] text-[#536471]">{item.description}</p>
          </div>
          <a
            href={item.target_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="shrink-0 rounded-full border border-[#e2e5ea] bg-white px-3 py-1.5 text-[12px] font-medium text-[#0f1419] transition hover:border-[#0f1419]"
          >
            {item.cta_label} <span aria-hidden>↗</span>
          </a>
        </aside>
      </div>
    );
  }

  return (
    <aside className={`rounded-[14px] border border-[#eceff2] bg-[#f7f9f9] p-3.5 ${variant === "left" ? "hidden lg:block" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <SponsorBadge text={label} />
        <span className="text-[10.5px] text-[#8b93a3]">推广</span>
      </div>
      {item.image_url && (
        <img src={item.image_url} alt="" className="mt-2.5 h-20 w-full rounded-[8px] object-cover" loading="lazy" />
      )}
      <p className="mt-2 text-[13px] font-semibold leading-snug text-[#0f1419]">{item.title}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-[#536471]">{item.description}</p>
      <a
        href={item.target_url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-[#0f1419] hover:underline"
      >
        {item.cta_label} <span aria-hidden>↗</span>
      </a>
    </aside>
  );
}
