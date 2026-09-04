import { getTeams, getTopScorers, getTopAssists, getTopGoalContributions, getTopMinutes } from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import PlayerRankingsExplorer from "@/components/PlayerRankingsExplorer";

export const metadata = {
  title: "選手スタッツ ランキング | Premier Fan Data",
};

const RANKING_LIMIT = 30;

export default async function PlayerRankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const teams = getTeams();
  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));

  const goals = getTopScorers(RANKING_LIMIT).map((p) => ({ player: p, value: p.goals ?? 0 }));
  const assists = getTopAssists(RANKING_LIMIT).map((p) => ({ player: p, value: p.assists ?? 0 }));
  const ga = getTopGoalContributions(RANKING_LIMIT).map((p) => ({
    player: p,
    value: (p.goals ?? 0) + (p.assists ?? 0),
  }));
  const minutes = getTopMinutes(RANKING_LIMIT).map(({ player, minutes: mins }) => ({ player, value: mins }));

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6">
      <SectionHeading eyebrow="Player Stats" title="選手スタッツランキング" />
      <PlayerRankingsExplorer
        initialTab={tab}
        teamById={teamById}
        goals={goals}
        assists={assists}
        ga={ga}
        minutes={minutes}
      />
    </div>
  );
}
