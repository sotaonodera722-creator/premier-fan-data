import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTeamById,
  getTeams,
  getPlayersByTeam,
  getRecentResults,
  getUpcomingFixtures,
  getForm,
  getMatchLineup,
  getPlayerAppearances,
  getStandingsTable,
  getSeasonMovement,
} from "@/lib/data";
import { getTeamColor } from "@/lib/teamColors";
import { jstShortDate, jstTime, lateNightTag } from "@/lib/datetime";
import { getTeamNameJa, teamNameShort } from "@/lib/teamNamesJa";
import { getClubProfile } from "@/lib/clubProfiles";
import { getNationalityJa } from "@/lib/nationalitiesJa";
import { POSITION_NAMES_JA, getPositionJa } from "@/lib/positionsJa";
import TeamBadge from "@/components/TeamBadge";
import StatTile from "@/components/StatTile";
import WinLossBar from "@/components/WinLossBar";
import FormPills from "@/components/FormPills";
import SectionHeading from "@/components/SectionHeading";
import KeyTeamStats from "@/components/KeyTeamStats";
import TeamTabs from "@/components/TeamTabs";
import ClubRivalries from "@/components/ClubRivalries";
import TeamStyleSection from "@/components/TeamStyleSection";
import ClubBadges from "@/components/ClubBadges";
import DataNote from "@/components/DataNote";
import type { Position } from "@/lib/types";

