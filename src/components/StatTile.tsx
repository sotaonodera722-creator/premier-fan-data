import Link from "next/link";

// A single figure with its label above and its context below. The figure is the
// only thing set in the display face — everything else on the tile exists to
// make it mean something.
function TileBody({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: React.ReactNode;
}) {
  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-1">
        <span className="font-[family-name:var(--font-display)] text-2xl font-bold leading-none tracking-tight text-foreground sm:text-3xl">
          {value}
        </span>
        {unit && <span className="text-xs text-muted">{unit}</span>}
      </p>
      {hint && <p className="mt-1.5 text-[11px] leading-snug text-muted">{hint}</p>}
    </>
  );
}

export default function StatTile({
  label,
  value,
  unit,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  /** Set apart from the figure so "4" stays the thing the eye lands on. */
  unit?: string;
  hint?: React.ReactNode;
  href?: string;
}) {
  if (!href) {
    return (
      <div className="glass rounded-xl px-4 py-3.5">
        <TileBody label={label} value={value} unit={unit} hint={hint} />
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="glass block rounded-xl px-4 py-3.5 transition hover:border-accent-2/50 hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <TileBody label={label} value={value} unit={unit} hint={hint} />
    </Link>
  );
}
