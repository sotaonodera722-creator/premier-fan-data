import type { MatchEvent } from "@/lib/types";

const ICON: Record<string, string> = {
  Goal: "⚽",
  "Own Goal": "⚽",
  "Yellow Card": "■",
  "Red Card": "■",
  Substitution: "⇄",
  "Missed Penalty": "✕",
};

function iconTone(type: string): string {
  if (type === "Red Card") return "text-danger";
  if (type === "Goal" || type === "Own Goal" || type === "Yellow Card") return "text-accent-2";
  return "text-muted";
}

function EventLine({ event }: { event: MatchEvent }) {
  const sub =
    event.assist != null
      ? `assist: ${event.assist}`
      : event.type === "Missed Penalty"
        ? "PK失敗"
        : null;
  return (
    <span className="leading-tight">
      <span className="text-foreground">
        {event.type === "Substitution" ? (
          <>
            {event.player} <span className="text-muted">←</span> {event.substitutedFor}
          </>
        ) : (
          event.player
        )}
      </span>
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
    <div className="glass space-y-3 rounded-xl p-5">
      {sorted.map((e, i) => {
        const isHome = e.teamId === homeTeamId;
        const icon = <span className={`shrink-0 text-sm ${iconTone(e.type)}`}>{ICON[e.type] ?? "•"}</span>;
        return (
          <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
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
