"use client";

import { useState } from "react";
import Link from "next/link";
import type { Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import type { RankingEntry } from "@/components/PlayerRankingList";

type Tab = "goals" | "assists" | "ga" | "minutes";

const TABS: { key: Tab; label: string; suffix?: string }[] = [
  { key: "goals", label: "得点" },
  { key: "assists", label: "アシスト" },
  { key: "ga", label: "G+A" },
  { key: "minutes", label: "出場時間", suffix: "分" },
];

export default function PlayerRankingsExplorer({
  initialTab,
  teamById,
  goals,
  assists,
  ga,
  minutes,
}: {
  initialTab?: string;
  teamById: Record<number, Team>;
  goals: RankingEntry[];
  assists: RankingEntry[];
  ga: RankingEntry[];
  minutes: RankingEntry[];
}) {
  const isTab = (v: string | undefined): v is Tab => TABS.some((t) => t.key === v);
  const [tab, setTab] = useState<Tab>(isTab(initialTab) ? initialTab : "goals");

  const dataByTab: Record<Tab, RankingEntry[]> = { goals, assists, ga, minutes };
  const entries = dataByTab[tab];
  const suffix = TABS.find((t) => t.key === tab)?.suffix;

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
        {entries.map(({ player: p, value }, i) => {
          const team = teamById[p.teamId];
          return (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface/60"
            >
              <span className="w-6 text-sm font-bold text-muted">{i + 1}</span>
              {team && <TeamBadge team={team} size={28} />}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                  {p.isJapanese && "🇯🇵"} {p.name}
                </p>
                <p className="truncate text-xs text-muted">{team?.name}</p>
              </div>
              <span className="font-[family-name:var(--font-display)] text-xl font-bold text-accent">
                {value}
                {suffix && <span className="ml-0.5 text-xs font-medium text-muted">{suffix}</span>}
              </span>
            </Link>
          );
        })}
        {entries.length === 0 && <p className="p-4 text-sm text-muted">データがまだありません。</p>}
      </div>
    </div>
  );
}
