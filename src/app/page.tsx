import Link from "next/link";
import {
  getStandings,
  getTopScorers,
  getCurrentMatchday,
  getForm,
  getJapanesePlayers,
  getTeams,
} from "@/lib/data";
import TeamBadge from "@/components/TeamBadge";
import FormPills from "@/components/FormPills";
import SectionHeading from "@/components/SectionHeading";
import StatTile from "@/components/StatTile";
import LeaguePointsChart from "@/components/LeaguePointsChart";
import JapanesePlayersSection from "@/components/JapanesePlayersSection";

export default function Home() {
  const standings = getStandings();
  const topScorers = getTopScorers(5);
  const matchday = getCurrentMatchday();
  const jpPlayers = getJapanesePlayers();
  const teamById = Object.fromEntries(getTeams().map((t) => [t.id, t]));

  const withRecord = standings.filter((t) => t.record);
  const totalGoals = withRecord.reduce((s, t) => s + (t.record?.goalsFor ?? 0), 0);
  const totalMatches = withRecord.reduce((s, t) => s + (t.record?.played ?? 0), 0) / 2;
  const avgGoals = totalMatches ? (totalGoals / totalMatches).toFixed(2) : "0";
  const leader = withRecord[0];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <section className="relative overflow-hidden rounded-2xl border border-border py-14 sm:py-20">
        <div
          className="absolute inset-0 -z-10 opacity-70"
          style={{
            background:
              "radial-gradient(700px 320px at 15% 0%, rgba(57,255,136,0.14), transparent 60%), radial-gradient(700px 320px at 85% 100%, rgba(34,211,238,0.14), transparent 60%)",
          }}
        />
        <div className="px-6 sm:px-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent-2">
            Premier League · Matchday {matchday}
          </p>
          <h1 className="max-w-2xl font-[family-name:var(--font-display)] text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            プレミアリーグを、<br />
            <span className="text-gradient">日本語でもっと身近に。</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            全20クラブの順位・成績と選手データ、そしてプレミアリーグで戦う日本人選手たちの活躍をまとめたデータベースです。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/teams"
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-110"
            >
              チーム一覧を見る
            </Link>
            <Link
              href="/players"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface"
            >
              選手名鑑を見る
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="首位チーム" value={leader?.shortName ?? "-"} hint={leader?.record ? `${leader.record.points}pt` : ""} />
        <StatTile label="総ゴール数" value={totalGoals} hint={`平均 ${avgGoals} 点/試合`} />
        <StatTile label="消化試合数" value={Math.round(totalMatches)} hint={`第${matchday}節時点`} />
        <StatTile label="日本人選手" value={jpPlayers.length} hint="プレミアリーグ在籍" />
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

      <section className="mt-14">
        <SectionHeading
          eyebrow="Standings"
          title="順位表 TOP5"
          action={
            <Link href="/standings" className="text-sm font-medium text-accent-2 hover:underline">
              全順位を見る →
            </Link>
          }
        />
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">チーム</th>
                <th className="px-4 py-3 font-medium text-center">試合</th>
                <th className="px-4 py-3 font-medium text-center">得失点差</th>
                <th className="px-4 py-3 font-medium text-center">勝点</th>
                <th className="px-4 py-3 font-medium">直近5試合</th>
              </tr>
            </thead>
            <tbody>
              {withRecord.slice(0, 5).map((team) => (
                <tr key={team.id} className="border-t border-border transition hover:bg-surface/60">
                  <td className="px-4 py-3 font-[family-name:var(--font-display)] font-bold text-muted">
                    {team.record!.position}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/teams/${team.id}`} className="flex items-center gap-3">
                      <TeamBadge team={team} size={32} />
                      <span className="font-medium text-foreground">{team.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center text-muted">{team.record!.played}</td>
                  <td className="px-4 py-3 text-center text-muted">
                    {team.record!.goalDiff > 0 ? `+${team.record!.goalDiff}` : team.record!.goalDiff}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-foreground">{team.record!.points}</td>
                  <td className="px-4 py-3">
                    <FormPills form={getForm(team.id, 5)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Ranking" title="勝点レース" />
          <div className="glass rounded-xl p-5">
            <LeaguePointsChart
              data={withRecord.map((t) => ({
                name: t.shortName,
                points: t.record!.points,
                zone:
                  t.record!.position <= 4 ? "top" : t.record!.position >= withRecord.length - 2 ? "bottom" : "mid",
              }))}
            />
          </div>
        </div>

        <div>
          <SectionHeading eyebrow="Scorers" title="得点ランキング" />
          <div className="glass divide-y divide-border rounded-xl">
            {topScorers.map((p, i) => {
              const team = teamById[p.teamId];
              return (
                <Link
                  key={p.id}
                  href={`/players/${p.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface/60"
                >
                  <span className="w-5 text-sm font-bold text-muted">{i + 1}</span>
                  {team && <TeamBadge team={team} size={30} />}
                  <div className="flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      {p.isJapanese && "🇯🇵"} {p.name}
                    </p>
                    <p className="text-xs text-muted">{team?.name}</p>
                  </div>
                  <span className="font-[family-name:var(--font-display)] text-xl font-bold text-accent">
                    {p.goals}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
