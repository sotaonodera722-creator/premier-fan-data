import {
  getGoalsPerGameRanking,
  getGoalsConcededPerGameRanking,
  getCleanSheetsRanking,
  getTeamStatAverage,
} from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import TeamStatsExplorer from "@/components/TeamStatsExplorer";

export const metadata = {
  title: "チームスタッツ ランキング | Premier Fan Data",
};

const RANKING_LIMIT = 20;

export default async function TeamStatsRankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  const goals = getGoalsPerGameRanking(RANKING_LIMIT).map((r) => ({ team: r.team, display: r.value.toFixed(1) }));
  const conceded = getGoalsConcededPerGameRanking(RANKING_LIMIT).map((r) => ({
    team: r.team,
    display: r.value.toFixed(1),
  }));
  const cleanSheets = getCleanSheetsRanking(RANKING_LIMIT).map((r) => ({
    team: r.team,
    display: `${r.value}試合`,
  }));
  const possession = getTeamStatAverage("Possession", RANKING_LIMIT).map((r) => ({
    team: r.team,
    display: `${Math.round(r.value * 100)}%`,
  }));
  const xg = getTeamStatAverage("Expected Goals", RANKING_LIMIT).map((r) => ({
    team: r.team,
    display: r.value.toFixed(2),
  }));
  const shots = getTeamStatAverage("Shots on target", RANKING_LIMIT).map((r) => ({
    team: r.team,
    display: r.value.toFixed(1),
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6">
      <SectionHeading eyebrow="Team Stats" title="チームスタッツランキング" />
      <TeamStatsExplorer
        initialTab={tab}
        goals={goals}
        conceded={conceded}
        cleanSheets={cleanSheets}
        possession={possession}
        xg={xg}
        shots={shots}
      />
    </div>
  );
}
