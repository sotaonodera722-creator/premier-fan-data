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
} from "@/lib/data";
import { getTeamColor } from "@/lib/teamColors";
import TeamBadge from "@/components/TeamBadge";
import StatTile from "@/components/StatTile";
import WinLossBar from "@/components/WinLossBar";
import FormPills from "@/components/FormPills";
import SectionHeading from "@/components/SectionHeading";
import type { Position } from "@/lib/types";

export function generateStaticParams() {
  return getTeams().map((t) => ({ slug: String(t.id) }));
}

const POSITION_ORDER: Position[] = ["GK", "DF", "MF", "FW"];
const POSITION_NAMES: Record<Position, string> = {
  GK: "ゴールキーパー",
  DF: "ディフェンダー",
  MF: "ミッドフィルダー",
  FW: "フォワード",
};

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {team.name}
            </h1>
            {jpPlayers.length > 0 && (
              <p className="mt-2 inline-flex items-center gap-1.5 border border-accent-2/50 px-3 py-1 text-xs font-medium text-accent-2">
                🇯🇵 日本人選手 {jpPlayers.length}名在籍
              </p>
            )}
          </div>
          <Link
            href={`/compare?a=${team.id}`}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface"
          >
            対戦成績を比較 →
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {r && (
          <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="勝点" value={r.points} hint={`${r.played}試合`} />
            <StatTile
              label="得失点差"
              value={r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
              hint={`${r.goalsFor}得点 / ${r.goalsAgainst}失点`}
            />
            <StatTile label="勝率" value={`${r.winRate}%`} hint={`${r.wins}勝`} />
            <StatTile label="順位" value={r.position} hint="プレミアリーグ" />
          </section>
        )}

        <section className="mt-12 grid gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Club Info" title="クラブ情報" />
            <div className="glass space-y-3 rounded-xl p-5 text-sm">
              {team.venue && <Row label="スタジアム" value={team.venue} />}
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
                    className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface/60"
                  >
                    <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-bold text-muted">
                      {p.position}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
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

        <section className="mt-12 grid gap-8 lg:grid-cols-2">
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
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-9 text-xs text-muted">第{m.matchday}節</span>
                    <span className="w-8 text-xs text-muted">{isHome ? "H" : "A"}</span>
                    {opponent && <TeamBadge team={opponent} size={26} />}
                    <Link
                      href={opponent ? `/teams/${opponent.id}` : "#"}
                      className="flex-1 truncate text-sm text-foreground hover:underline"
                    >
                      {opponent?.name}
                    </Link>
                    <span className="font-[family-name:var(--font-display)] text-sm font-bold text-foreground">
                      {gf} - {ga}
                    </span>
                    <FormPills form={[result]} />
                    {hasLineup && (
                      <Link
                        href={`/matches/${m.id}`}
                        className="rounded-md border border-border px-2 py-1 text-[10px] font-medium text-accent-2 transition hover:bg-surface"
                      >
                        スタメン
                      </Link>
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
                const date = new Date(m.utcDate);
                return (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-9 text-xs text-muted">第{m.matchday}節</span>
                    <span className="w-8 text-xs text-muted">{isHome ? "H" : "A"}</span>
                    {opponent && <TeamBadge team={opponent} size={26} />}
                    <Link
                      href={opponent ? `/teams/${opponent.id}` : "#"}
                      className="flex-1 truncate text-sm text-foreground hover:underline"
                    >
                      {opponent?.name}
                    </Link>
                    <span className="text-xs text-muted">
                      {date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-12">
          <SectionHeading eyebrow="Squad" title="スカッド一覧" />
          <div className="space-y-8">
            {POSITION_ORDER.map((pos) => {
              const group = roster.filter((p) => p.position === pos);
              if (!group.length) return null;
              return (
                <div key={pos}>
                  <h3 className="mb-3 text-sm font-semibold text-muted">
                    {POSITION_NAMES[pos]} <span className="text-xs">({group.length})</span>
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
                          <tr key={p.id} className="border-t border-border transition hover:bg-surface/60">
                            <td className="px-4 py-2.5">
                              <Link
                                href={`/players/${p.id}`}
                                className="flex items-center gap-1.5 font-medium text-foreground hover:text-accent-2"
                              >
                                {p.isJapanese && <span title="日本人選手">🇯🇵</span>}
                                {p.name}
                              </Link>
                            </td>
                            <td className="px-4 py-2.5 text-muted">{p.nationality}</td>
                            <td className="px-4 py-2.5 text-center text-muted">{p.age ?? "-"}</td>
                            <td className="px-4 py-2.5 text-center text-muted">{p.appearances ?? "-"}</td>
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
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
