export default function SectionHeading({
  title,
  titleSuffix,
  action,
}: {
  title: string;
  titleSuffix?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    // The Latin kicker that used to sit above the title is gone from all 42
    // places it appeared. Only one of them carried information — the matchday
    // number on the standings page, now written in Japanese in the title — and
    // the other 41 were the heading again in English. A label that repeats the
    // line beneath it is decoration, and repeating it on every section is the
    // most recognisable thing about a template.
    <div className="mb-heading flex items-end justify-between gap-4">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-title font-strong tracking-tight text-foreground">
          {title}
          {titleSuffix}
        </h2>
      </div>
      {action}
    </div>
  );
}