export function generateStaticParams() {
  return getTeams().map((t) => ({ slug: String(t.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const team = getTeamById(Number(slug));
  if (!team) return { title: "チーム | Premier Fan Data" };

  const nameJa = getTeamNameJa(team.id);
  const profile = getClubProfile(team.id);
  const rank = team.record ? `プレミアリーグ${team.record.position}位・勝点${team.record.points}。` : "";
  const where = profile ? `${profile.city}のクラブ。` : "";
  return {
    title: `${nameJa?.short ?? team.shortName} | Premier Fan Data`,
    description: `${nameJa?.full ?? team.name} の${rank}${where}所属選手・直近の試合結果・今後の日程・チームスタッツをまとめています。`,
  };
}


const POSITION_ORDER: Position[] = ["GK", "DF", "MF", "FW"];


export default async function TeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const teamId = Number(slug);
  const team = getTeamById(teamId);
  if (!team) notFound();

  const roster = getPlayersByTeam(team.id);
  const recent = getRecentResults(team.id, 5);
  const upcoming = getUpcomingFixtures(team.id, 5);
  const form = getForm(team.id, 5);
  const jpPlayers = roster.filter((p) => p.isJapanese);
  const r = team.record;
  const teamColor = getTeamColor(team.id);
  const nameJa = getTeamNameJa(team.id);
  const profile = getClubProfile(team.id);
  const movement = getSeasonMovement(team.id);
  // The tile said "プレミアリーグ", which the reader already knows from the page
  // they are on. Last season's finish is the one figure that makes this one mean
  // something, so it takes the slot.
  const seasonHint =
    movement.kind === "promoted" && movement.last
      ? `昨季は2部${movement.last.position}位`
      : movement.last
        ? `昨季 ${movement.last.position}位`
        : "プレミアリーグ";
  const inRelegationZone =
    getStandingsTable().find((row) => row.team.id === team.id)?.provisionalZone === "relegation";
  const appearancesByPlayer = new Map(
    roster.map((p) => {
      const apps = getPlayerAppearances(p.id);
      return [p.id, { starts: apps.filter((a) => a.status === "start").length, subs: apps.filter((a) => a.status === "bench").length }] as const;
    })
  );

  return (
    <div className="pb-20">
      <div className="h-1" style={{ backgroundColor: teamColor }} />
      <div className="border-b border-border bg-background-alt py-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-4 sm:px-6">
          <div
            className="flex shrink-0 items-center justify-center rounded-full border p-3"
            style={{ borderColor: `${teamColor}55` }}
          >
            <TeamBadge team={team} size={72} />
          </div>
          <div className="flex-1">
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: teamColor }}
            >
              {r ? `第${r.position}位` : "プレミアリーグ"}
            </p>
            {/* 30px x 8 full-width characters is 240px, and the 72px crest beside
                it leaves 221px — 「ブレントフォード」, the longest club name we
                carry, broke across two lines. It steps down a size until sm. */}
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              {nameJa?.full ?? team.name}
            </h1>
            {/* The crest and every other page still carry the English name, so keep it
                visible here — otherwise this page is the only place the two don't match. */}
            {nameJa && <p className="mt-1 text-sm text-muted">{team.name}</p>}
            <ClubBadges profile={profile} inRelegationZone={inRelegationZone} className="mt-2.5" />
            {jpPlayers.length > 0 && (
              <p className="mt-2.5 inline-flex items-center border border-accent-2/50 px-3 py-1 text-xs font-medium text-accent-2">
                日本人選手 {jpPlayers.length}名在籍
              </p>
            )}
          </div>
          <Link
            href={`/compare?a=${team.id}`}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            対戦成績を比較 →
          </Link>
        </div>
      </div>

      <TeamTabs
        initialTab={tab}
        overview={
          <>
            {profile && (
              // Before any number on this page means anything, a reader has to
              // know who they are looking at. That goes first.
              <section className="mt-8">
                <SectionHeading eyebrow="Identity" title="このクラブは何者か" />
                <div className="glass rounded-xl p-5">
                  <p className="text-sm leading-relaxed text-foreground">{profile.identity}</p>
                  <dl className="mt-4 grid gap-x-6 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-[11px] text-muted">本拠地</dt>
                      <dd className="mt-0.5 text-foreground">{profile.city}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted">スタジアム</dt>
                      <dd className="mt-0.5 text-foreground">
                        {profile.venueJa}
                        <span className="block text-[11px] text-muted">{profile.venueEn}</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted">創設</dt>
                      <dd className="mt-0.5 tabular-nums text-foreground">
                        {team.founded ? `${team.founded}年` : "不明"}
                      </dd>
                    </div>
                    {movement.last && (
                      // Where they finished in May. A club identity that stops at
                      // the founding year leaves out the only part of it a reader
                      // can check against this season.
                      <div>
                        <dt className="text-[11px] text-muted">昨季</dt>
                        <dd className="mt-0.5 tabular-nums text-foreground">
                          {movement.last.tier === 1 ? "" : "2部 "}
                          {movement.last.position}位
                          <span className="block text-[11px] text-muted">
                            {movement.last.played}試合・勝点{movement.last.points}
                          </span>
                        </dd>
                      </div>
                    )}
                  </dl>
                  <DataNote>
                    クラブの歴史・本拠地・スタジアムは Wikipedia を参考にしています。
                  </DataNote>
                </div>
              </section>
            )}

            {r && (
              <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="勝点" value={r.points} hint={`${r.played}試合`} />
                <StatTile
                  label="得失点差"
                  value={r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
                  hint={`${r.goalsFor}得点 / ${r.goalsAgainst}失点`}
                />
                <StatTile label="勝率" value={`${r.winRate}%`} hint={`${r.wins}勝`} />
                <StatTile label="順位" value={r.position} hint={seasonHint} />
              </section>
            )}

            <TeamStyleSection teamId={team.id} />

            <ClubRivalries club={team} />

            <section className="mt-12 grid gap-8 pb-12 lg:grid-cols-2">
              <div>
                <SectionHeading eyebrow="Club Info" title="クラブ情報" />
                <div className="glass space-y-3 rounded-xl p-5 text-sm">
                  {profile ? (
                    <>
                      <Row label="本拠地" value={profile.city} />
                      <Row label="スタジアム" value={profile.venueJa} />
                    </>
                  ) : (
                    team.venue && <Row label="スタジアム" value={team.venue} />
                  )}
                  {team.founded && <Row label="創設年" value={`${team.founded}年`} />}
                  {team.coach && <Row label="監督" value={team.coach} />}
                  {team.clubColors && <Row label="クラブカラー" value={team.clubColors} />}
                  {r && (
                    <div className="border-t border-border pt-3">
                      <p className="mb-1.5 text-xs text-muted">勝敗内訳</p>
                      <WinLossBar wins={r.wins} draws={r.draws} losses={r.losses} />
                      <div className="mt-1.5 flex justify-between text-xs text-muted">
                        <span>{r.wins}勝</span>
                        <span>{r.draws}分</span>
                        <span>{r.losses}敗</span>
                      </div>
                    </div>
                  )}
                  <div className="border-t border-border pt-3">
                    <p className="mb-1.5 text-xs text-muted">直近5試合</p>
                    <FormPills form={form} />
                  </div>
                </div>
              </div>

              {jpPlayers.length > 0 && (
                <div>
                  <SectionHeading eyebrow="Japanese Players" title="日本人選手" />
                  <div className="glass divide-y divide-border rounded-xl">
                    {jpPlayers.map((p) => (
                      <Link
                        key={p.id}
                        href={`/players/${p.id}`}
                        className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-2"
                      >
                        <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-bold text-muted" title={getPositionJa(p.position)}>
                          {p.position}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{p.nameJa ?? p.name}</p>
                          <p className="text-xs text-muted">{p.age ? `${p.age}歳` : ""}</p>
                        </div>
                        {p.goals !== null && (
                          <span className="text-xs text-muted">
                            {p.goals}G {p.assists ?? 0}A
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        }
        matches={
          <section className="mt-8 grid gap-8 pb-12 lg:grid-cols-2">
            <div>
              <SectionHeading eyebrow="Results" title="直近の試合結果" />
              <div className="glass divide-y divide-border rounded-xl">
                {recent.length === 0 && <p className="p-4 text-sm text-muted">試合結果はまだありません。</p>}
                {recent.map((m) => {
                  const isHome = m.homeTeamId === team.id;
                  const oppId = isHome ? m.awayTeamId : m.homeTeamId;
                  const opponent = getTeamById(oppId);
                  const gf = isHome ? m.homeGoals! : m.awayGoals!;
                  const ga = isHome ? m.awayGoals! : m.homeGoals!;
                  const result = gf > ga ? "W" : gf < ga ? "L" : "D";
                  const hasLineup = Boolean(getMatchLineup(m.id));
                  return (
                    <div
                      key={m.id}
                      className={`relative flex items-center gap-3 px-4 py-3 ${hasLineup ? "transition hover:bg-surface-2" : ""}`}
                    >
                      {hasLineup && (
                        <Link href={`/matches/${m.id}`} className="absolute inset-0" aria-label="試合詳細を見る" />
                      )}
                      <span className="w-9 text-xs text-muted">第{m.matchday}節</span>
                      <span className="w-8 text-xs text-muted">{isHome ? "H" : "A"}</span>
                      {opponent && <TeamBadge team={opponent} size={26} />}
                      <Link
                        href={opponent ? `/teams/${opponent.id}` : "#"}
                        className="relative flex-1 truncate text-sm text-foreground hover:underline"
                      >
                        {opponent && teamNameShort(opponent)}
                      </Link>
                      <span className="font-[family-name:var(--font-display)] text-sm font-bold text-foreground">
                        {gf} - {ga}
                      </span>
                      <FormPills form={[result]} />
                      {hasLineup && (
                        <span className="rounded-md border border-border px-2 py-1 text-[10px] font-medium text-accent-2">
                          スタメン
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <SectionHeading eyebrow="Fixtures" title="今後の試合予定" />
              <div className="glass divide-y divide-border rounded-xl">
                {upcoming.length === 0 && <p className="p-4 text-sm text-muted">予定されている試合はありません。</p>}
                {upcoming.map((m) => {
                  const isHome = m.homeTeamId === team.id;
                  const oppId = isHome ? m.awayTeamId : m.homeTeamId;
                  const opponent = getTeamById(oppId);
                  const lateNight = lateNightTag(m.utcDate);
                  return (
                    <div key={m.id} className="relative flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2">
                      <Link href={`/matches/${m.id}`} className="absolute inset-0" aria-label="試合詳細を見る" />
                      <span className="w-9 text-xs text-muted">第{m.matchday}節</span>
                      <span className="w-8 text-xs text-muted">{isHome ? "H" : "A"}</span>
                      {opponent && <TeamBadge team={opponent} size={26} />}
                      <Link
                        href={opponent ? `/teams/${opponent.id}` : "#"}
                        className="relative flex-1 truncate text-sm text-foreground hover:underline"
                      >
                        {opponent && teamNameShort(opponent)}
                      </Link>
                      <span className="shrink-0 text-right text-xs leading-tight text-muted">
                        <span className="block tabular-nums">{jstShortDate(m.utcDate)}</span>
                        <span className="block tabular-nums text-foreground">{jstTime(m.utcDate)}</span>
                        {lateNight && <span className="block text-[10px]">{lateNight}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        }
        stats={
          <section className="mt-8 pb-12">
            <SectionHeading eyebrow="Key Stats" title="重要な統計" />
            <KeyTeamStats teamId={team.id} />
          </section>
        }
        squad={
          <section className="mt-8 pb-12">
            <SectionHeading eyebrow="Squad" title="スカッド一覧" />
            <div className="space-y-8">
              {POSITION_ORDER.map((pos) => {
                const group = roster.filter((p) => p.position === pos);
                if (!group.length) return null;
                return (
                  <div key={pos}>
                    <h3 className="mb-3 text-sm font-semibold text-muted">
                      {POSITION_NAMES_JA[pos]} <span className="text-xs">({group.length})</span>
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full min-w-[520px] text-sm">
                        <thead>
                          <tr className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
                            <th className="px-4 py-2.5 font-medium">選手名</th>
                            <th className="px-4 py-2.5 font-medium">国籍</th>
                            <th className="px-4 py-2.5 font-medium text-center">年齢</th>
                            <th className="px-4 py-2.5 font-medium text-center">出場</th>
                            <th className="px-4 py-2.5 font-medium text-center">G</th>
                            <th className="px-4 py-2.5 font-medium text-center">A</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.map((p) => (
                            <tr key={p.id} className="border-t border-border transition hover:bg-surface-2">
                              <td className="px-4 py-2.5">
                                <Link
                                  href={`/players/${p.id}`}
                                  className="flex items-center gap-1.5 font-medium text-foreground hover:text-accent-2"
                                >
                                  {p.isJapanese && <span title="日本人選手">🇯🇵</span>}
                                  {p.nameJa ?? p.name}
                                </Link>
                              </td>
                              <td className="px-4 py-2.5 text-muted">{getNationalityJa(p.nationality)}</td>
                              <td className="px-4 py-2.5 text-center text-muted">{p.age ?? "-"}</td>
                              <td className="px-4 py-2.5 text-center text-muted">
                                {formatAppearances(appearancesByPlayer.get(p.id))}
                              </td>
                              <td className="px-4 py-2.5 text-center text-foreground">{p.goals ?? "-"}</td>
                              <td className="px-4 py-2.5 text-center text-foreground">{p.assists ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        }
      />
    </div>
  );
}

// "先発数(途中出場数)" — the standard football-stats convention (Premier League
// official site, Transfermarkt, etc). The sub count is omitted when it's zero.
function formatAppearances(split: { starts: number; subs: number } | undefined): string {
  if (!split) return "0";
  return split.subs > 0 ? `${split.starts}(${split.subs})` : String(split.starts);
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
