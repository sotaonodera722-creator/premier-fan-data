import type { StandingRow } from "@/lib/types";
import { StandingsCardList } from "@/components/StandingsTable";

/** Clubs shown from the top of the table — the European places plus one. */
const TOP_COUNT = 6;
/** Clubs shown from the bottom — the relegation places. */
const BOTTOM_COUNT = 3;

// Reprinting all twenty rows here made the homepage a copy of /standings, and
// the mid-table clubs are not what a reader opening this page on a Sunday
// morning is checking. The two ends are: who is winning the league, and who is
// going down. Everything between them is one tap away.
export default function HomeStandingsTable({ rows }: { rows: StandingRow[] }) {
  const showAll = rows.length <= TOP_COUNT + BOTTOM_COUNT + 1;

  // Clubs level on points share a position number, and a cut through the middle
  // of such a group prints one "6th" and silently drops the other. The bottom
  // slice already grew upwards to start on a whole group; the top slice did not
  // grow downwards, so Newcastle — level with Liverpool on six — was missing
  // from a list that claimed to be omitting seventh place onwards.
  let topEnd = Math.min(TOP_COUNT, rows.length);
  while (
    topEnd < rows.length &&
    rows[topEnd]?.position != null &&
    rows[topEnd].position === rows[topEnd - 1]?.position
  ) {
    topEnd += 1;
  }

  let bottomStart = rows.length - BOTTOM_COUNT;
  while (
    bottomStart > topEnd &&
    rows[bottomStart - 1]?.position != null &&
    rows[bottomStart - 1].position === rows[bottomStart].position
  ) {
    bottomStart -= 1;
  }

  // Both slices growing can leave nothing between them to omit.
  const cut = bottomStart > topEnd;
  const shown = showAll || !cut ? rows : [...rows.slice(0, topEnd), ...rows.slice(bottomStart)];

  return (
    <StandingsCardList
      rows={shown}
      className=""
      omittedAfterIndex={showAll || !cut ? undefined : topEnd - 1}
    />
  );
}
