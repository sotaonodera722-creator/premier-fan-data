import { getStandingsTable, getCurrentMatchday } from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import { teamNameShort } from "@/lib/teamNamesJa";
import SampleSizeNote from "@/components/SampleSizeNote";
import StandingsTable, { visibleFormLength } from "@/components/StandingsTable";
import ZoneLegend from "@/components/ZoneLegend";
import MovementLegend from "@/components/MovementLegend";
import SeasonMovers from "@/components/SeasonMovers";

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
      {/* The one Latin label that carried information rather than repeating
          the heading: the matchday. It moves into the Japanese title. */}
      <SectionHeading title="順位表" titleSuffix={<span className="ml-2 align-middle text-note font-body text-muted">第{matchday}節</span>} />

      {clubsWithGamesInHand.length > 0 && (
        // Positions are read as a ranking of strength, which they are not while
        // clubs have played a different number of matches. Say so above the
        // table rather than leaving it to be inferred from the 試合 column.
        <p className="mb-panel rounded-lg bg-background-alt px-panel py-inline text-note text-muted">
          <span className="font-label text-foreground">消化試合数が揃っていません。</span>{" "}
          {clubsWithGamesInHand
            .map((r) => `${teamNameShort(r.team)}（${r.gamesInHand}試合少ない）`)
            .join("・")}
          。試合を消化すれば順位が入れ替わる可能性があります。
        </p>
      )}

      <MovementLegend className="mb-inline" />
      <StandingsTable rows={rows} />
      <ZoneLegend
        totalTeams={rows.length}
        formLength={visibleFormLength(rows)}
        hasProvisionalBoundary={hasProvisionalBoundary}
      />
      <SampleSizeNote />
      <SeasonMovers />
    </div>
  );
}
