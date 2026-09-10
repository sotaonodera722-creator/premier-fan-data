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
import PlayerRankingList from "@/components/PlayerRankingList";
import TeamStatCard from "@/components/TeamStatCard";
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
    <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      {/*
        The page opens on where the round stands rather than on a headline. A
        reader arriving on a Sunday morning in Japan is mid-round — some of it
        played overnight, some still to come tonight — and that fact is the
        whole reason this site exists, so it goes above everything else.
      */}
      <section className="border-b border-border pb-7 pt-2 sm:pt-10">
        <RoundStatus />

        <RoundSummaryLede />

        <div className="mt-2 sm:mt-4">
          <WeekendBoard
            matches={results.matches}
            teamById={teamById}
            clickableMatchIds={clickableMatchIds}
          />
        </div>

        <div className="mt-7">
          <WeekendTiles />
        </div>
        <SampleSizeNote derived />
      </section>

      <section className="mt-12">
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

      <section className="mt-14 grid items-start gap-8 lg:grid-cols-2">
        <div className="min-w-0">
          <SectionHeading
            title="順位表"
            action={<SectionLink href="/standings">全順位を見る →</SectionLink>}
          />
          <MovementLegend className="mb-inline" />
          <HomeStandingsTable rows={standingsRows} />
        </div>
        <div className="min-w-0">
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
        </div>
      </section>

      <section className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <PlayerRankingList
          title="得点ランキング TOP3"
          entries={topScorers}
          teamById={teamById}
          emptyLabel="得点"
          moreHref="/players/rankings?tab=goals"
        />
        <PlayerRankingList
          title="アシストランキング TOP3"
          entries={topAssists}
          teamById={teamById}
          emptyLabel="アシスト"
          moreHref="/players/rankings?tab=assists"
        />
        <TeamStatCard
          title="平均期待得点 (xG) TOP3"
          term="xg"
          rows={topXg}
          format={(v) => v.toFixed(2)}
          tab="xg"
          size="lg"
        />
      </section>
    </div>
  );
}
