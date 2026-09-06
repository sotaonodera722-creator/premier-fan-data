import Link from "next/link";
import {
  getStandings,
  getTopScorers,
  getTopAssists,
  getCurrentMatchday,
  getJapanesePlayers,
  getTeams,
  getAllMatches,
  getActiveRoundMatches,
  getClickableMatchIds,
  getTeamStatAverage,
} from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import StatTile from "@/components/StatTile";
import JapanesePlayersSection from "@/components/JapanesePlayersSection";
import LatestResultsMarquee from "@/components/LatestResultsMarquee";
import HomeStandingsTable from "@/components/HomeStandingsTable";
import HomeFixtures from "@/components/HomeFixtures";
import PlayerRankingList from "@/components/PlayerRankingList";
import TeamStatCard from "@/components/TeamStatCard";

export default function Home() {
  const standings = getStandings();
  const matchday = getCurrentMatchday();
  const jpPlayers = getJapanesePlayers();
  const teams = getTeams();
  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const allMatches = getAllMatches();
  const latestResults = getActiveRoundMatches();
  const latestMatchday = latestResults[0]?.matchday ?? matchday;
  const clickableMatchIds = new Set(getClickableMatchIds());

  const topScorers = getTopScorers(3).map((p) => ({ player: p, value: p.goals ?? 0 }));
  const topAssists = getTopAssists(3).map((p) => ({ player: p, value: p.assists ?? 0 }));
  const topXg = getTeamStatAverage("Expected Goals", 3).map((r, i) => ({ ...r, rank: i + 1 }));

  const withRecord = standings.filter((t) => t.record);
  const totalGoals = withRecord.reduce((s, t) => s + (t.record?.goalsFor ?? 0), 0);
  const totalMatches = withRecord.reduce((s, t) => s + (t.record?.played ?? 0), 0) / 2;
  const avgGoals = totalMatches ? (totalGoals / totalMatches).toFixed(2) : "0";
  const leader = withRecord[0];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <section className="border-b border-border pb-8 pt-8 sm:pt-12">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-accent-2" />
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-accent-2">
            Matchday {matchday}
          </span>
        </div>
        <h1 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl">
          プレミアリーグを、
          <br />
          <span className="text-accent">日本語でもっと身近に。</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          全20クラブの順位・成績と選手データ、そしてプレミアリーグで戦う日本人選手たちの活躍をまとめたデータベースです。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/teams"
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-110"
          >
            チーム一覧を見る
          </Link>
          <Link
            href="/players"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface"
          >
            選手名鑑を見る
          </Link>
        </div>

        <LatestResultsMarquee
          matches={latestResults}
          teamById={teamById}
          matchday={latestMatchday}
          clickableMatchIds={clickableMatchIds}
        />
      </section>

      <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="首位チーム" value={leader?.shortName ?? "-"} hint={leader?.record ? `${leader.record.points}pt` : ""} />
        <StatTile label="総ゴール数" value={totalGoals} hint={`平均 ${avgGoals} 点/試合`} />
        <StatTile label="消化試合数" value={Math.round(totalMatches)} hint={`第${matchday}節時点`} />
        <StatTile label="日本人選手" value={jpPlayers.length} hint="プレミアリーグ在籍" />
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Standings"
            title="順位表"
            action={
              <Link href="/standings" className="text-sm font-medium text-accent-2 hover:underline">
                全順位を見る →
              </Link>
            }
          />
          <HomeStandingsTable standings={standings} />
        </div>
        <div>
          <SectionHeading
            eyebrow="Fixtures"
            title="ラウンド別試合日程"
            action={
              <Link href="/matches" className="text-sm font-medium text-accent-2 hover:underline">
                試合一覧へ →
              </Link>
            }
          />
          <HomeFixtures matches={allMatches} teams={teams} currentMatchday={matchday} />
          <div className="mt-8">
            <TeamStatCard
              eyebrow="Expected Goals"
              title="平均期待得点 (xG) TOP3"
              rows={topXg}
              format={(v) => v.toFixed(2)}
              tab="xg"
              size="lg"
            />
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-8 sm:grid-cols-2">
        <PlayerRankingList
          eyebrow="Scorers"
          title="得点ランキング TOP3"
          entries={topScorers}
          teamById={teamById}
          emptyLabel="得点"
          moreHref="/players/rankings?tab=goals"
        />
        <PlayerRankingList
          eyebrow="Assists"
          title="アシストランキング TOP3"
          entries={topAssists}
          teamById={teamById}
          emptyLabel="アシスト"
          moreHref="/players/rankings?tab=assists"
        />
      </section>

      <section className="mt-14">
        <SectionHeading
          eyebrow="🇯🇵 Japanese Players"
          title="日本人選手フォーカス"
          action={
            <Link href="/players" className="text-sm font-medium text-accent-2 hover:underline">
              選手名鑑へ →
            </Link>
          }
        />
        <JapanesePlayersSection players={jpPlayers} teamById={teamById} />
      </section>
    </div>
  );
}
