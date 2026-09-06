import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMatchById,
  getMatchLineup,
  getClickableMatchIds,
  getTeamById,
  getHeadToHead,
  getPredictedLineup,
  resolveRosterPlayer,
} from "@/lib/data";
import TeamBadge from "@/components/TeamBadge";
import MatchFormation from "@/components/MatchFormation";
import MatchTimeline from "@/components/MatchTimeline";
import MatchStats from "@/components/MatchStats";
import MatchHeadToHead from "@/components/MatchHeadToHead";
import SectionHeading from "@/components/SectionHeading";
import type { LineupPlayer, MatchLineup } from "@/lib/types";

export function generateStaticParams() {
  return getClickableMatchIds().map((id) => ({ slug: String(id) }));
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const matchId = Number(slug);
  const match = getMatchById(matchId);
  if (!match) notFound();

  const homeTeam = getTeamById(match.homeTeamId);
  const awayTeam = getTeamById(match.awayTeamId);
  if (!homeTeam || !awayTeam) notFound();

  const lineup = getMatchLineup(matchId);
  // A finished match with no lineup data is a genuine gap, not a future fixture.
  if (!lineup && match.played) notFound();

  const date = new Date(match.utcDate);
  const h2h = getHeadToHead(homeTeam.id, awayTeam.id);

  const predictedHome = !lineup ? getPredictedLineup(homeTeam.id, matchId) : undefined;
  const predictedAway = !lineup ? getPredictedLineup(awayTeam.id, matchId) : undefined;
  const predictedLineup: MatchLineup | null =
    predictedHome && predictedAway
      ? { matchId: match.id, homeTeam: predictedHome.teamLineup, awayTeam: predictedAway.teamLineup }
      : null;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-accent-2">
        Matchday {match.matchday} ·{" "}
        {date.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Tokyo" })}
      </p>

      <div className="mt-4 flex items-center justify-center gap-6 sm:gap-10">
        <Link href={`/teams/${homeTeam.id}`} className="group flex flex-col items-center gap-2">
          <TeamBadge team={homeTeam} size={52} />
          <span className="text-sm font-medium text-foreground transition group-hover:text-accent-2">{homeTeam.name}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">ホーム</span>
        </Link>
        {match.played ? (
          <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-foreground">
            {match.homeGoals} - {match.awayGoals}
          </span>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-muted">vs</span>
            <span className="text-xs font-medium text-muted">
              {date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })}
            </span>
          </div>
        )}
        <Link href={`/teams/${awayTeam.id}`} className="group flex flex-col items-center gap-2">
          <TeamBadge team={awayTeam} size={52} />
          <span className="text-sm font-medium text-foreground transition group-hover:text-accent-2">{awayTeam.name}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">アウェイ</span>
        </Link>
      </div>

      {lineup?.statistics && (
        <section className="mt-10">
          <SectionHeading eyebrow="Stats" title="トップ統計" />
          <MatchStats statistics={lineup.statistics} homeTeam={homeTeam} awayTeam={awayTeam} />
        </section>
      )}

      {lineup?.events && lineup.events.length > 0 && (
        <section className="mt-10">
          <SectionHeading eyebrow="Timeline" title="タイムライン" />
          <MatchTimeline events={lineup.events} homeTeamId={homeTeam.id} awayTeamId={awayTeam.id} />
        </section>
      )}

      {lineup && (
        <>
          <section className="mt-10">
            <SectionHeading eyebrow="Lineups" title="スタメン・フォーメーション" />
            <MatchFormation lineup={lineup} homeTeam={homeTeam} awayTeam={awayTeam} />
          </section>

          <section className="mt-10 grid gap-8 sm:grid-cols-2">
            <SubstitutesList title={`${awayTeam.shortName} · 控え選手`} players={lineup.awayTeam.substitutes} teamId={awayTeam.id} />
            <SubstitutesList title={`${homeTeam.shortName} · 控え選手`} players={lineup.homeTeam.substitutes} teamId={homeTeam.id} />
          </section>
        </>
      )}

      {!lineup && predictedLineup && predictedHome && predictedAway && (
        <>
          <section className="mt-10">
            <SectionHeading eyebrow="Predicted Lineups" title="予想フォーメーション" />
            <p className="mb-3 -mt-2 text-xs text-muted">
              前節のスタメンより予想 ·{" "}
              <Link href={`/matches/${predictedHome.match.id}`} className="hover:text-accent-2 hover:underline">
                {homeTeam.shortName}: 第{predictedHome.match.matchday}節 vs{" "}
                {getTeamById(
                  predictedHome.match.homeTeamId === homeTeam.id ? predictedHome.match.awayTeamId : predictedHome.match.homeTeamId
                )?.shortName}
              </Link>{" "}
              ·{" "}
              <Link href={`/matches/${predictedAway.match.id}`} className="hover:text-accent-2 hover:underline">
                {awayTeam.shortName}: 第{predictedAway.match.matchday}節 vs{" "}
                {getTeamById(
                  predictedAway.match.homeTeamId === awayTeam.id ? predictedAway.match.awayTeamId : predictedAway.match.homeTeamId
                )?.shortName}
              </Link>
            </p>
            <MatchFormation lineup={predictedLineup} homeTeam={homeTeam} awayTeam={awayTeam} />
          </section>

          <section className="mt-10 grid gap-8 sm:grid-cols-2">
            <SubstitutesList
              title={`${awayTeam.shortName} · 予想控え選手`}
              players={predictedAway.teamLineup.substitutes}
              teamId={awayTeam.id}
            />
            <SubstitutesList
              title={`${homeTeam.shortName} · 予想控え選手`}
              players={predictedHome.teamLineup.substitutes}
              teamId={homeTeam.id}
            />
          </section>
        </>
      )}

      {h2h && h2h.numberOfMatches > 0 && (
        <section className="mt-10">
          <SectionHeading eyebrow="History" title="対戦成績" />
          <MatchHeadToHead homeTeam={homeTeam} awayTeam={awayTeam} excludeUtcDate={match.utcDate} />
        </section>
      )}

      {(lineup || predictedLineup) && <p className="mt-10 text-center text-xs text-muted">Lineup data by Highlightly</p>}
    </div>
  );
}

function SubstitutesList({ title, players, teamId }: { title: string; players: LineupPlayer[]; teamId: number }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-muted">{title}</h3>
      <div className="glass divide-y divide-border rounded-xl">
        {players.map((p) => {
          const resolved = resolveRosterPlayer(p.name, teamId);
          const row = (
            <div className="flex items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-surface-2">
              <span className="w-6 text-center text-xs font-bold text-muted">{p.number}</span>
              <span className="flex-1 text-foreground">{p.name}</span>
              <span className="text-xs text-muted">{p.position}</span>
            </div>
          );
          return resolved ? (
            <Link key={p.id} href={`/players/${resolved.id}`}>
              {row}
            </Link>
          ) : (
            <div key={p.id}>{row}</div>
          );
        })}
      </div>
    </div>
  );
}
