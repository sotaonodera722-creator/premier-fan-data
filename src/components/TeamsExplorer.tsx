"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { MatchResultLetter, Team } from "@/lib/types";
import type { ClubProfile, ClubTier } from "@/lib/clubProfiles";
import { TIER_LABELS } from "@/lib/clubProfiles";
import TeamBadge from "@/components/TeamBadge";
import FormPills from "@/components/FormPills";
import ClubBadges from "@/components/ClubBadges";
import { useUrlParams } from "@/lib/useUrlParams";

/**
 * Everything one club's card needs, assembled on the server. The explorer used
 * to reach into the data layer itself, which pulled a megabyte of match and
 * lineup JSON into the browser to draw twenty cards.
 */
export interface ClubCard {
  team: Team;
  nameJa: string;
  position: number | null;
  points: number | null;
  goalDiff: number | null;
  winRate: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  founded: number | null;
  form: MatchResultLetter[];
  formPoints: number;
  nextOpponent: Team | null;
  japaneseCount: number;
  inRelegationZone: boolean;
  profile: ClubProfile | undefined;
}

type SortKey = "position" | "form" | "goalDiff" | "winRate";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "position", label: "順位" },
  { key: "form", label: "調子(直近5試合)" },
  { key: "goalDiff", label: "得失点差" },
  { key: "winRate", label: "勝率" },
];

type FilterKey = "all" | ClubTier | "relegation";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "big6", label: TIER_LABELS.big6 },
  { key: "midtable", label: TIER_LABELS.midtable },
  { key: "promoted", label: TIER_LABELS.promoted },
  { key: "relegation", label: "残留争い" },
];

const isSortKey = (v: string | undefined): v is SortKey => SORTS.some((s) => s.key === v);
const isFilterKey = (v: string | undefined): v is FilterKey => FILTERS.some((f) => f.key === v);

function matchesFilter(club: ClubCard, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "relegation") return club.inRelegationZone;
  return club.profile?.tier === filter;
}

export default function TeamsExplorer({
  clubs,
  initialSort,
  initialQuery,
  initialFilter,
}: {
  clubs: ClubCard[];
  initialSort?: string;
  initialQuery?: string;
  initialFilter?: string;
}) {
  const [sort, setSort] = useState<SortKey>(isSortKey(initialSort) ? initialSort : "position");
  const [filter, setFilter] = useState<FilterKey>(isFilterKey(initialFilter) ? initialFilter : "all");
  const [query, setQuery] = useState(initialQuery ?? "");
  const updateUrl = useUrlParams();

  function selectSort(next: SortKey) {
    setSort(next);
    updateUrl({ sort: next === "position" ? undefined : next });
  }

  function selectFilter(next: FilterKey) {
    setFilter(next);
    updateUrl({ tier: next === "all" ? undefined : next });
  }

  // Debounced so the URL isn't rewritten on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => updateUrl({ q: query || undefined }), 300);
    return () => clearTimeout(id);
  }, [query, updateUrl]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f.key, clubs.filter((c) => matchesFilter(c, f.key)).length])
      ) as Record<FilterKey, number>,
    [clubs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Searching in Japanese matters more than searching in English here — the
    // reader arrives knowing 「ブライトン」, not "Brighton & Hove Albion FC".
    const list = clubs.filter(
      (c) =>
        matchesFilter(c, filter) &&
        (!q ||
          c.nameJa.toLowerCase().includes(q) ||
          c.team.name.toLowerCase().includes(q) ||
          c.team.shortName.toLowerCase().includes(q) ||
          (c.profile?.city ?? "").toLowerCase().includes(q))
    );
    return [...list].sort((a, b) => {
      switch (sort) {
        case "form":
          return b.formPoints - a.formPoints;
        case "goalDiff":
          return (b.goalDiff ?? 0) - (a.goalDiff ?? 0);
        case "winRate":
          return (b.winRate ?? 0) - (a.winRate ?? 0);
        default:
          return (a.position ?? 99) - (b.position ?? 99);
      }
    });
  }, [clubs, sort, filter, query]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-surface p-1">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => selectSort(s.key)}
              className={`inline-flex min-h-[44px] items-center rounded-md px-3 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                sort === s.key ? "bg-accent text-background" : "text-muted hover:text-foreground"
              }`}
            >
              {s.label}順
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="クラブ名・街で検索"
          aria-label="クラブ名・街で検索"
          className="ml-auto min-h-[44px] w-full max-w-xs rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-2 focus:outline-none"
        />
      </div>

      <div className="no-scrollbar mb-6 flex gap-1.5 overflow-x-auto" role="group" aria-label="クラブを絞り込む">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => selectFilter(f.key)}
            aria-current={filter === f.key ? "true" : undefined}
            className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
              filter === f.key
                ? "bg-accent font-semibold text-background"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {f.label}
            <span className="tabular-nums opacity-70">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((club) => (
          <Link
            key={club.team.id}
            href={`/teams/${club.team.id}`}
            className="glass group relative flex flex-col rounded-xl p-5 transition hover:-translate-y-0.5 hover:border-accent-2/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <div className="flex items-start gap-3">
              <TeamBadge team={club.team} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold leading-tight text-foreground">{club.nameJa}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-muted">{club.team.name}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-[family-name:var(--font-display)] text-base font-semibold leading-none tabular-nums text-muted">
                  {club.position ?? "-"}
                  <span className="ml-0.5 text-[11px] font-normal">位</span>
                </p>
                <p className="mt-1 text-[11px] tabular-nums text-muted">勝点{club.points ?? "-"}</p>
              </div>
            </div>

            <ClubBadges profile={club.profile} inRelegationZone={club.inRelegationZone} className="mt-3" />

            {club.profile && (
              <div className="mt-3 space-y-0.5 text-[11px] leading-relaxed text-muted">
                <p>
                  {club.profile.city}
                  {club.founded && <span className="tabular-nums"> ・{club.founded}年創設</span>}
                </p>
                <p>{club.profile.venueJa}</p>
              </div>
            )}

            {club.profile && (
              <p className="mt-3 text-sm leading-relaxed text-foreground">{club.profile.identity}</p>
            )}

            <div className="mt-auto space-y-2 border-t border-border pt-3.5">
              <div className="flex items-center justify-between gap-2 pt-3">
                <span className="text-[11px] text-muted">直近5試合</span>
                <FormPills form={club.form} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted">次戦</span>
                {club.nextOpponent ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                    {club.nextOpponent.shortName}
                    <TeamBadge team={club.nextOpponent} size={18} />
                  </span>
                ) : (
                  <span className="text-[11px] text-muted">-</span>
                )}
              </div>
              {club.japaneseCount > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted">日本人選手</span>
                  <span className="text-[11px] font-medium tabular-nums text-foreground">
                    {club.japaneseCount}名
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-muted">
            該当するクラブがありません。絞り込みか検索語を変えてみてください。
          </p>
        )}
      </div>
    </div>
  );
}
