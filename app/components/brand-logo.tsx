/**
 * ImFDE official mark: two parallel, forward-sheared geometric wings.
 * Pure vector, monochrome, sharp down to 16px. No external image dependency.
 */
export function BrandMark({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 5H27L23 12H5V5Z" fill="currentColor" />
      <path d="M5 15H21L17 22H12V27H5V15Z" fill="currentColor" />
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
