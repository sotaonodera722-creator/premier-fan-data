import { getStandingsTable, getCurrentMatchday } from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import SampleSizeNote from "@/components/SampleSizeNote";
import StandingsTable from "@/components/StandingsTable";
import ZoneLegend from "@/components/ZoneLegend";

export const metadata = {
  title: "順位表 | Premier Fan Data",
};

export default function StandingsPage() {
  const rows = getStandingsTable();
  const matchday = getCurrentMatchday();
  const hasProvisionalBoundary = rows.some((r) => r.tieStraddlesZoneBoundary);
  const clubsWithGamesInHand = rows.filter((r) => r.gamesInHand > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      <SectionHeading eyebrow={`Matchday ${matchday}`} title="順位表" />

      {clubsWithGamesInHand.length > 0 && (
        // Positions are read as a ranking of strength, which they are not while
        // clubs have played a different number of matches. Say so above the
        // table rather than leaving it to be inferred from the 試合 column.
        <p className="mb-4 rounded-lg border border-border bg-background-alt px-3.5 py-2.5 text-xs leading-relaxed text-muted">
          <span className="font-medium text-foreground">消化試合数が揃っていません。</span>{" "}
          {clubsWithGamesInHand
            .map((r) => `${r.team.shortName}（${r.gamesInHand}試合少ない）`)
            .join("・")}
          。試合を消化すれば順位が入れ替わる可能性があります。
        </p>
      )}

      <StandingsTable rows={rows} />
      <ZoneLegend totalTeams={rows.length} hasProvisionalBoundary={hasProvisionalBoundary} />
      <SampleSizeNote />
    </div>
  );
}
