import {
  getGoalsPerGameRanking,
  getGoalsConcededPerGameRanking,
  getCleanSheetsRanking,
  getTeamStatAverage,
} from "@/lib/data";
import type { Team } from "@/lib/types";
import TeamStatCard, { type TeamStatRow as Row } from "@/components/TeamStatCard";

const TEAM_COUNT = 20;

// Top 2 stay as-is. The 3rd slot is the actual 3rd-place team, unless `teamId` is
// given and that team sits outside the top 3 — then its own rank/value takes the
// 3rd slot instead, so a club's own page always shows where it really stands.
function buildRows(all: { team: Team; value: number }[], teamId?: number): Row[] {
  const ranked = all.map((r, i) => ({ ...r, rank: i + 1 }));
  if (!teamId) return ranked.slice(0, 3);
  const mine = ranked.find((r) => r.team.id === teamId);
  if (!mine || mine.rank <= 3) return ranked.slice(0, 3);
  return [...ranked.slice(0, 2), mine];
}

export default function KeyTeamStats({ teamId }: { teamId?: number } = {}) {
  const limit = teamId ? TEAM_COUNT : 3;
  const cards = [
    {
      title: "平均得点数",
      tab: "goals",
      rows: buildRows(getGoalsPerGameRanking(limit), teamId),
      format: (v: number) => v.toFixed(1),
    },
    {
      title: "平均被得点数",
      tab: "conceded",
      rows: buildRows(getGoalsConcededPerGameRanking(limit), teamId),
      format: (v: number) => v.toFixed(1),
    },
    {
      title: "無失点試合数",
      tab: "cleanSheets",
      rows: buildRows(getCleanSheetsRanking(limit), teamId),
      format: (v: number) => `${v}試合`,
    },
    {
      title: "平均支配率",
      tab: "possession",
      rows: buildRows(getTeamStatAverage("Possession", limit), teamId),
      format: (v: number) => `${Math.round(v * 100)}%`,
    },
    {
      title: "平均期待得点 (xG)",
      tab: "xg",
      rows: buildRows(getTeamStatAverage("Expected Goals", limit), teamId),
      format: (v: number) => v.toFixed(2),
    },
    {
      title: "平均枠内シュート数",
      tab: "shots",
      rows: buildRows(getTeamStatAverage("Shots on target", limit), teamId),
      format: (v: number) => v.toFixed(1),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <TeamStatCard key={c.title} title={c.title} rows={c.rows} format={c.format} tab={c.tab} teamId={teamId} />
      ))}
    </div>
  );
}
