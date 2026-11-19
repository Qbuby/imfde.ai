/**
 * Route-local right column, mirroring Contra's panel structure:
 * the route owns its content; the shell only supplies the white card.
 */
export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

/** Section heading with an optional right-aligned action. */
export function SectionHead({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">
        {title}
      </h2>
      {action}
    </div>
  );
}

/** Uppercase micro-label used above lists, 10px / +1.2px — measured. */
export function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
      {children}
    </p>
  );
}
