import { getPlayers, getTeams, getPlayerRanking } from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import PlayersExplorer from "@/components/PlayersExplorer";
import PlayerRankingList from "@/components/PlayerRankingList";
import SampleSizeNote from "@/components/SampleSizeNote";

export const metadata = {
  title: "選手名鑑 | Premier Fan Data",
};

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; team?: string; pos?: string; jp?: string; sort?: string }>;
}) {
  const { q, team, pos, jp, sort } = await searchParams;
  const players = getPlayers();
  const teams = getTeams();
  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));

  const topScorers = getPlayerRanking("goals", 5).entries;
  const topAssists = getPlayerRanking("assists", 5).entries;
  const topGA = getPlayerRanking("ga", 5).entries;
  const topMinutes = getPlayerRanking("minutes", 5).entries;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
      <SectionHeading title="選手名鑑" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        プレミアリーグ全20クラブ・{players.length}名の選手データベース。チームやポジションで絞り込み、日本人選手だけの表示にも切り替えられます。
      </p>

      <div className="mb-14 grid gap-8 lg:grid-cols-2">
        <PlayerRankingList
          title="得点ランキング"
          entries={topScorers}
          teamById={teamById}
          emptyLabel="得点"
          moreHref="/players/rankings?tab=goals"
        />
        <PlayerRankingList
          title="アシストランキング"
          entries={topAssists}
          teamById={teamById}
          emptyLabel="アシスト"
          moreHref="/players/rankings?tab=assists"
        />
        <PlayerRankingList
          title="G+A ランキング"
          entries={topGA}
          teamById={teamById}
          emptyLabel="G+A"
          moreHref="/players/rankings?tab=ga"
        />
        <PlayerRankingList
          title="出場時間ランキング"
          entries={topMinutes}
          teamById={teamById}
          emptyLabel="出場時間"
          valueSuffix="分"
          moreHref="/players/rankings?tab=minutes"
        />
      </div>

      <SampleSizeNote derived />

      <SectionHeading title="選手を検索" />
      <PlayersExplorer
        players={players}
        teams={teams}
        initialQuery={q}
        initialTeamId={team}
        initialPosition={pos}
        initialJapaneseOnly={jp}
        initialSort={sort}
      />
    </div>
  );
}
