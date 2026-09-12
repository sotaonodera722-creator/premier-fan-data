"use client";

import { useMemo, useState } from "react";
import type { Match, Team } from "@/lib/types";
import MatchRow, { sideTones } from "@/components/MatchRow";
import MatchdayPills from "@/components/MatchdayPills";
import { RelativeKickoff } from "@/components/RelativeTime";
import { useUrlParams } from "@/lib/useUrlParams";
import { jstShortDate, jstTime, lateNightNote } from "@/lib/datetime";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const ROUND_ARROW = `flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition hover:bg-border hover:text-foreground disabled:pointer-events-none disabled:opacity-30 ${FOCUS_RING}`;

export default function HomeFixtures({
  matches,
  teams,
  currentMatchday,
  initialRound,
  clickableMatchIds,
}: {
  matches: Match[];
  teams: Team[];
  currentMatchday: number;
  initialRound?: string;
  clickableMatchIds: Set<number>;
}) {
  const parsedInitialRound = Number(initialRound);
  const [matchday, setMatchdayState] = useState(
    Number.isInteger(parsedInitialRound) && parsedInitialRound >= 1 ? parsedInitialRound : currentMatchday
  );
  const updateUrl = useUrlParams();

  function setMatchday(next: number) {
    setMatchdayState(next);
    updateUrl({ round: String(next) });
  }

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const maxMatchday = useMemo(() => matches.reduce((m, x) => Math.max(m, x.matchday), 1), [matches]);
  const rounds = useMemo(() => Array.from({ length: maxMatchday }, (_, i) => i + 1), [maxMatchday]);
  const roundMatches = useMemo(() => matches.filter((m) => m.matchday === matchday), [matches, matchday]);

  // Grouping by Japanese calendar day is what lets the club names stop
  // truncating: the date moves out of every row into one header per day, which
  // hands roughly 60px back to each name.
  const dayGroups = useMemo(() => {
    const groups: { date: string; note: string | null; matches: Match[] }[] = [];
    for (const m of roundMatches) {
      const date = jstShortDate(m.utcDate);
      const last = groups[groups.length - 1];
      if (last && last.date === date) last.matches.push(m);
      else groups.push({ date, note: lateNightNote(m.utcDate), matches: [m] });
    }
    return groups;
  }, [roundMatches]);

  // The list opens on the next unplayed round, but any round is one pill away —
  // so the header has to say what the rows below actually are rather than always
  // claiming they're upcoming fixtures.
  const roundStatus = useMemo(() => {
    if (roundMatches.length === 0) return null;
    const played = roundMatches.filter((m) => m.played).length;
    if (played === 0) return "これから";
    if (played === roundMatches.length) return "結果";
    return "開催中";
  }, [roundMatches]);

  return (
    <div>
      <div className="mb-inline flex items-center gap-inline">
        <button
          type="button"
          onClick={() => setMatchday(Math.max(1, matchday - 1))}
          disabled={matchday <= 1}
          aria-label="前の節"
          className={ROUND_ARROW}
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {/* min-width rather than a fixed one so the arrows don't shift between 第1節 and 第10節 */}
        <span className="min-w-14 shrink-0 text-center text-body font-strong text-foreground">第{matchday}節</span>
        <button
          type="button"
          onClick={() => setMatchday(Math.min(maxMatchday, matchday + 1))}
          disabled={matchday >= maxMatchday}
          aria-label="次の節"
          className={ROUND_ARROW}
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {roundStatus && (
          // A flat tag, the same one the table uses for a promoted club: it
          // labels the rows below, and a bordered chip beside two round buttons
          // read as a third button.
          <span className="shrink-0 bg-surface-2 px-hair text-micro font-label leading-4 text-muted">
            {roundStatus}
          </span>
        )}
        {matchday !== currentMatchday && (
          // Thirty-eight rounds is a long way to wander. One tap always comes back.
          <button
            type="button"
            onClick={() => setMatchday(currentMatchday)}
            className={`ml-auto inline-flex min-h-[44px] shrink-0 items-center text-note font-label text-accent-2 hover:underline ${FOCUS_RING}`}
          >
            第{currentMatchday}節へ戻る
          </button>
        )}
      </div>

      <div className="mb-panel">
        <MatchdayPills rounds={rounds} matchday={matchday} onChange={setMatchday} />
      </div>

      {roundMatches.length === 0 && <p className="text-body text-muted">この節の試合データがありません。</p>}

      {/* The same rows as the results at the top of the page. Ten matches still
          to come are the other half of the weekend, not a footnote to it, so
          they are set in exactly the same shape. */}
      <div className="grid gap-y-panel lg:grid-cols-2 lg:gap-x-group">
        {dayGroups.map((group) => (
          <div key={group.date}>
            <p className="flex items-baseline gap-inline pb-hair text-note font-strong text-foreground">
              <span className="tabular-nums">{group.date}</span>
              {group.note && <span className="font-body text-muted">{group.note}</span>}
            </p>
            {group.matches.map((m) => {
              const home = teamById.get(m.homeTeamId);
              const away = teamById.get(m.awayTeamId);
              if (!home || !away) return null;
              const [homeTone, awayTone] = sideTones(m.played, m.homeGoals ?? 0, m.awayGoals ?? 0);
              return (
                <MatchRow
                  key={m.id}
                  home={home}
                  away={away}
                  homeTone={homeTone}
                  awayTone={awayTone}
                  center={
                    m.played ? (
                      <span className="font-numeral text-lead font-strong text-foreground">
                        {m.homeGoals}-{m.awayGoals}
                      </span>
                    ) : (
                      <>
                        <span className="font-numeral text-lead font-strong text-foreground">
                          {jstTime(m.utcDate)}
                        </span>
                        <RelativeKickoff iso={m.utcDate} className="mt-hair text-micro text-accent-2" />
                      </>
                    )
                  }
                  href={clickableMatchIds.has(m.id) ? `/matches/${m.id}` : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
