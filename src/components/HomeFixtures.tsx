"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Match, Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import MatchdayPills from "@/components/MatchdayPills";
import { RelativeKickoff } from "@/components/RelativeTime";
import { useUrlParams } from "@/lib/useUrlParams";
import { getTeamNameJa } from "@/lib/teamNamesJa";
import { jstShortDate, jstTime, lateNightNote } from "@/lib/datetime";

function clubLabel(team: Team): string {
  return getTeamNameJa(team.id)?.short ?? team.shortName;
}

/** One side of a fixture. Mirrored for the away club so the score sits centred. */
function Side({ team, align }: { team: Team; align: "home" | "away" }) {
  return (
    <span
      className={`flex min-w-0 items-center gap-1.5 ${
        align === "home" ? "justify-end text-right" : "justify-start text-left"
      }`}
    >
      {align === "away" && <TeamBadge team={team} size={20} />}
      <span className="min-w-0 text-[13px] leading-tight text-foreground">{clubLabel(team)}</span>
      {align === "home" && <TeamBadge team={team} size={20} />}
    </span>
  );
}

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
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMatchday(Math.max(1, matchday - 1))}
          disabled={matchday <= 1}
          aria-label="前の節"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-muted transition hover:text-foreground disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {/* min-width rather than a fixed one so the arrows don't shift between 第1節 and 第10節 */}
        <span className="min-w-14 shrink-0 text-center text-sm font-semibold text-foreground">第{matchday}節</span>
        <button
          type="button"
          onClick={() => setMatchday(Math.min(maxMatchday, matchday + 1))}
          disabled={matchday >= maxMatchday}
          aria-label="次の節"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-muted transition hover:text-foreground disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {roundStatus && (
          <span className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            {roundStatus}
          </span>
        )}
        {matchday !== currentMatchday && (
          // Thirty-eight rounds is a long way to wander. One tap always comes back.
          <button
            type="button"
            onClick={() => setMatchday(currentMatchday)}
            className="-my-2 ml-auto shrink-0 rounded-sm py-2 text-xs font-medium text-accent-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            第{currentMatchday}節へ戻る
          </button>
        )}
      </div>

      <div className="mb-3">
        <MatchdayPills rounds={rounds} matchday={matchday} onChange={setMatchday} />
      </div>

      {roundMatches.length === 0 && (
        <p className="glass rounded-xl p-4 text-sm text-muted">この節の試合データがありません。</p>
      )}

      <div className="space-y-3">
        {dayGroups.map((group) => (
          <div key={group.date} className="glass overflow-hidden rounded-xl">
            <p className="flex items-baseline gap-2 border-b border-border bg-background-alt px-3 py-1.5 text-[11px] font-semibold text-foreground">
              <span className="tabular-nums">{group.date}</span>
              {group.note && <span className="font-normal text-muted">{group.note}</span>}
            </p>
            <div className="divide-y divide-border">
              {group.matches.map((m) => {
                const home = teamById.get(m.homeTeamId);
                const away = teamById.get(m.awayTeamId);
                if (!home || !away) return null;
                const content = (
                  <div className="grid min-h-[44px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-2.5">
                    <Side team={home} align="home" />
                    <span className="flex w-14 flex-col items-center justify-self-center leading-tight">
                      {m.played ? (
                        <span className="font-[family-name:var(--font-display)] text-sm font-bold tabular-nums text-foreground">
                          {m.homeGoals}-{m.awayGoals}
                        </span>
                      ) : (
                        <>
                          <span className="text-xs font-medium tabular-nums text-foreground">
                            {jstTime(m.utcDate)}
                          </span>
                          <RelativeKickoff iso={m.utcDate} className="text-[9px] text-accent-2" />
                        </>
                      )}
                    </span>
                    <Side team={away} align="away" />
                  </div>
                );
                if (!clickableMatchIds.has(m.id)) return <div key={m.id}>{content}</div>;
                return (
                  <Link
                    key={m.id}
                    href={`/matches/${m.id}`}
                    className="block transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
