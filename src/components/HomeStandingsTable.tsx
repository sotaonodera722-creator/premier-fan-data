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

  // Clubs level on points share a position number. Cutting through the middle of
  // such a group would print one "17th" and silently drop the other, so the
  // bottom slice grows upwards until it starts on a whole group.
  let bottomStart = rows.length - BOTTOM_COUNT;
  while (
    bottomStart > TOP_COUNT &&
    rows[bottomStart - 1]?.position != null &&
    rows[bottomStart - 1].position === rows[bottomStart].position
  ) {
    bottomStart -= 1;
  }

  const shown = showAll ? rows : [...rows.slice(0, TOP_COUNT), ...rows.slice(bottomStart)];

  return (
    <StandingsCardList
      rows={shown}
      className=""
      omittedAfterIndex={showAll ? undefined : TOP_COUNT - 1}
    />
  );
}
