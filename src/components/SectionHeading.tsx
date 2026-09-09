export default function SectionHeading({
  eyebrow,
  title,
  titleSuffix,
  action,
}: {
  eyebrow?: string;
  title: string;
  titleSuffix?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent-2">
            {eyebrow}
          </p>
        )}
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
          {titleSuffix}
        </h2>
      </div>
      {action}
    </div>
  );
}
