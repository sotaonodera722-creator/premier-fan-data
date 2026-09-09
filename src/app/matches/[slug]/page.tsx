import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMatchById,
  getMatchLineup,
  getClickableMatchIds,
  getTeamById,
  getPredictedLineup,
  resolveRosterPlayer,
} from "@/lib/data";
import TeamBadge from "@/components/TeamBadge";
import MatchFormation from "@/components/MatchFormation";
import MatchTimeline from "@/components/MatchTimeline";
import MatchStats from "@/components/MatchStats";
import MatchExpectedGoals from "@/components/MatchExpectedGoals";
import MatchHeadToHead from "@/components/MatchHeadToHead";
import SectionHeading from "@/components/SectionHeading";
import { RelativeKickoff } from "@/components/RelativeTime";
import { jstLongDate, jstTime, lateNightNote } from "@/lib/datetime";
import { playerNameJa } from "@/lib/playerDisplayName";
import { teamNameShort, teamNameFull } from "@/lib/teamNamesJa";
import { getRivalry, RIVALRY_KIND_LABELS } from "@/lib/rivalries";
import type { LineupPlayer, MatchLineup } from "@/lib/types";

export function generateStaticParams() {
  return getClickableMatchIds().map((id) => ({ slug: String(id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = getMatchById(Number(slug));
  if (!match) return { title: "試合 | Premier Fan Data" };

  const home = getTeamById(match.homeTeamId);
  const away = getTeamById(match.awayTeamId);
  if (!home || !away) return { title: "試合 | Premier Fan Data" };

  // Nothing competes for width in a tab title or a search result, so this is the
  // one place the full name fits.
  const fixture = `${teamNameFull(home)} vs ${teamNameFull(away)}`;
  const score = match.played ? ` ${match.homeGoals}-${match.awayGoals}` : "";
  return {
    title: `${fixture}${score} | Premier Fan Data`,
    description: match.played
      ? `第${match.matchday}節 ${fixture} の結果${score}。スタメン・フォーメーション・タイムライン・対戦成績をまとめています。`
      : `第${match.matchday}節 ${fixture} の予想スタメンと対戦成績。`,
  };
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

  // Named here rather than only on the club pages: a reader who arrived at this
  // fixture from the homepage has no other way to learn it is a derby.
  const rivalry = getRivalry(homeTeam.id, awayTeam.id);

  const lineup = getMatchLineup(matchId);
  // A finished match with no lineup data is a genuine gap, not a future fixture.
  if (!lineup && match.played) notFound();

  // One match in thirty is missing the Expected Goals category entirely, and the
  // section is named after whatever it can actually show.
  const hasExpectedGoals = Boolean(
    lineup?.statistics &&
      lineup.statistics.homeTeam.statistics.some((s) => s.displayName === "Expected Goals") &&
      lineup.statistics.awayTeam.statistics.some((s) => s.displayName === "Expected Goals")
  );

  const predictedHome = !lineup ? getPredictedLineup(homeTeam.id, matchId) : undefined;
  const predictedAway = !lineup ? getPredictedLineup(awayTeam.id, matchId) : undefined;
  const predictedLineup: MatchLineup | null =
    predictedHome && predictedAway
      ? { matchId: match.id, homeTeam: predictedHome.teamLineup, awayTeam: predictedAway.teamLineup }
      : null;
  // The club each side last faced, named so the note under a predicted lineup
  // can say where the prediction came from.
  const predictedHomeOpponent = predictedHome
    ? getTeamById(
        predictedHome.match.homeTeamId === homeTeam.id
          ? predictedHome.match.awayTeamId
          : predictedHome.match.homeTeamId
      )
    : undefined;
  const predictedAwayOpponent = predictedAway
    ? getTeamById(
        predictedAway.match.homeTeamId === awayTeam.id
          ? predictedAway.match.awayTeamId
          : predictedAway.match.homeTeamId
      )
    : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6">
      <p className="text-center text-note font-strong text-accent-2">第{match.matchday}節</p>
      <p className="mt-1.5 text-center text-sm text-muted">
        <time dateTime={match.utcDate} className="tabular-nums">
          {jstLongDate(match.utcDate)} {jstTime(match.utcDate)}
        </time>
        <span className="ml-1 text-xs">日本時間</span>
        {lateNightNote(match.utcDate) && (
          <span className="ml-1.5 text-xs">— {lateNightNote(match.utcDate)}のキックオフ</span>
        )}
      </p>

      {rivalry && (
        // Above the crests, because it changes how the two names below it read.
        // A 1st-versus-11th fixture looks like a mismatch until you know the two
        // clubs share a city.
        <div className="mt-3.5 flex justify-center">
          <p className="max-w-md border border-foreground px-3 py-2 text-center">
            <span className="block text-[11px] font-bold tracking-[0.08em] text-foreground">
              {rivalry.name ?? `${RIVALRY_KIND_LABELS[rivalry.kind]}のある対戦`}
            </span>
            <span className="mt-1 block text-[11px] leading-relaxed text-muted">{rivalry.why}</span>
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-6 sm:gap-10">
        <Link href={`/teams/${homeTeam.id}`} className="group flex flex-col items-center gap-2">
          <TeamBadge team={homeTeam} size={52} />
          <span className="text-sm font-medium text-foreground transition group-hover:text-accent-2">{teamNameShort(homeTeam)}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">ホーム</span>
        </Link>
        {match.played ? (
          <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-foreground">
            {match.homeGoals} - {match.awayGoals}
          </span>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-muted">vs</span>
            <span className="text-xs font-medium tabular-nums text-muted">
              {jstTime(match.utcDate)}
            </span>
            <RelativeKickoff iso={match.utcDate} className="text-[10px] font-semibold text-accent-2" />
          </div>
        )}
        <Link href={`/teams/${awayTeam.id}`} className="group flex flex-col items-center gap-2">
          <TeamBadge team={awayTeam} size={52} />
          <span className="text-sm font-medium text-foreground transition group-hover:text-accent-2">{teamNameShort(awayTeam)}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">アウェイ</span>
        </Link>
      </div>

      {/* What happened, before why it happened. The page used to open on a
          column of percentages, which is the answer to a question nobody has
          until they know how the ninety minutes went. */}
      {lineup?.events && lineup.events.length > 0 && (
        <section className="mt-10">
          <SectionHeading title="タイムライン" />
          <MatchTimeline
            events={lineup.events}
            homeTeamId={homeTeam.id}
            awayTeamId={awayTeam.id}
            homeSquad={lineup.homeTeam}
            awaySquad={lineup.awayTeam}
          />
        </section>
      )}

      {lineup?.statistics && (
        <section className="mt-10">
          <SectionHeading
            title={hasExpectedGoals ? "xGとスコアの乖離" : "トップ統計"}
          />
          {hasExpectedGoals && (
            <MatchExpectedGoals
              match={match}
              statistics={lineup.statistics}
              events={lineup.events}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
            />
          )}
          <div className={hasExpectedGoals ? "mt-4" : ""}>
            {hasExpectedGoals && (
              <h3 className="mb-2.5 text-sm font-semibold text-muted">そのほかの主要スタッツ</h3>
            )}
            <MatchStats statistics={lineup.statistics} homeTeam={homeTeam} awayTeam={awayTeam} />
          </div>
        </section>
      )}

      {lineup && (
        <>
          <section className="mt-10">
            <SectionHeading title="スタメン・フォーメーション" />
            <MatchFormation lineup={lineup} homeTeam={homeTeam} awayTeam={awayTeam} />
          </section>

          <section className="mt-10 grid gap-8 sm:grid-cols-2">
            <SubstitutesList title={`${teamNameShort(awayTeam)} · 控え選手`} players={lineup.awayTeam.substitutes} teamId={awayTeam.id} />
            <SubstitutesList title={`${teamNameShort(homeTeam)} · 控え選手`} players={lineup.homeTeam.substitutes} teamId={homeTeam.id} />
          </section>
        </>
      )}

      {!lineup && predictedLineup && predictedHome && predictedAway && (
        <>
          <section className="mt-10">
            <SectionHeading title="予想フォーメーション" />
            <p className="mb-3 -mt-2 text-xs text-muted">
              前節のスタメンより予想 ·{" "}
              <Link href={`/matches/${predictedHome.match.id}`} className="hover:text-accent-2 hover:underline">
                {teamNameShort(homeTeam)}: 第{predictedHome.match.matchday}節 vs{" "}
                {predictedHomeOpponent && teamNameShort(predictedHomeOpponent)}
              </Link>{" "}
              ·{" "}
              <Link href={`/matches/${predictedAway.match.id}`} className="hover:text-accent-2 hover:underline">
                {teamNameShort(awayTeam)}: 第{predictedAway.match.matchday}節 vs{" "}
                {predictedAwayOpponent && teamNameShort(predictedAwayOpponent)}
              </Link>
            </p>
            <MatchFormation lineup={predictedLineup} homeTeam={homeTeam} awayTeam={awayTeam} />
          </section>

          <section className="mt-10 grid gap-8 sm:grid-cols-2">
            <SubstitutesList
              title={`${teamNameShort(awayTeam)} · 予想控え選手`}
              players={predictedAway.teamLineup.substitutes}
              teamId={awayTeam.id}
            />
            <SubstitutesList
              title={`${teamNameShort(homeTeam)} · 予想控え選手`}
              players={predictedHome.teamLineup.substitutes}
              teamId={homeTeam.id}
            />
          </section>
        </>
      )}

      {/* Rendered even when the two have never met. For a fixture still to come,
          "no history" is part of judging whether to watch it, and a section that
          silently disappears reads as a bug. */}
      <section className="mt-10">
        <SectionHeading title="対戦成績" />
        <MatchHeadToHead homeTeam={homeTeam} awayTeam={awayTeam} excludeUtcDate={match.utcDate} />
      </section>

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
              <span className="flex-1 text-foreground">{(resolved && playerNameJa(resolved.id)) ?? p.name}</span>
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
