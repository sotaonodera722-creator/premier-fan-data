import { getPlayers, getTeams } from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import PlayersExplorer from "@/components/PlayersExplorer";

export const metadata = {
  title: "選手名鑑 | Premier Fan Data",
};

export default function PlayersPage() {
  const players = getPlayers();
  const teams = getTeams();

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
      <SectionHeading eyebrow="Player Directory" title="選手名鑑" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        プレミアリーグ全20クラブ・{players.length}名の選手データベース。チームやポジションで絞り込み、日本人選手だけの表示にも切り替えられます。
      </p>
      <PlayersExplorer players={players} teams={teams} />
    </div>
  );
}
