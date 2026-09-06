import { getAllMatches, getTeams, getCurrentMatchday, getClickableMatchIds } from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import MatchesExplorer from "@/components/MatchesExplorer";

export const metadata = {
  title: "試合 | Premier Fan Data",
};

export default function MatchesPage() {
  const matches = getAllMatches();
  const teams = getTeams();
  const currentMatchday = getCurrentMatchday();
  const clickableMatchIds = getClickableMatchIds();

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6">
      <SectionHeading eyebrow="Fixtures & Results" title="試合" />
      <MatchesExplorer
        matches={matches}
        teams={teams}
        currentMatchday={currentMatchday}
        clickableMatchIds={clickableMatchIds}
      />
    </div>
  );
}
