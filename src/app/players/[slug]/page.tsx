import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayerById, getPlayers, getTeamById, getPlayersByTeam, getPlayerAppearances } from "@/lib/data";
import TeamBadge from "@/components/TeamBadge";
import StatTile from "@/components/StatTile";
import SectionHeading from "@/components/SectionHeading";

export function generateStaticParams() {
  return getPlayers().map((p) => ({ slug: String(p.id) }));
}

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const player = getPlayerById(Number(slug));
  if (!player) notFound();

  const team = getTeamById(player.teamId);
  const teammates = team
    ? getPlayersByTeam(team.id).filter((p) => p.id !== player.id).slice(0, 6)
    : [];
  const appearances = getPlayerAppearances(player.id);
  const starts = appearances.filter((a) => a.status === "start").length;
  const subApps = appearances.filter((a) => a.status === "bench").length;

  return (
    <div className="pb-20">
      <div className="border-b border-border bg-background-alt py-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-4 sm:px-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface font-[family-name:var(--font-display)] text-3xl font-bold text-muted">
            {player.position}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-2">
              {player.position}
              {player.isJapanese && <span className="ml-2">🇯🇵 日本人選手</span>}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {player.name}
            </h1>
            {team && (
              <Link
                href={`/teams/${team.id}`}
                className="mt-2 inline-flex items-center gap-2 text-sm text-muted hover:text-accent-2"
              >
                <TeamBadge team={team} size={22} />
                {team.name}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="国籍" value={player.nationality} />
          <StatTile label="年齢" value={player.age ? `${player.age}歳` : "-"} />
          <StatTile label="ゴール" value={player.goals ?? "-"} />
          <StatTile label="アシスト" value={player.assists ?? "-"} />
        </section>
        {player.goals === null && (
          <p className="mt-3 text-xs text-muted">
            ※ ラインナップ取得が済んでいる試合にまだ出場していないため、ゴール・アシストのデータがありません。
          </p>
        )}

        <section className="mt-12 grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SectionHeading eyebrow="Profile" title="プロフィール" />
            <div className="glass space-y-3 rounded-xl p-5 text-sm">
              <Row label="国籍" value={player.nationality} />
              <Row label="ポジション" value={player.position} />
              <Row label="生年月日" value={player.dateOfBirth} />
              <Row label="年齢" value={player.age ? `${player.age}歳` : "-"} />
              {appearances.length > 0 && (
                <Row label="出場試合" value={subApps > 0 ? `${starts}(${subApps})` : starts} />
              )}
              <Row label="所属クラブ" value={team?.name ?? "-"} />
            </div>
          </div>
        </section>

        {appearances.length > 0 && (
          <section className="mt-12">
            <SectionHeading eyebrow="Appearances" title="出場記録" />
            <div className="glass divide-y divide-border rounded-xl">
              {appearances.map((a) => {
                const opponent = getTeamById(a.opponentId);
                const gf = a.isHome ? a.homeGoals : a.awayGoals;
                const ga = a.isHome ? a.awayGoals : a.homeGoals;
                return (
                  <Link
                    key={a.matchId}
                    href={`/matches/${a.matchId}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-surface-2"
                  >
                    <span className="w-9 shrink-0 text-xs text-muted">第{a.matchday}節</span>
                    <span className="w-8 shrink-0 text-xs text-muted">{a.isHome ? "H" : "A"}</span>
                    {opponent && <TeamBadge team={opponent} size={24} />}
                    <span className="flex-1 truncate text-foreground">{opponent?.name}</span>
                    <span className="font-[family-name:var(--font-display)] font-bold text-foreground">
                      {gf} - {ga}
                    </span>
                    <span
                      className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
                        a.status === "start"
                          ? "bg-accent/10 text-accent"
                          : "bg-surface-2 text-muted"
                      }`}
                    >
                      {a.status === "start" ? "先発" : "途中出場"}
                    </span>
                  </Link>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted">
              ラインナップ取得が済んでいる試合のみの記録です(全試合を網羅しているとは限りません)。
            </p>
          </section>
        )}

        {team && teammates.length > 0 && (
          <section className="mt-12">
            <SectionHeading eyebrow="Squad" title={`${team.shortName}の他の選手`} />
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
              {teammates.map((p) => (
                <Link
                  key={p.id}
                  href={`/players/${p.id}`}
                  className="glass flex flex-col items-center gap-2 rounded-xl px-3 py-4 text-center transition hover:-translate-y-0.5 hover:border-accent/40"
                >
                  <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-bold text-muted">
                    {p.position}
                  </span>
                  <p className="truncate text-xs font-medium text-foreground">
                    {p.isJapanese && "🇯🇵 "}
                    {p.name}
                  </p>
                  <p className="text-[10px] text-muted">{p.age ? `${p.age}歳` : ""}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
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
