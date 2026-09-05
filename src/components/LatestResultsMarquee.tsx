import Link from "next/link";
import type { Match, Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";

function Ticket({
  match,
  teamById,
  clickable,
}: {
  match: Match;
  teamById: Record<number, Team>;
  clickable: boolean;
}) {
  const home = teamById[match.homeTeamId];
  const away = teamById[match.awayTeamId];
  if (!home || !away) return null;

  const content = (
    <div
      className={`flex shrink-0 items-center gap-2.5 border border-border bg-surface px-3.5 py-2.5 transition ${
        clickable ? "hover:border-accent-2 hover:bg-surface-2" : ""
      }`}
    >
      <TeamBadge team={home} size={22} />
      <span className="font-[family-name:var(--font-display)] text-sm font-bold text-foreground">
        {match.homeGoals} - {match.awayGoals}
      </span>
      <TeamBadge team={away} size={22} />
    </div>
  );

  if (!clickable) return content;
  return (
    <Link href={`/matches/${match.id}`} className="shrink-0">
      {content}
    </Link>
  );
}

export default function LatestResultsMarquee({
  matches,
  teamById,
  matchday,
  lineupMatchIds,
}: {
  matches: Match[];
  teamById: Record<number, Team>;
  matchday: number;
  lineupMatchIds: Set<number>;
}) {
  if (matches.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted">第{matchday}節 結果</p>
      <div className="-mx-4 overflow-hidden px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max animate-marquee gap-2">
          {[...matches, ...matches].map((m, i) => (
            <Ticket key={`${m.id}-${i}`} match={m} teamById={teamById} clickable={lineupMatchIds.has(m.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
