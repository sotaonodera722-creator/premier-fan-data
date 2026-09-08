import Link from "next/link";
import type { Match, Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import { RelativeDay } from "@/components/RelativeTime";
import { getTeamNameJa, teamNameShort } from "@/lib/teamNamesJa";
import { jstShortDate, jstTime, lateNightTag } from "@/lib/datetime";

function clubLabel(team: Team): string {
  return getTeamNameJa(team.id)?.short ?? team.shortName;
}

function Side({
  team,
  goals,
  lost,
  align,
}: {
  team: Team;
  goals: number | null;
  /** Dimmed so the outcome reads without comparing the two numbers. */
  lost: boolean;
  align: "home" | "away";
}) {
  const tone = lost ? "text-muted" : "text-foreground";
  return (
    <span
      className={`flex min-w-0 items-center gap-1.5 ${
        align === "home" ? "justify-end text-right" : "justify-start text-left"
      }`}
    >
      {align === "away" && <TeamBadge team={team} size={18} />}
      <span className={`min-w-0 text-xs leading-tight ${tone}`}>{clubLabel(team)}</span>
      {align === "home" && <TeamBadge team={team} size={18} />}
      <span className="sr-only">{goals == null ? "" : `${goals}点`}</span>
    </span>
  );
}

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
    return (
      <p className="glass rounded-xl p-4 text-sm text-muted">
        この節の試合データがまだありません。
      </p>
    );
  }

  const days: { date: string; matches: Match[] }[] = [];
  for (const m of matches) {
    const date = jstShortDate(m.utcDate);
    const last = days[days.length - 1];
    if (last && last.date === date) last.matches.push(m);
    else days.push({ date, matches: [m] });
  }

  return (
    <div className="grid gap-0 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3">
      {days.map((day) => (
        <div
          key={day.date}
          className="glass overflow-hidden border-t-0 first:rounded-t-xl first:border-t last:rounded-b-xl sm:rounded-xl sm:border-t"
        >
          <p className="flex items-baseline gap-2 border-b border-border bg-background-alt px-3 py-0.5 text-[10px] font-semibold leading-4 text-foreground">
            <span className="tabular-nums">{day.date}</span>
            <span className="ml-auto font-normal tabular-nums text-muted">
              {day.matches.length}試合
            </span>
          </p>
          <div className="divide-y divide-border">
            {day.matches.map((m) => {
              const home = teamById[m.homeTeamId];
              const away = teamById[m.awayTeamId];
              if (!home || !away) return null;
              const homeGoals = m.homeGoals ?? 0;
              const awayGoals = m.awayGoals ?? 0;

              const body = (
                // min-h matches the row height used everywhere else on the site;
                // at this type size the padding alone lands short of a thumb.
                <div className="grid min-h-[44px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-2">
                  <Side
                    team={home}
                    goals={m.homeGoals}
                    lost={m.played && awayGoals > homeGoals}
                    align="home"
                  />
                  <span className="flex w-[3.25rem] flex-col items-center justify-self-center leading-none">
                    {m.played ? (
                      <span className="font-[family-name:var(--font-display)] text-sm font-bold tabular-nums text-foreground">
                        {homeGoals}-{awayGoals}
                      </span>
                    ) : (
                      <>
                        <span className="font-[family-name:var(--font-display)] text-sm font-bold tabular-nums text-foreground">
                          {jstTime(m.utcDate)}
                        </span>
                        <RelativeDay
                          iso={m.utcDate}
                          className="mt-0.5 text-[9px] font-medium text-accent-2"
                        />
                      </>
                    )}
                    {lateNightTag(m.utcDate) && (
                      <span className="text-[9px] leading-tight text-muted">{lateNightTag(m.utcDate)}</span>
                    )}
                  </span>
                  <Side
                    team={away}
                    goals={m.awayGoals}
                    lost={m.played && homeGoals > awayGoals}
                    align="away"
                  />
                </div>
              );

              // A dashed left edge, not a smaller type size, is what separates a
              // fixture from a result — the two are meant to carry equal weight.
              const wrapper = m.played ? "" : "border-l-2 border-dashed border-border";
              if (!clickableMatchIds.has(m.id)) return <div key={m.id} className={wrapper}>{body}</div>;
              return (
                <Link
                  key={m.id}
                  href={`/matches/${m.id}`}
                  aria-label={
                    m.played
                      ? `${teamNameShort(home)} ${homeGoals} - ${awayGoals} ${teamNameShort(away)} の詳細`
                      : `${teamNameShort(home)} 対 ${teamNameShort(away)}（${jstShortDate(m.utcDate)} ${jstTime(m.utcDate)} 日本時間 キックオフ）の詳細`
                  }
                  className={`block transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${wrapper}`}
                >
                  {body}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
