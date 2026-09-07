import { getLatestResults } from "@/lib/data";
import type { StandingRow } from "@/lib/types";

/**
 * Where the table stops being a snapshot.
 *
 * A position on its own is a state: Liverpool are 6th. The week's news is that
 * they were 13th on Monday. That second number is the whole reason to open a
 * league table on a Sunday, so it travels with the first one rather than living
 * in a separate "movers" list nobody scrolls to.
 *
 * The three tones are semantic — up, down, unchanged — not decoration. Level is
 * a dash rather than a zero, because a "0" beside a position reads as a missing
 * figure instead of as a club that held its place.
 */
export default function MovementIndicator({
  row,
  className = "",
}: {
  row: StandingRow;
  className?: string;
}) {
  const change = row.positionChange;
  if (change == null || row.position == null) return null;

  const { matchday, pending } = getLatestResults();
  const movement = change > 0 ? `${change}つ上昇` : change < 0 ? `${-change}つ下降` : "変動なし";
  const from = `第${matchday - 1}節終了時点の${row.previousPosition}位から${movement}`;
  const points = row.roundPoints > 0 ? `この節の勝点 +${row.roundPoints}` : "この節の勝点なし";
  // Mid-round the figure is real but unfinished: clubs yet to kick off can still
  // pass the club being described. Saying so costs less than being wrong later.
  const caveat = pending > 0 ? `・第${matchday}節はあと${pending}試合残っている` : "";

  const glyph = change > 0 ? `▲${change}` : change < 0 ? `▼${-change}` : "−";
  const tone = change > 0 ? "text-success" : change < 0 ? "text-danger" : "text-muted";

  return (
    <span
      role="img"
      aria-label={`前節から${movement}`}
      title={`${from}（${points}）${caveat}`}
      className={`font-[family-name:var(--font-display)] text-[10px] font-bold leading-none tabular-nums ${tone} ${className}`}
    >
      <span aria-hidden="true">{glyph}</span>
    </span>
  );
}
