import Link from "next/link";
import type { MatchEvent } from "@/lib/types";
import { resolveRosterPlayer } from "@/lib/data";

function PlayerLink({
  name,
  teamId,
  fallbackTeamId,
}: {
  name: string | null;
  teamId: number;
  // "Own Goal" events are recorded under the team that benefits, not the scorer's
  // own team — fall back to the other side's roster when the primary lookup misses.
  fallbackTeamId?: number;
}) {
  if (!name) return null;
  const resolved = resolveRosterPlayer(name, teamId) ?? (fallbackTeamId != null ? resolveRosterPlayer(name, fallbackTeamId) : undefined);
  if (!resolved) return <>{name}</>;
  return (
    <Link href={`/players/${resolved.id}`} className="transition hover:text-accent-2 hover:underline">
      {name}
    </Link>
  );
}

function EventIcon({ type }: { type: string }) {
  if (type === "Yellow Card") {
    return <span className="h-3.5 w-2.5 shrink-0 rounded-[2px] bg-yellow-400" />;
  }
  if (type === "Red Card") {
    return <span className="h-3.5 w-2.5 shrink-0 rounded-[2px] bg-danger" />;
  }
  if (type === "Goal" || type === "Own Goal") {
    return <span className="shrink-0 text-sm">⚽</span>;
  }
  if (type === "Substitution") {
    return null;
  }
  if (type === "Missed Penalty") {
    return <span className="shrink-0 text-sm text-muted">✕</span>;
  }
  return <span className="shrink-0 text-sm text-muted">•</span>;
}

function EventLine({
  event,
  homeTeamId,
  awayTeamId,
}: {
  event: MatchEvent;
  homeTeamId: number;
  awayTeamId: number;
}) {
  if (event.type === "Substitution") {
    // event.player left the pitch; event.substitutedFor came on.
    return (
      <span className="leading-tight">
        <span className="flex items-center gap-1.5 text-success">
          <span className="text-xs">▲</span> <PlayerLink name={event.substitutedFor} teamId={event.teamId} />
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-danger/80">
          <span className="text-xs">▼</span> <PlayerLink name={event.player} teamId={event.teamId} />
        </span>
      </span>
    );
  }

  const otherTeamId = event.teamId === homeTeamId ? awayTeamId : homeTeamId;
  return (
    <span className="leading-tight">
      <span className="text-foreground">
        <PlayerLink
          name={event.player}
          teamId={event.teamId}
          fallbackTeamId={event.type === "Own Goal" ? otherTeamId : undefined}
        />
      </span>
      {event.assist != null && (
        <span className="block text-[11px] text-muted">
          assist: <PlayerLink name={event.assist} teamId={event.teamId} />
        </span>
      )}
      {event.type === "Missed Penalty" && <span className="block text-[11px] text-muted">PK失敗</span>}
    </span>
  );
}

export default function MatchTimeline({
  events,
  homeTeamId,
  awayTeamId,
}: {
  events: MatchEvent[];
  homeTeamId: number;
  awayTeamId: number;
}) {
  const sorted = [...events].sort(
    (a, b) => Number.parseInt(a.minute, 10) - Number.parseInt(b.minute, 10)
  );

  return (
    <div className="glass space-y-1 rounded-xl p-5">
      {sorted.map((e, i) => {
        const isHome = e.teamId === homeTeamId;
        const tone =
          e.type === "Red Card"
            ? "border-danger/30 bg-danger/5"
            : e.type === "Yellow Card"
              ? "border-yellow-400/30 bg-yellow-400/5"
              : "border-transparent";
        const icon = <EventIcon type={e.type} />;
        return (
          <div
            key={i}
            className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg border px-2 py-1.5 text-sm ${tone}`}
          >
            <div className="flex items-center justify-end gap-2 text-right">
              {isHome && (
                <>
                  <EventLine event={e} homeTeamId={homeTeamId} awayTeamId={awayTeamId} />
                  {icon}
                </>
              )}
            </div>
            <span className="justify-self-center border border-border bg-background px-2 py-0.5 font-[family-name:var(--font-display)] text-xs font-semibold text-muted">
              {e.minute}&apos;
            </span>
            <div className="flex items-center gap-2">
              {!isHome && (
                <>
                  {icon}
                  <EventLine event={e} homeTeamId={homeTeamId} awayTeamId={awayTeamId} />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
