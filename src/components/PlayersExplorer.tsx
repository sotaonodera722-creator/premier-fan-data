"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Player, Position, Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import { useUrlParams } from "@/lib/useUrlParams";

type SortKey = "goals" | "assists" | "age";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "goals", label: "得点" },
  { key: "assists", label: "アシスト" },
  { key: "age", label: "年齢" },
];

const POSITIONS: Position[] = ["GK", "DF", "MF", "FW"];
const isSortKey = (v: string | undefined): v is SortKey => SORTS.some((s) => s.key === v);
const isPosition = (v: string | undefined): v is Position => POSITIONS.some((p) => p === v);

export default function PlayersExplorer({
  players,
  teams,
  initialQuery,
  initialTeamId,
  initialPosition,
  initialJapaneseOnly,
  initialSort,
}: {
  players: Player[];
  teams: Team[];
  initialQuery?: string;
  initialTeamId?: string;
  initialPosition?: string;
  initialJapaneseOnly?: string;
  initialSort?: string;
}) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [teamId, setTeamId] = useState<string>(initialTeamId ?? "all");
  const [position, setPosition] = useState<Position | "all">(isPosition(initialPosition) ? initialPosition : "all");
  const [japaneseOnly, setJapaneseOnly] = useState(initialJapaneseOnly === "1");
  const [sort, setSort] = useState<SortKey>(isSortKey(initialSort) ? initialSort : "goals");
  const updateUrl = useUrlParams();

  useEffect(() => {
    const id = setTimeout(() => updateUrl({ q: query || undefined }), 300);
    return () => clearTimeout(id);
  }, [query, updateUrl]);

  function selectTeamId(next: string) {
    setTeamId(next);
    updateUrl({ team: next === "all" ? undefined : next });
  }

  function selectPosition(next: Position | "all") {
    setPosition(next);
    updateUrl({ pos: next === "all" ? undefined : next });
  }

  function toggleJapaneseOnly() {
    const next = !japaneseOnly;
    setJapaneseOnly(next);
    updateUrl({ jp: next ? "1" : undefined });
  }

  function selectSort(next: SortKey) {
    setSort(next);
    updateUrl({ sort: next === "goals" ? undefined : next });
  }

  const teamById = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = players.filter((p) => {
      if (japaneseOnly && !p.isJapanese) return false;
      if (teamId !== "all" && String(p.teamId) !== teamId) return false;
      if (position !== "all" && p.position !== position) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === "age") return (a.age ?? 0) - (b.age ?? 0);
      return (b[sort] ?? 0) - (a[sort] ?? 0);
    });
  }, [players, query, teamId, position, japaneseOnly, sort]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="選手名で検索"
          className="w-full max-w-xs rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-2 focus:outline-none"
        />
        <select
          value={teamId}
          onChange={(e) => selectTeamId(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent-2 focus:outline-none"
        >
          <option value="all">全チーム</option>
          {teams.map((t) => (
            <option key={t.id} value={String(t.id)}>
              {t.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          <button
            onClick={() => selectPosition("all")}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
              position === "all" ? "bg-accent text-background" : "text-muted hover:text-foreground"
            }`}
          >
            全て
          </button>
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => selectPosition(pos)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                position === pos ? "bg-accent text-background" : "text-muted hover:text-foreground"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
        <button
          onClick={toggleJapaneseOnly}
          className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
            japaneseOnly
              ? "border-accent-2/50 bg-accent-2/15 text-accent-2"
              : "border-border bg-surface text-muted hover:text-foreground"
          }`}
        >
          🇯🇵 日本人選手のみ
        </button>
        <div className="ml-auto flex gap-1 rounded-lg border border-border bg-surface p-1">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => selectSort(s.key)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                sort === s.key ? "bg-accent text-background" : "text-muted hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 text-xs text-muted">{filtered.length}名の選手が見つかりました</p>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((p) => {
          const team = teamById[p.teamId];
          return (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="glass flex flex-col gap-3 rounded-xl p-4 transition hover:-translate-y-0.5 hover:border-accent/40"
            >
              <div className="flex items-start justify-between">
                <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-bold text-muted">
                  {p.position}
                </span>
                {p.isJapanese && <span title="日本人選手">🇯🇵</span>}
              </div>
              <div>
                <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                <p className="text-xs text-muted">
                  {p.nationality} · {p.age ? `${p.age}歳` : "-"}
                </p>
              </div>
              {team && (
                <div className="flex items-center gap-2 border-t border-border pt-2.5">
                  <TeamBadge team={team} size={22} />
                  <span className="truncate text-xs text-muted">{team.shortName}</span>
                  <span className="ml-auto text-xs text-muted">
                    {p.goals !== null ? `${p.goals}G ${p.assists ?? 0}A` : "-"}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-muted">該当する選手がいません。</p>
        )}
      </div>
    </div>
  );
}
