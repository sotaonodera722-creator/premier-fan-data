import Link from "next/link";
import { getRoundProgress } from "@/lib/data";
import { jstShortDate, jstTime, lateNightTag } from "@/lib/datetime";
import { RelativeDay } from "@/components/RelativeTime";

const LINK =
  "-my-3 inline-flex min-h-[44px] items-center py-3 font-label text-accent-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// The first thing on the page, because on a Sunday morning in Japan the round
// is structurally unfinished: kickoffs run Saturday 20:30 through Monday 00:30.
// A reader arriving at that hour needs both halves of the answer at once — how
// much they missed, and what is still to come tonight.
export default function RoundStatus() {
  const { matchday, total, played, pending, remaining, nextRoundKickoff } = getRoundProgress();

  if (total === 0) {
    return (
      <p className="text-body text-muted">現在進行中の節がありません。次の節が始まるとここに表示されます。</p>
    );
  }

  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-x-inline gap-y-hair">
        <span className="text-note font-strong text-accent-2">第{matchday}節</span>
        <span className="text-lead text-foreground">
          <span className="font-numeral text-title font-stat">
            {pending === 0 ? `全${total}試合` : `${total}試合中${played}試合`}
          </span>
          <span className="ml-hair">が終了</span>
        </span>
      </p>

      {pending > 0 ? (
        <ul className="mt-inline flex flex-wrap items-center gap-x-inline gap-y-hair text-note">
          <li className="text-muted">残り{pending}試合</li>
          {remaining.map((m) => (
            <li
              key={m.id}
              // A flat fill rather than a bordered chip: these are the matches
              // still to come, not buttons.
              className="flex items-baseline gap-hair bg-background-alt px-inline py-hair text-foreground"
            >
              {/* The absolute date is always in the markup; the relative word is
                  layered on after hydration, since a statically built "今夜" is
                  wrong within hours of the deploy. */}
              <RelativeDay iso={m.utcDate} className="font-label text-accent-2" />
              <span className="tabular-nums text-muted">{jstShortDate(m.utcDate)}</span>
              <span className="font-label tabular-nums">{jstTime(m.utcDate)}</span>
              {lateNightTag(m.utcDate) && (
                <span className="text-micro text-muted">{lateNightTag(m.utcDate)}</span>
              )}
            </li>
          ))}
          <li>
            <Link href="/matches" className={LINK}>
              日程を見る →
            </Link>
          </li>
        </ul>
      ) : nextRoundKickoff ? (
        // With the round over, the useful next sentence is when to come back —
        // not a restatement of the line above.
        <p className="mt-hair flex flex-wrap items-baseline gap-x-hair text-note text-muted">
          <span>次は第{nextRoundKickoff.matchday}節、</span>
          <RelativeDay iso={nextRoundKickoff.utcDate} className="font-label text-accent-2" />
          <span className="tabular-nums">{jstShortDate(nextRoundKickoff.utcDate)}</span>
          <span className="font-label tabular-nums text-foreground">
            {jstTime(nextRoundKickoff.utcDate)}
          </span>
          {lateNightTag(nextRoundKickoff.utcDate) && (
            <span className="text-micro">{lateNightTag(nextRoundKickoff.utcDate)}</span>
          )}
          <span>から</span>
          <Link href="/matches" className={LINK}>
            日程を見る →
          </Link>
        </p>
      ) : (
        <p className="mt-inline text-note text-muted">今シーズンの残り試合はありません。</p>
      )}
    </div>
  );
}
