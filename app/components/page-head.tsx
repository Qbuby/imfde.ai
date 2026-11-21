/** Page header inside the app shell — clean type, no decorative eyebrow. */
export function PageHead({
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
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em] text-[#0f1419] sm:text-[32px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-[560px] text-[14.5px] leading-relaxed text-[#536471]">
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
