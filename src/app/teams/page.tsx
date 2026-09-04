import { getStandings } from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import TeamsExplorer from "@/components/TeamsExplorer";

export const metadata = {
  title: "チーム一覧 | Premier Fan Data",
};

export default function TeamsPage() {
  const teams = getStandings();

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
      <SectionHeading eyebrow="Teams" title="チーム一覧" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        プレミアリーグ全20クラブの成績データ。順位・勝点・得失点差・勝率で並び替え、チーム名で検索できます。
      </p>
      <TeamsExplorer teams={teams} />
    </div>
  );
}
