/**
 * ImFDE official mark (方案 A): three forward-sheared geometric bars.
 * Pure vector, monochrome, sharp down to 16px. No external image dependency.
 */
export function BrandMark({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M10.5 4H28L26.5 10H9L10.5 4Z" />
      <path d="M8.25 13H21.25L19.75 19H6.75L8.25 13Z" />
      <path d="M6 22H13L11.5 28H4.5L6 22Z" />
    </svg>
  );
}

const SIZES = {
  sm: { mark: 18, text: "text-[16px]" },
  md: { mark: 22, text: "text-[20px]" },
  lg: { mark: 24, text: "text-[22px]" },
} as const;

export function BrandLogo({
  size = "md",
  iconOnly = false,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  iconOnly?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  if (iconOnly) {
    return (
      <span className={`inline-flex items-center ${className}`} aria-label="ImFDE">
        <BrandMark size={s.mark} />
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-[-0.03em] text-[#0f1419] ${className}`}>
      <BrandMark size={s.mark} />
      <span className={`display ${s.text}`}>ImFDE</span>
    </span>
  );
}
