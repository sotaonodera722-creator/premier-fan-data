import {
  getStandingsTable,
  getPlayerRanking,
  getJapanesePlayerSummaries,
  getTeams,
  getAllMatches,
  getLatestResults,
  getNextFixtureRound,
  getClickableMatchIds,
  getTeamStatAverage,
} from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import SectionLink from "@/components/SectionLink";
import RoundStatus from "@/components/RoundStatus";
import RoundSummaryLede from "@/components/RoundSummaryLede";
import MovementLegend from "@/components/MovementLegend";
import MatchPicks from "@/components/MatchPicks";
import WeekendTiles from "@/components/WeekendTiles";
import JapanesePlayersSection from "@/components/JapanesePlayersSection";
import WeekendBoard from "@/components/WeekendBoard";
import HomeStandingsTable from "@/components/HomeStandingsTable";
import HomeFixtures from "@/components/HomeFixtures";
import HomeRankings from "@/components/HomeRankings";
import SampleSizeNote from "@/components/SampleSizeNote";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ round?: string }>;
}) {
  const { round } = await searchParams;
  const standingsRows = getStandingsTable();
  const jpSummaries = getJapanesePlayerSummaries();
  const teams = getTeams();
  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const allMatches = getAllMatches();
  const results = getLatestResults();
  const nextFixtureRound = getNextFixtureRound();
  const clickableMatchIds = new Set(getClickableMatchIds());

  const topScorers = getPlayerRanking("goals", 3).entries;
  const topAssists = getPlayerRanking("assists", 3).entries;
  const topXg = getTeamStatAverage("Expected Goals", 3).map((r, i) => ({ ...r, rank: i + 1 }));

  return (
    <div className="mx-auto max-w-7xl px-panel pb-section sm:px-heading">
      {/*
        The page opens on where the round stands rather than on a headline. A
        reader arriving on a Sunday morning in Japan is mid-round — some of it
        played overnight, some still to come tonight — and that fact is the
        whole reason this site exists, so it goes above everything else.

        This block is the front page: the round, the sentence, the ten results
        and the four points. It is the only block with a figure above 22px, so
        everything below it reads as reference rather than as news.
      */}
      <section className="pt-panel sm:pt-group">
        <RoundStatus />

        <RoundSummaryLede />

        <div className="mt-heading">
          <WeekendBoard
            matches={results.matches}
            teamById={teamById}
            clickableMatchIds={clickableMatchIds}
          />
        </div>

        <div className="mt-group">
          <WeekendTiles />
        </div>
        <SampleSizeNote derived />
      </section>

      <section className="mt-section">
        <SectionHeading
          title="日本人選手の週末"
          action={<SectionLink href="/players">選手名鑑へ →</SectionLink>}
        />
        <JapanesePlayersSection summaries={jpSummaries} matchday={results.matchday} teamById={teamById} />
      </section>

      {/* The reader who was caught by a name in the section above needs somewhere
          to go next, and "which of the ten do I watch" is the question they have
          at that moment. It sits between the weekend that happened and the table
          that explains it. */}
      <MatchPicks />

      {/* One column at every width. Side by side, the table and the fixtures
          read as two unrelated panels; stacked, the page runs results → table →
          what's next, and the fixtures sit in the same rows as the results at
          the top. The measure is held so a row never stretches across a
          desktop. */}
      <section className="mt-section max-w-3xl">
        <SectionHeading
          title="順位表"
          action={<SectionLink href="/standings">全順位を見る →</SectionLink>}
        />
        <MovementLegend className="mb-inline" />
        <HomeStandingsTable rows={standingsRows} />
      </section>

      <section className="mt-section max-w-3xl">
        <SectionHeading
          title="試合日程"
          action={<SectionLink href="/matches">試合一覧へ →</SectionLink>}
        />
        <HomeFixtures
          matches={allMatches}
          teams={teams}
          currentMatchday={nextFixtureRound}
          initialRound={round}
          clickableMatchIds={clickableMatchIds}
        />
      </section>

      <section className="mt-section">
        <HomeRankings scorers={topScorers} assists={topAssists} xg={topXg} teamById={teamById} />
      </section>
    </div>
  );
}
