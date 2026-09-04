import Link from "next/link";
import {
  getGoalsPerGameRanking,
  getGoalsConcededPerGameRanking,
  getCleanSheetsRanking,
  getTeamStatAverage,
} from "@/lib/data";
import type { Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";

type Row = { team: Team; value: number };

function StatCard({
  title,
  rows,
  format,
  tab,
}: {
  title: string;
  rows: Row[];
  format: (v: number) => string;
  tab: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="glass rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <Link href={`/teams/rankings?tab=${tab}`} className="text-xs font-medium text-accent-2 hover:underline">
          もっと見る →
        </Link>
      </div>
      <div className="space-y-2.5">
        {rows.map((row, i) => (
          <Link
            key={row.team.id}
            href={`/teams/${row.team.id}`}
            className="flex items-center gap-2.5 text-sm transition hover:text-accent-2"
          >
            <span className="w-3 text-xs font-bold text-muted">{i + 1}</span>
            <TeamBadge team={row.team} size={20} />
            <span className="flex-1 truncate text-foreground">{row.team.shortName}</span>
            <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-bold text-foreground">
              {format(row.value)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function KeyTeamStats() {
  const cards = [
    { title: "平均得点数", tab: "goals", rows: getGoalsPerGameRanking(3), format: (v: number) => v.toFixed(1) },
    {
      title: "平均被得点数",
      tab: "conceded",
      rows: getGoalsConcededPerGameRanking(3),
      format: (v: number) => v.toFixed(1),
    },
    {
      title: "無失点試合数",
      tab: "cleanSheets",
      rows: getCleanSheetsRanking(3),
      format: (v: number) => `${v}試合`,
    },
    {
      title: "平均支配率",
      tab: "possession",
      rows: getTeamStatAverage("Possession", 3),
      format: (v: number) => `${Math.round(v * 100)}%`,
    },
    {
      title: "平均期待得点 (xG)",
      tab: "xg",
      rows: getTeamStatAverage("Expected Goals", 3),
      format: (v: number) => v.toFixed(2),
    },
    {
      title: "平均枠内シュート数",
      tab: "shots",
      rows: getTeamStatAverage("Shots on target", 3),
      format: (v: number) => v.toFixed(1),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <StatCard key={c.title} title={c.title} rows={c.rows} format={c.format} tab={c.tab} />
      ))}
    </div>
  );
}
