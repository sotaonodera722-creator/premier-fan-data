import { getPlayers, getTeams, getTopScorers, getTopAssists } from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import PlayersExplorer from "@/components/PlayersExplorer";
import PlayerRankingList from "@/components/PlayerRankingList";

export const metadata = {
  title: "選手名鑑 | Premier Fan Data",
};

export default function PlayersPage() {
  const players = getPlayers();
  const teams = getTeams();
  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const topScorers = getTopScorers(10);
  const topAssists = getTopAssists(10);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
      <SectionHeading eyebrow="Player Directory" title="選手名鑑" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        プレミアリーグ全20クラブ・{players.length}名の選手データベース。チームやポジションで絞り込み、日本人選手だけの表示にも切り替えられます。
      </p>

      <div className="mb-14 grid gap-8 lg:grid-cols-2">
        <PlayerRankingList
          eyebrow="Scorers"
          title="得点ランキング"
          players={topScorers}
          teamById={teamById}
          statKey="goals"
          statLabel="得点"
        />
        <PlayerRankingList
          eyebrow="Assists"
          title="アシストランキング"
          players={topAssists}
          teamById={teamById}
          statKey="assists"
          statLabel="アシスト"
        />
      </div>

      <SectionHeading eyebrow="Directory" title="選手を検索" />
      <PlayersExplorer players={players} teams={teams} />
    </div>
  );
}
