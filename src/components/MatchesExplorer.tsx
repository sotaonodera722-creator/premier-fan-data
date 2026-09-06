"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Match, Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import { useUrlParams } from "@/lib/useUrlParams";

type Mode = "date" | "matchday" | "team";

const MODES: { key: Mode; label: string }[] = [
  { key: "date", label: "日付別" },
  { key: "matchday", label: "ラウンド別" },
  { key: "team", label: "チーム別" },
];

function dateKey(utcDate: string): string {
  return new Date(utcDate).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Tokyo",
  });
}

function rangeDate(utcDate: string): string {
  return new Date(utcDate).toLocaleDateString("ja-JP", { month: "long", day: "numeric", timeZone: "Asia/Tokyo" });
}

function kickoffTime(utcDate: string): string {
  return new Date(utcDate).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" });
}

function shortDate(utcDate: string): string {
  return new Date(utcDate).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });
}

function MatchRow({
  match,
  teamById,
  clickable,
  showDate,
}: {
  match: Match;
  teamById: Map<number, Team>;
  clickable: boolean;
  showDate?: boolean;
}) {
  const home = teamById.get(match.homeTeamId);
  const away = teamById.get(match.awayTeamId);

  const content = (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 text-sm">
      <div className="flex items-center justify-end gap-2 truncate text-right">
        <span className="truncate text-foreground">{home?.name}</span>
        {home && <TeamBadge team={home} size={24} />}
      </div>
      <div className="flex flex-col items-center justify-self-center">
        {showDate && <span className="text-[10px] text-muted">{shortDate(match.utcDate)}</span>}
        {match.played ? (
          <span className="font-[family-name:var(--font-display)] text-sm font-bold text-foreground">
            {match.homeGoals} - {match.awayGoals}
          </span>
        ) : (
          <span className="text-xs font-medium text-muted">{kickoffTime(match.utcDate)}</span>
        )}
      </div>
      <div className="flex items-center gap-2 truncate">
        {away && <TeamBadge team={away} size={24} />}
        <span className="truncate text-foreground">{away?.name}</span>
      </div>
    </div>
  );

  if (!clickable) return <div>{content}</div>;
  return (
    <Link href={`/matches/${match.id}`} className="block transition hover:bg-surface-2">
      {content}
    </Link>
  );
}

function MatchdayPager({
  label,
  matchday,
  maxMatchday,
  onChange,
}: {
  label: string;
  matchday: number;
  maxMatchday: number;
  onChange: (matchday: number) => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-center gap-4">
      <button
        onClick={() => onChange(Math.max(1, matchday - 1))}
        disabled={matchday <= 1}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-surface disabled:opacity-30"
        aria-label="前の節"
      >
        ‹
      </button>
      <span className="font-[family-name:var(--font-display)] text-lg font-bold text-foreground">{label}</span>
      <button
        onClick={() => onChange(Math.min(maxMatchday, matchday + 1))}
        disabled={matchday >= maxMatchday}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-surface disabled:opacity-30"
        aria-label="次の節"
      >
        ›
      </button>
    </div>
  );
}

function MatchList({
  matches,
  teamById,
  clickableMatchIds,
  showDate,
}: {
  matches: Match[];
  teamById: Map<number, Team>;
  clickableMatchIds: Set<number>;
  showDate?: boolean;
}) {
  if (matches.length === 0) {
    return <p className="glass rounded-xl p-5 text-sm text-muted">該当する試合がありません。</p>;
  }
  return (
    <div className="glass divide-y divide-border rounded-xl">
      {matches.map((m) => (
        <MatchRow
          key={m.id}
          match={m}
          teamById={teamById}
          clickable={clickableMatchIds.has(m.id)}
          showDate={showDate}
        />
      ))}
    </div>
  );
}

const isMode = (v: string | undefined): v is Mode => MODES.some((m) => m.key === v);

export default function MatchesExplorer({
  matches,
  teams,
  currentMatchday,
  clickableMatchIds,
  initialMode,
  initialMatchday,
  initialTeamId,
}: {
  matches: Match[];
  teams: Team[];
  currentMatchday: number;
  clickableMatchIds: number[];
  initialMode?: string;
  initialMatchday?: string;
  initialTeamId?: string;
}) {
  const parsedInitialMatchday = Number(initialMatchday);
  const parsedInitialTeamId = Number(initialTeamId);
  const [mode, setMode] = useState<Mode>(isMode(initialMode) ? initialMode : "date");
  const [matchday, setMatchday] = useState(
    Number.isInteger(parsedInitialMatchday) && parsedInitialMatchday >= 1 ? parsedInitialMatchday : currentMatchday
  );
  const [teamId, setTeamId] = useState<number>(
    Number.isInteger(parsedInitialTeamId) && teams.some((t) => t.id === parsedInitialTeamId)
      ? parsedInitialTeamId
      : teams[0]?.id ?? 0
  );
  const updateUrl = useUrlParams();

  function selectMode(next: Mode) {
    setMode(next);
    updateUrl({ mode: next === "date" ? undefined : next });
  }

  function changeMatchday(next: number) {
    setMatchday(next);
    updateUrl({ matchday: String(next) });
  }

  function selectTeamId(next: number) {
    setTeamId(next);
    updateUrl({ team: String(next) });
  }

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const clickableSet = useMemo(() => new Set(clickableMatchIds), [clickableMatchIds]);
  const maxMatchday = useMemo(() => matches.reduce((m, x) => Math.max(m, x.matchday), 1), [matches]);

  const matchdayMatches = useMemo(
    () => matches.filter((m) => m.matchday === matchday),
    [matches, matchday]
  );

  const dateGroups = useMemo(() => {
    const groups: { label: string; matches: Match[] }[] = [];
    for (const m of matchdayMatches) {
      const label = dateKey(m.utcDate);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.matches.push(m);
      else groups.push({ label, matches: [m] });
    }
    return groups;
  }, [matchdayMatches]);

  const dateRangeLabel = useMemo(() => {
    if (matchdayMatches.length === 0) return "";
    const start = rangeDate(matchdayMatches[0].utcDate);
    const end = rangeDate(matchdayMatches[matchdayMatches.length - 1].utcDate);
    return start === end ? start : `${start} - ${end}`;
  }, [matchdayMatches]);

  const teamMatches = useMemo(
    () => matches.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId),
    [matches, teamId]
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1.5 rounded-lg border border-border bg-surface p-1">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => selectMode(m.key)}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition ${
              mode === m.key ? "bg-accent text-background" : "text-muted hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "date" && (
        <div>
          <MatchdayPager label={dateRangeLabel} matchday={matchday} maxMatchday={maxMatchday} onChange={changeMatchday} />
          <div className="space-y-6">
            {dateGroups.map((g) => (
              <div key={g.label}>
                <p className="mb-2 rounded-md bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted">
                  {g.label}
                </p>
                <MatchList matches={g.matches} teamById={teamById} clickableMatchIds={clickableSet} />
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "matchday" && (
        <div>
          <MatchdayPager
            label={`第${matchday}節`}
            matchday={matchday}
            maxMatchday={maxMatchday}
            onChange={changeMatchday}
          />
          <MatchList matches={matchdayMatches} teamById={teamById} clickableMatchIds={clickableSet} showDate />
        </div>
      )}

      {mode === "team" && (
        <div>
          <select
            value={teamId}
            onChange={(e) => selectTeamId(Number(e.target.value))}
            className="mb-4 w-full max-w-xs rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-accent-2 focus:outline-none"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <MatchList matches={teamMatches} teamById={teamById} clickableMatchIds={clickableSet} showDate />
        </div>
      )}
    </div>
  );
}
