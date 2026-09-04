import type { LineupPlayer, MatchLineup, Team } from "@/lib/types";

function PlayerDot({ player, tone }: { player: LineupPlayer; tone: "home" | "away" }) {
  return (
    <div className="flex w-14 flex-col items-center gap-1 text-center sm:w-[70px]">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-background shadow-lg sm:h-8 sm:w-8 ${
          tone === "home" ? "bg-accent" : "bg-accent-2"
        }`}
      >
        {player.number}
      </span>
      <span className="max-w-full truncate text-[10px] leading-tight text-foreground sm:text-[11px]">
        {player.name}
      </span>
    </div>
  );
}

function Row({ row, tone }: { row: LineupPlayer[]; tone: "home" | "away" }) {
  return (
    <div className="flex justify-around gap-1">
      {row.map((p) => (
        <PlayerDot key={p.id} player={p} tone={tone} />
      ))}
    </div>
  );
}

export default function MatchFormation({
  lineup,
  homeTeam,
  awayTeam,
}: {
  lineup: MatchLineup;
  homeTeam: Team;
  awayTeam: Team;
}) {
  const awayRows = lineup.awayTeam.startXI;
  const homeRows = [...lineup.homeTeam.startXI].reverse();

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="flex items-center justify-between bg-surface px-4 py-2 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-accent-2">
          <span className="h-2 w-2 rounded-full bg-accent-2" /> {awayTeam.shortName} · {lineup.awayTeam.formation}
        </span>
        <span className="flex items-center gap-1.5 font-medium text-accent">
          {homeTeam.shortName} · {lineup.homeTeam.formation} <span className="h-2 w-2 rounded-full bg-accent" />
        </span>
      </div>
      <div className="pitch-grass relative flex flex-col justify-between gap-6 bg-[#0b1f14] px-3 py-6 sm:px-6">
        <div className="flex flex-col gap-5">
          {awayRows.map((row, i) => (
            <Row key={`away-${i}`} row={row} tone="away" />
          ))}
        </div>

        <div className="relative flex items-center justify-center">
          <div className="h-px w-full bg-white/15" />
          <div className="absolute h-16 w-16 rounded-full border border-white/15 sm:h-20 sm:w-20" />
        </div>

        <div className="flex flex-col gap-5">
          {homeRows.map((row, i) => (
            <Row key={`home-${i}`} row={row} tone="home" />
          ))}
        </div>
      </div>
    </div>
  );
}
