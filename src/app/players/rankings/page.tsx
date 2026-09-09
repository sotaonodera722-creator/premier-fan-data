import { getTeams, getPlayerRanking } from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import PlayerRankingsExplorer from "@/components/PlayerRankingsExplorer";
import SampleSizeNote from "@/components/SampleSizeNote";

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

  const goals = getPlayerRanking("goals", RANKING_LIMIT);
  const assists = getPlayerRanking("assists", RANKING_LIMIT);
  const ga = getPlayerRanking("ga", RANKING_LIMIT);
  const minutes = getPlayerRanking("minutes", RANKING_LIMIT);

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
      <SampleSizeNote derived />
    </div>
  );
}
