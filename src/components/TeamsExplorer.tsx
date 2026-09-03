"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import FormPills from "@/components/FormPills";
import { getForm } from "@/lib/data";

type SortKey = "position" | "points" | "goalDiff" | "winRate";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "position", label: "順位" },
  { key: "points", label: "勝点" },
  { key: "goalDiff", label: "得失点差" },
  { key: "winRate", label: "勝率" },
];

export default function TeamsExplorer({ teams }: { teams: Team[] }) {
  const [sort, setSort] = useState<SortKey>("position");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = teams.filter(
      (t) => !q || t.name.toLowerCase().includes(q) || t.shortName.toLowerCase().includes(q)
    );
    return [...list].sort((a, b) => {
      const ra = a.record;
      const rb = b.record;
      if (!ra || !rb) return 0;
      switch (sort) {
        case "points":
          return rb.points - ra.points;
        case "goalDiff":
          return rb.goalDiff - ra.goalDiff;
        case "winRate":
          return rb.winRate - ra.winRate;
        default:
          return ra.position - rb.position;
      }
    });
  }, [teams, sort, query]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-surface p-1">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
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
          placeholder="チーム名で検索"
          className="ml-auto w-full max-w-xs rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-2 focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((team) => {
          const r = team.record;
          return (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="glass group rounded-xl p-5 transition hover:-translate-y-0.5 hover:border-accent/40"
            >
              <div className="mb-4 flex items-center gap-3">
                <TeamBadge team={team} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-[family-name:var(--font-display)] text-base font-bold text-foreground">
                    {team.name}
                  </p>
                  <p className="text-xs text-muted">
                    {r ? `第${r.position}位 · ${r.points}pt` : "データなし"}
                  </p>
                </div>
                {r && (
                  <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">
                    {r.position}
                  </span>
                )}
              </div>

              {r && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-surface-2 py-2">
                    <p className="font-[family-name:var(--font-display)] text-lg font-bold text-foreground">
                      {r.wins}-{r.draws}-{r.losses}
                    </p>
                    <p className="text-muted">勝-分-敗</p>
                  </div>
                  <div className="rounded-lg bg-surface-2 py-2">
                    <p className="font-[family-name:var(--font-display)] text-lg font-bold text-foreground">
                      {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
                    </p>
                    <p className="text-muted">得失点差</p>
                  </div>
                  <div className="rounded-lg bg-surface-2 py-2">
                    <p className="font-[family-name:var(--font-display)] text-lg font-bold text-foreground">
                      {r.winRate}%
                    </p>
                    <p className="text-muted">勝率</p>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5">
                <span className="text-xs text-muted">直近5試合</span>
                <FormPills form={getForm(team.id, 5)} />
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-muted">該当するチームがありません。</p>
        )}
      </div>
    </div>
  );
}
