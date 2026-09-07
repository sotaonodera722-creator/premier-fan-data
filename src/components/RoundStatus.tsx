import Link from "next/link";
import { getRoundProgress } from "@/lib/data";
import { jstShortDate, jstTime, lateNightTag } from "@/lib/datetime";
import { RelativeDay } from "@/components/RelativeTime";

// The first thing on the page, because on a Sunday morning in Japan the round
// is structurally unfinished: kickoffs run Saturday 20:30 through Monday 00:30.
// A reader arriving at that hour needs both halves of the answer at once — how
// much they missed, and what is still to come tonight.
export default function RoundStatus() {
  const { matchday, total, played, pending, remaining, nextRoundKickoff } = getRoundProgress();

  if (total === 0) {
    return (
      <p className="text-sm text-muted">現在進行中の節がありません。次の節が始まるとここに表示されます。</p>
    );
  }

  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-accent-2">
          Matchday {matchday}
        </span>
        <span className="text-sm text-foreground">
          <span className="font-[family-name:var(--font-display)] text-lg font-bold tabular-nums">
            {pending === 0 ? `全${total}試合` : `${total}試合中${played}試合`}
          </span>
          <span className="ml-1">が終了</span>
        </span>
      </p>

      {pending > 0 ? (
        <ul className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
          <li className="text-muted">残り{pending}試合</li>
          {remaining.map((m) => (
            <li
              key={m.id}
              className="flex items-baseline gap-1 rounded-md border border-border px-2 py-1 text-foreground"
            >
              {/* The absolute date is always in the markup; the relative word is
                  layered on after hydration, since a statically built "今夜" is
                  wrong within hours of the deploy. */}
              <RelativeDay iso={m.utcDate} className="font-medium text-accent-2" />
              <span className="tabular-nums text-muted">{jstShortDate(m.utcDate)}</span>
              <span className="font-medium tabular-nums">{jstTime(m.utcDate)}</span>
              {lateNightTag(m.utcDate) && (
                <span className="text-[10px] text-muted">{lateNightTag(m.utcDate)}</span>
              )}
            </li>
          ))}
          <li>
            <Link
              href="/matches"
              className="-my-3 inline-flex min-h-[44px] items-center rounded-sm py-3 text-xs font-medium text-accent-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              日程を見る →
            </Link>
          </li>
        </ul>
      ) : nextRoundKickoff ? (
        // With the round over, the useful next sentence is when to come back —
        // not a restatement of the line above.
        <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-xs text-muted">
          <span>次は第{nextRoundKickoff.matchday}節、</span>
          <RelativeDay iso={nextRoundKickoff.utcDate} className="font-medium text-accent-2" />
          <span className="tabular-nums">{jstShortDate(nextRoundKickoff.utcDate)}</span>
          <span className="font-medium tabular-nums text-foreground">
            {jstTime(nextRoundKickoff.utcDate)}
          </span>
          {lateNightTag(nextRoundKickoff.utcDate) && (
            <span className="text-[10px]">{lateNightTag(nextRoundKickoff.utcDate)}</span>
          )}
          <span>から</span>
          <Link
            href="/matches"
            className="-my-3 inline-flex min-h-[44px] items-center rounded-sm py-3 font-medium text-accent-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            日程を見る →
          </Link>
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted">今シーズンの残り試合はありません。</p>
      )}
    </div>
  );
}
