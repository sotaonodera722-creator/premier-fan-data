"use client";

import { useState } from "react";
import Link from "next/link";
import type { Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";

export type TeamStatRow = { team: Team; display: string };

type Tab = "goals" | "conceded" | "cleanSheets" | "possession" | "xg" | "shots";

const TABS: { key: Tab; label: string }[] = [
  { key: "goals", label: "平均得点数" },
  { key: "conceded", label: "平均被得点数" },
  { key: "cleanSheets", label: "無失点試合数" },
  { key: "possession", label: "平均支配率" },
  { key: "xg", label: "平均xG" },
  { key: "shots", label: "平均枠内シュート数" },
];

export default function TeamStatsExplorer({
  initialTab,
  goals,
  conceded,
  cleanSheets,
  possession,
  xg,
  shots,
}: {
  initialTab?: string;
  goals: TeamStatRow[];
  conceded: TeamStatRow[];
  cleanSheets: TeamStatRow[];
  possession: TeamStatRow[];
  xg: TeamStatRow[];
  shots: TeamStatRow[];
}) {
  const isTab = (v: string | undefined): v is Tab => TABS.some((t) => t.key === v);
  const [tab, setTab] = useState<Tab>(isTab(initialTab) ? initialTab : "goals");

  const dataByTab: Record<Tab, TeamStatRow[]> = { goals, conceded, cleanSheets, possession, xg, shots };
  const rows = dataByTab[tab];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1.5 rounded-lg border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition ${
              tab === t.key ? "bg-accent text-background" : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="glass divide-y divide-border rounded-xl">
        {rows.map((row, i) => (
          <Link
            key={row.team.id}
            href={`/teams/${row.team.id}`}
            className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-surface-2"
          >
            <span className="w-6 text-sm font-bold text-muted">{i + 1}</span>
            <TeamBadge team={row.team} size={28} />
            <span className="flex-1 truncate font-medium text-foreground">{row.team.name}</span>
            <span className="font-[family-name:var(--font-display)] text-xl font-bold text-accent">
              {row.display}
            </span>
          </Link>
        ))}
        {rows.length === 0 && <p className="p-4 text-sm text-muted">データがまだありません。</p>}
      </div>
    </div>
  );
}
