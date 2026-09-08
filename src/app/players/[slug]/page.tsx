import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayerById, getPlayers, getTeamById, getPlayersByTeam, getPlayerAppearances } from "@/lib/data";
import PlayerUsageSection from "@/components/PlayerUsageSection";
import TeamBadge from "@/components/TeamBadge";
import StatTile from "@/components/StatTile";
import SectionHeading from "@/components/SectionHeading";
import DataNote from "@/components/DataNote";
import { getNationalityJa } from "@/lib/nationalitiesJa";
import { getPositionJa } from "@/lib/positionsJa";
import { teamNameShort, teamNameFull } from "@/lib/teamNamesJa";

export function generateStaticParams() {
  return getPlayers().map((p) => ({ slug: String(p.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const player = getPlayerById(Number(slug));
  if (!player) return { title: "選手 | Premier Fan Data" };

  const team = getTeamById(player.teamId);
  const where = team ? `${teamNameFull(team)}所属の` : "";
  return {
    title: `${player.nameJa ?? player.name} | Premier Fan Data`,
    description: `${where}${player.nameJa ?? player.name}（${getPositionJa(player.position)}）のプロフィールと今季成績。出場記録・ゴール・アシストをまとめています。`,
  };
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
              {player.nameJa ?? player.name}
            </h1>
            {team && (
              <Link
                href={`/teams/${team.id}`}
                className="mt-2 inline-flex items-center gap-2 text-sm text-muted hover:text-accent-2"
              >
                <TeamBadge team={team} size={22} />
                {teamNameFull(team)}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="国籍" value={getNationalityJa(player.nationality)} />
          <StatTile label="年齢" value={player.age ? `${player.age}歳` : "-"} />
          <StatTile label="ゴール" value={player.goals ?? "-"} />
          <StatTile label="アシスト" value={player.assists ?? "-"} />
        </section>
        {player.goals === null ? (
          <DataNote>
            ラインナップを取得済みの試合にまだ出場していないため、ゴール・アシストのデータがありません。
          </DataNote>
        ) : (
          <DataNote>
            ゴールとアシストは試合イベントから算出した値です。公式発表と一致しない場合があります。
          </DataNote>
        )}

        <section className="mt-12 grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SectionHeading eyebrow="Profile" title="プロフィール" />
            <div className="glass space-y-3 rounded-xl p-5 text-sm">
              <Row label="国籍" value={getNationalityJa(player.nationality)} />
              <Row label="ポジション" value={getPositionJa(player.position)} />
              <Row label="生年月日" value={player.dateOfBirth} />
              <Row label="年齢" value={player.age ? `${player.age}歳` : "-"} />
              {appearances.length > 0 && (
                <Row label="出場試合" value={subApps > 0 ? `${starts}(${subApps})` : starts} />
              )}
              <Row label="所属クラブ" value={team ? teamNameFull(team) : "-"} />
            </div>
          </div>
        </section>

        {/* "Did he play?" the round list answers. "Is he a regular?" is the
            question straight after it, and until now the page had no answer at
            all — so the old flat list of appearances is folded into it. */}
        <PlayerUsageSection player={player} />

        {team && teammates.length > 0 && (
          <section className="mt-12">
            <SectionHeading eyebrow="Squad" title={`${teamNameShort(team)}の他の選手`} />
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
              {teammates.map((p) => (
                <Link
                  key={p.id}
                  href={`/players/${p.id}`}
                  className="glass flex flex-col items-center gap-2 rounded-xl px-3 py-4 text-center transition hover:-translate-y-0.5 hover:border-accent/40"
                >
                  <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-bold text-muted" title={getPositionJa(p.position)}>
                    {p.position}
                  </span>
                  <p className="truncate text-xs font-medium text-foreground">
                    {p.isJapanese && "🇯🇵 "}
                    {p.nameJa ?? p.name}
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
