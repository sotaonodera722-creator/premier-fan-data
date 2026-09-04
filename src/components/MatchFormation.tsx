import type { LineupPlayer, MatchLineup, Team } from "@/lib/types";
import { getTeamColor, getContrastText, colorsClash } from "@/lib/teamColors";

function PlayerDot({
  player,
  color,
  outline,
}: {
  player: LineupPlayer;
  color: string;
  outline?: boolean;
}) {
  const textColor = outline ? color : getContrastText(color);
  return (
    <div className="flex w-14 flex-col items-center gap-1 text-center sm:w-[70px]">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg sm:h-8 sm:w-8"
        style={{
          backgroundColor: outline ? "#f4f4f2" : color,
          borderColor: outline ? color : "rgba(255,255,255,0.8)",
          color: textColor,
        }}
      >
        {player.number}
      </span>
      <span className="max-w-full truncate text-[10px] font-medium leading-tight text-white sm:text-[11px]">
        {player.name}
      </span>
    </div>
  );
}

function Row({ row, color, outline }: { row: LineupPlayer[]; color: string; outline?: boolean }) {
  return (
    <div className="flex justify-around gap-1">
      {row.map((p) => (
        <PlayerDot key={p.id} player={p} color={color} outline={outline} />
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
  const homeColor = getTeamColor(homeTeam.id);
  const awayColor = getTeamColor(awayTeam.id);
  // Colors too close to tell apart (e.g. Brighton navy vs Chelsea navy) — give the
  // away side an outlined "reversed kit" style instead of a second solid fill.
  const awayOutline = colorsClash(homeColor, awayColor);

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="flex items-center justify-between bg-surface px-4 py-2 text-xs">
        <span className="flex items-center gap-1.5 font-medium" style={{ color: awayColor }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: awayColor }} /> {awayTeam.shortName} ·{" "}
          {lineup.awayTeam.formation}
          <span className="rounded bg-background px-1.5 py-0.5 text-[9px] font-semibold text-muted">AWAY</span>
        </span>
        <span className="flex items-center gap-1.5 font-medium" style={{ color: homeColor }}>
          <span className="rounded bg-background px-1.5 py-0.5 text-[9px] font-semibold text-muted">HOME</span>
          {homeTeam.shortName} · {lineup.homeTeam.formation}{" "}
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: homeColor }} />
        </span>
      </div>
      <div className="pitch-grass relative flex flex-col justify-between gap-6 px-3 py-6 sm:px-6">
        <div className="flex flex-col gap-5">
          {awayRows.map((row, i) => (
            <Row key={`away-${i}`} row={row} color={awayColor} outline={awayOutline} />
          ))}
        </div>

        <div className="relative flex items-center justify-center">
          <div className="h-px w-full bg-white/15" />
          <div className="absolute h-16 w-16 rounded-full border border-white/15 sm:h-20 sm:w-20" />
        </div>

        <div className="flex flex-col gap-5">
          {homeRows.map((row, i) => (
            <Row key={`home-${i}`} row={row} color={homeColor} />
          ))}
        </div>
      </div>
    </div>
  );
}
