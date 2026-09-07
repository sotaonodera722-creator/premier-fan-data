import { getLatestResults } from "@/lib/data";

/**
 * The one line that makes the arrows in the table mean something.
 *
 * A tooltip carries the detail on a desktop, but the reader this site is built
 * for is holding a phone and will never see one, so the reference point — which
 * round the movement is measured from — is written out where the table starts.
 */
export default function MovementLegend({ className = "" }: { className?: string }) {
  const { matchday, pending } = getLatestResults();
  if (matchday <= 1) return null;

  return (
    <p className={`text-[11px] leading-relaxed text-muted ${className}`}>
      <span className="font-bold text-success">▲</span>
      <span className="font-bold text-danger">▼</span>
      {/* "第2節終了時点" is exact but makes the reader do the arithmetic. Leading
          with the round they are actually looking at, and keeping the precise
          reference in parentheses, costs four characters and no accuracy. */}
      <span> は今節が始まる前（第{matchday - 1}節終了時点）からの順位変動</span>
      {pending > 0 && <span>。第{matchday}節はあと{pending}試合あり、変動はまだ確定していません</span>}
    </p>
  );
}
