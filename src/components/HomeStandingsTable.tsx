import type { StandingRow } from "@/lib/types";
import { StandingsCardList } from "@/components/StandingsTable";

// The homepage gives the standings half a column, which is narrower than the
// full table needs at any breakpoint — so it always uses the card list, and the
// full table stays on /standings where there is room for twelve columns.
export default function HomeStandingsTable({ rows }: { rows: StandingRow[] }) {
  return <StandingsCardList rows={rows} className="" />;
}
