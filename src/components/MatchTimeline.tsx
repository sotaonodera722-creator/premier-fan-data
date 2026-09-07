import Link from "next/link";
import type { MatchEvent, TeamLineup } from "@/lib/types";
import { resolveRosterPlayer, isKnownMatchParticipant } from "@/lib/data";
import { getPlayerNameJa } from "@/lib/playerNamesJa";

// The reader came for one of nine names. Finding out whether that name did
// anything should not mean reading twenty rows of Latin script looking for it,
// so a Japanese player is written in kanji, set in a heavier weight, and
// carries the same bordered chip idiom the table uses for promoted clubs.
function JapaneseMark() {
  return (
    <span className="ml-1 inline-flex shrink-0 items-center rounded-sm border border-border px-1 align-middle text-[9px] leading-4 text-muted">
      日本
    </span>
  );
}

// True if `name` can be tied to an actual person in this match — either a roster
// player (resolveRosterPlayer) or, failing that, someone who was at least in this
// match's own squad list (a player missing only from the season-long roster
// data). False means the lineup provider recorded this name against someone who
// was never part of either squad — almost always a manager or other non-playing
// staff member booked for a touchline incident — which isn't worth showing since
// there's no player to attribute or link it to.
function isRealMatchPlayer(name: string | null, teamId: number, squad: TeamLineup): boolean {
  if (!name) return false;
  return Boolean(resolveRosterPlayer(name, teamId)) || isKnownMatchParticipant(name, squad);
}

// Drops events the lineup provider attributed to someone who was never part of
// either squad (see isRealMatchPlayer above) — a manager or other non-playing
// staff member, most often booked for a touchline incident, with no player page
// to show or link to.
function eventHasRealPlayer(
  event: MatchEvent,
  homeTeamId: number,
  awayTeamId: number,
  homeSquad: TeamLineup,
  awaySquad: TeamLineup
): boolean {
  const squad = event.teamId === homeTeamId ? homeSquad : awaySquad;
  if (event.type === "Substitution") {
    return (
      isRealMatchPlayer(event.player, event.teamId, squad) &&
      isRealMatchPlayer(event.substitutedFor, event.teamId, squad)
    );
  }
  if (event.type === "Own Goal") {
    const otherTeamId = event.teamId === homeTeamId ? awayTeamId : homeTeamId;
    const otherSquad = event.teamId === homeTeamId ? awaySquad : homeSquad;
    return (
      isRealMatchPlayer(event.player, event.teamId, squad) ||
      isRealMatchPlayer(event.player, otherTeamId, otherSquad)
    );
  }
  return isRealMatchPlayer(event.player, event.teamId, squad);
}

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
    <Link
      href={`/players/${resolved.id}`}
      className={`transition hover:text-accent-2 hover:underline ${resolved.isJapanese ? "font-semibold" : ""}`}
    >
      {/* resolveRosterPlayer reads the raw roster, which has no kanji on it —
          the name map is the one place that does. */}
      {resolved.isJapanese ? (getPlayerNameJa(resolved.id) ?? name) : name}
      {resolved.isJapanese && <JapaneseMark />}
    </Link>
  );
}

/** True when any of the names on this event belongs to a Japanese player. */
function involvesJapanesePlayer(event: MatchEvent, homeTeamId: number, awayTeamId: number): boolean {
  const otherTeamId = event.teamId === homeTeamId ? awayTeamId : homeTeamId;
  return [event.player, event.assist, event.substitutedFor].some((name) => {
    if (!name) return false;
    const resolved = resolveRosterPlayer(name, event.teamId) ?? resolveRosterPlayer(name, otherTeamId);
    return Boolean(resolved?.isJapanese);
  });
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
  homeSquad,
  awaySquad,
}: {
  events: MatchEvent[];
  homeTeamId: number;
  awayTeamId: number;
  homeSquad: TeamLineup;
  awaySquad: TeamLineup;
}) {
  const sorted = events
    .filter((e) => eventHasRealPlayer(e, homeTeamId, awayTeamId, homeSquad, awaySquad))
    .sort((a, b) => Number.parseInt(a.minute, 10) - Number.parseInt(b.minute, 10));

  return (
    <div className="glass space-y-1 rounded-xl p-5">
      {sorted.map((e, i) => {
        const isHome = e.teamId === homeTeamId;
        // A card's own tone wins — it is the more urgent thing about the row —
        // so the Japanese marker only takes over rows that have no tone yet.
        const tone =
          e.type === "Red Card"
            ? "border-danger/30 bg-danger/5"
            : e.type === "Yellow Card"
              ? "border-yellow-400/30 bg-yellow-400/5"
              : involvesJapanesePlayer(e, homeTeamId, awayTeamId)
                ? "border-border bg-surface-2"
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
