import type { Match, Team } from "@/lib/types";
import MatchRow, { sideTones } from "@/components/MatchRow";
import { RelativeDay } from "@/components/RelativeTime";
import { teamNameShort } from "@/lib/teamNamesJa";
import { jstShortDate, jstTime, lateNightTag } from "@/lib/datetime";

/**
 * The whole round on one screen — finished matches and the ones still to come,
 * at the same size and in the same list.
 *
 * A ticker cannot do this job: on a Sunday morning in Japan the round is half
 * played and half still ahead, and a reader needs to take in all ten at a
 * glance rather than wait for them to slide past. Results carry a score and
 * fixtures carry a kickoff time in exactly the same slot, so neither half of
 * the weekend reads as the footnote to the other.
 */
export default function WeekendBoard({
  matches,
  teamById,
  clickableMatchIds,
}: {
  matches: Match[];
  teamById: Record<number, Team>;
  clickableMatchIds: Set<number>;
}) {
  if (matches.length === 0) {
    return <p className="text-body text-muted">この節の試合データがまだありません。</p>;
  }

  const days: { date: string; matches: Match[] }[] = [];
  for (const m of matches) {
    const date = jstShortDate(m.utcDate);
    const last = days[days.length - 1];
    if (last && last.date === date) last.matches.push(m);
    else days.push({ date, matches: [m] });
  }

  return (
    // Each day was a panel of its own. Three panels for one list of ten made
    // the round look like three things; a date heading and some space do the
    // same grouping without saying so.
    <div className="grid gap-y-panel sm:grid-cols-2 sm:gap-x-group lg:grid-cols-3">
      {days.map((day) => (
        <div key={day.date}>
          <p className="flex items-baseline gap-inline pb-hair text-note font-strong text-foreground">
            <span className="tabular-nums">{day.date}</span>
            <span className="ml-auto font-body tabular-nums text-muted">
              {day.matches.length}試合
            </span>
          </p>
          {day.matches.map((m) => {
            const home = teamById[m.homeTeamId];
            const away = teamById[m.awayTeamId];
            if (!home || !away) return null;
            const homeGoals = m.homeGoals ?? 0;
            const awayGoals = m.awayGoals ?? 0;
            const [homeTone, awayTone] = sideTones(m.played, homeGoals, awayGoals);
            const clickable = clickableMatchIds.has(m.id);

            return (
              <MatchRow
                key={m.id}
                home={home}
                away={away}
                homeTone={homeTone}
                awayTone={awayTone}
                homeAfter={<span className="sr-only">{m.homeGoals == null ? "" : `${m.homeGoals}点`}</span>}
                awayAfter={<span className="sr-only">{m.awayGoals == null ? "" : `${m.awayGoals}点`}</span>}
                center={
                  <>
                    {m.played ? (
                      <span className="font-numeral text-lead font-strong text-foreground">
                        {homeGoals}-{awayGoals}
                      </span>
                    ) : (
                      <>
                        <span className="font-numeral text-lead font-strong text-foreground">
                          {jstTime(m.utcDate)}
                        </span>
                        <RelativeDay iso={m.utcDate} className="mt-hair text-micro font-label text-accent-2" />
                      </>
                    )}
                    {lateNightTag(m.utcDate) && (
                      <span className="mt-hair text-micro text-muted">{lateNightTag(m.utcDate)}</span>
                    )}
                  </>
                }
                href={clickable ? `/matches/${m.id}` : undefined}
                ariaLabel={
                  !clickable
                    ? undefined
                    : m.played
                      ? `${teamNameShort(home)} ${homeGoals} - ${awayGoals} ${teamNameShort(away)} の詳細`
                      : `${teamNameShort(home)} 対 ${teamNameShort(away)}（${jstShortDate(m.utcDate)} ${jstTime(m.utcDate)} 日本時間 キックオフ）の詳細`
                }
                unplayedMark={!m.played}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
