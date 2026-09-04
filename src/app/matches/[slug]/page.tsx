import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchById, getMatchLineup, getMatchIdsWithLineups, getTeamById, getHeadToHead } from "@/lib/data";
import TeamBadge from "@/components/TeamBadge";
import MatchFormation from "@/components/MatchFormation";
import MatchTimeline from "@/components/MatchTimeline";
import MatchStats from "@/components/MatchStats";
import MatchHeadToHead from "@/components/MatchHeadToHead";
import SectionHeading from "@/components/SectionHeading";
import type { LineupPlayer } from "@/lib/types";

export function generateStaticParams() {
  return getMatchIdsWithLineups().map((id) => ({ slug: String(id) }));
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const matchId = Number(slug);
  const match = getMatchById(matchId);
  const lineup = getMatchLineup(matchId);
  if (!match || !lineup) notFound();

  const homeTeam = getTeamById(match.homeTeamId);
  const awayTeam = getTeamById(match.awayTeamId);
  if (!homeTeam || !awayTeam) notFound();

  const date = new Date(match.utcDate);
  const h2h = getHeadToHead(homeTeam.id, awayTeam.id);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-accent-2">
        Matchday {match.matchday} ·{" "}
        {date.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })}
      </p>

      <div className="mt-4 flex items-center justify-center gap-6 sm:gap-10">
        <Link href={`/teams/${homeTeam.id}`} className="flex flex-col items-center gap-2">
          <TeamBadge team={homeTeam} size={52} />
          <span className="text-sm font-medium text-foreground">{homeTeam.name}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">ホーム</span>
        </Link>
        <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-foreground">
          {match.homeGoals} - {match.awayGoals}
        </span>
        <Link href={`/teams/${awayTeam.id}`} className="flex flex-col items-center gap-2">
          <TeamBadge team={awayTeam} size={52} />
          <span className="text-sm font-medium text-foreground">{awayTeam.name}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">アウェイ</span>
        </Link>
      </div>

      {lineup.statistics && (
        <section className="mt-10">
          <SectionHeading eyebrow="Stats" title="トップ統計" />
          <MatchStats statistics={lineup.statistics} homeTeam={homeTeam} awayTeam={awayTeam} />
        </section>
      )}

      {lineup.events && lineup.events.length > 0 && (
        <section className="mt-10">
          <SectionHeading eyebrow="Timeline" title="タイムライン" />
          <MatchTimeline events={lineup.events} homeTeamId={homeTeam.id} />
        </section>
      )}

      <section className="mt-10">
        <SectionHeading eyebrow="Lineups" title="スタメン・フォーメーション" />
        <MatchFormation lineup={lineup} homeTeam={homeTeam} awayTeam={awayTeam} />
      </section>

      <section className="mt-10 grid gap-8 sm:grid-cols-2">
        <SubstitutesList title={`${awayTeam.shortName} · 控え選手`} players={lineup.awayTeam.substitutes} />
        <SubstitutesList title={`${homeTeam.shortName} · 控え選手`} players={lineup.homeTeam.substitutes} />
      </section>

      {h2h && h2h.numberOfMatches > 0 && (
        <section className="mt-10">
          <SectionHeading eyebrow="History" title="対戦成績" />
          <MatchHeadToHead homeTeam={homeTeam} awayTeam={awayTeam} excludeUtcDate={match.utcDate} />
        </section>
      )}

      <p className="mt-10 text-center text-xs text-muted">Lineup data by Highlightly</p>
    </div>
  );
}

function SubstitutesList({ title, players }: { title: string; players: LineupPlayer[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-muted">{title}</h3>
      <div className="glass divide-y divide-border rounded-xl">
        {players.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className="w-6 text-center text-xs font-bold text-muted">{p.number}</span>
            <span className="flex-1 text-foreground">{p.name}</span>
            <span className="text-xs text-muted">{p.position}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
