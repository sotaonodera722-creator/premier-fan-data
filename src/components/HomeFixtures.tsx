"use client";

import { useMemo, useState } from "react";
import type { Match, Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";

function shortDate(utcDate: string): string {
  return new Date(utcDate).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" });
}

function kickoffTime(utcDate: string): string {
  return new Date(utcDate).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" });
}

export default function HomeFixtures({
  matches,
  teams,
  currentMatchday,
}: {
  matches: Match[];
  teams: Team[];
  currentMatchday: number;
}) {
  const [matchday, setMatchday] = useState(currentMatchday);

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const maxMatchday = useMemo(() => matches.reduce((m, x) => Math.max(m, x.matchday), 1), [matches]);
  const rounds = useMemo(() => Array.from({ length: maxMatchday }, (_, i) => i + 1), [maxMatchday]);
  const roundMatches = useMemo(() => matches.filter((m) => m.matchday === matchday), [matches, matchday]);

  return (
    <div>
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {rounds.map((r) => (
          <button
            key={r}
            onClick={() => setMatchday(r)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              r === matchday
                ? "bg-accent font-semibold text-background"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            第{r}節
          </button>
        ))}
      </div>

      <div className="glass divide-y divide-border overflow-hidden rounded-xl">
        {roundMatches.length === 0 && <p className="p-4 text-sm text-muted">この節の試合データがありません。</p>}
        {roundMatches.map((m) => {
          const home = teamById.get(m.homeTeamId);
          const away = teamById.get(m.awayTeamId);
          if (!home || !away) return null;
          return (
            <div key={m.id} className="flex items-center gap-2.5 px-4 py-2.5 text-sm">
              <span className="w-16 shrink-0 text-[11px] text-muted">{shortDate(m.utcDate)}</span>
              <span className="flex flex-1 items-center justify-end gap-1.5 truncate">
                <span className="truncate text-foreground">{home.shortName}</span>
                <TeamBadge team={home} size={20} />
              </span>
              <span className="w-10 shrink-0 text-center font-[family-name:var(--font-display)] text-xs font-bold text-muted">
                {m.played ? `${m.homeGoals}-${m.awayGoals}` : kickoffTime(m.utcDate)}
              </span>
              <span className="flex flex-1 items-center gap-1.5 truncate">
                <TeamBadge team={away} size={20} />
                <span className="truncate text-foreground">{away.shortName}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
