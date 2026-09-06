import { getStandings } from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import TeamsExplorer from "@/components/TeamsExplorer";
import KeyTeamStats from "@/components/KeyTeamStats";

export const metadata = {
  title: "チーム一覧 | Premier Fan Data",
};

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const { sort, q } = await searchParams;
  const teams = getStandings();

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
      <SectionHeading eyebrow="Teams" title="チーム一覧" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        プレミアリーグ全20クラブの成績データ。順位・勝点・得失点差・勝率で並び替え、チーム名で検索できます。
      </p>

      <div className="mb-14">
        <SectionHeading eyebrow="Key Stats" title="重要な統計" />
        <KeyTeamStats />
      </div>

      <SectionHeading eyebrow="Directory" title="チームを探す" />
      <TeamsExplorer teams={teams} initialSort={sort} initialQuery={q} />
    </div>
  );
}
