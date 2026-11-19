/**
 * Page header used by every route inside the app shell.
 * Measured from Contra's workspace panel: 10px uppercase label, then a
 * 34px/600 headline with -0.02em tracking, 8px apart.
 */
export function PageHead({
  label,
  title,
  description,
  actions,
}: {
  label?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {label && (
          <p className="font-mono text-[10px] tracking-[1.2px] text-[var(--color-ink-soft)] uppercase">
            {label}
          </p>
        )}
        <h1 className="mt-1.5 text-[34px] font-semibold leading-tight tracking-[-0.02em]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-[560px] text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Section heading inside a page: 20px/600, optional right action. */
export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[20px] font-semibold tracking-[-0.01em]">{children}</h2>
      {action}
    </div>
  );
}
