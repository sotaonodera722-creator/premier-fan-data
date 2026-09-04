import type { MatchEvent } from "@/lib/types";

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

function EventLine({ event }: { event: MatchEvent }) {
  if (event.type === "Substitution") {
    // player = coming on (substituted for substitutedFor), substitutedFor = going off
    return (
      <span className="leading-tight">
        <span className="flex items-center gap-1.5 text-success">
          <span className="text-xs">▲</span> {event.player}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-danger/80">
          <span className="text-xs">▼</span> {event.substitutedFor}
        </span>
      </span>
    );
  }

  const sub =
    event.assist != null
      ? `assist: ${event.assist}`
      : event.type === "Missed Penalty"
        ? "PK失敗"
        : null;
  return (
    <span className="leading-tight">
      <span className="text-foreground">{event.player}</span>
      {sub && <span className="block text-[11px] text-muted">{sub}</span>}
    </span>
  );
}

export default function MatchTimeline({
  events,
  homeTeamId,
}: {
  events: MatchEvent[];
  homeTeamId: number;
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
                  <EventLine event={e} />
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
                  <EventLine event={e} />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
