import Link from "next/link";
import Term from "@/components/Term";
import type { LineupPlayer, MatchLineup, Team } from "@/lib/types";
import { getTeamColor, getContrastText, colorsClash } from "@/lib/teamColors";
import { resolveRosterPlayer } from "@/lib/data";
import { playerNameJa, playerSurnameJa } from "@/lib/playerDisplayName";
import { teamNameShort } from "@/lib/teamNamesJa";

// Five across is a real formation (5-4-1), and a fixed 68px marker overflows a
// 375px pitch at that width. Each marker takes an equal share of the row and
// stops growing at the width a katakana surname needs, so a back four gets the
// full label and a back five gives up a few pixels rather than the whole row.
const DOT_WIDTH = "min-w-0 flex-1 max-w-[68px]";

function PlayerDot({
  player,
  teamId,
  color,
  outline,
}: {
  player: LineupPlayer;
  teamId: number;
  color: string;
  outline?: boolean;
}) {
  const textColor = outline ? color : getContrastText(color);
  const resolved = resolveRosterPlayer(player.name, teamId);
  const content = (
    <div className="group flex w-full flex-col items-center gap-1 rounded-lg px-0.5 py-1.5 text-center transition group-hover:bg-white/15">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg transition group-hover:brightness-110 sm:h-8 sm:w-8"
        style={{
          backgroundColor: outline ? "#f4f4f2" : color,
          borderColor: outline ? color : "rgba(255,255,255,0.8)",
          color: textColor,
        }}
      >
        {player.number}
      </span>
      <span className="max-w-full truncate text-[10px] font-medium leading-tight text-white transition group-hover:underline sm:text-[11px]">
        {(resolved && playerSurnameJa(resolved.id)) ?? player.name}
      </span>
    </div>
  );

  if (!resolved) return <div className={DOT_WIDTH}>{content}</div>;
  const label = (resolved && playerNameJa(resolved.id)) ?? player.name;
  return (
    // Without `block` the anchor stays inline and its hit area collapses to a
    // text line, leaving the shirt number — the largest part of the marker —
    // untappable. The name is truncated to fit the pitch, so it is repeated in
    // full for anyone hovering or using a screen reader.
    <Link
      href={`/players/${resolved.id}`}
      title={`${player.number} ${label}`}
      aria-label={`${label} の選手ページ`}
      className={`block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${DOT_WIDTH}`}
    >
      {content}
    </Link>
  );
}

function Row({ row, teamId, color, outline }: { row: LineupPlayer[]; teamId: number; color: string; outline?: boolean }) {
  return (
    <div className="flex justify-around gap-1">
      {row.map((p) => (
        <PlayerDot key={p.id} player={p} teamId={teamId} color={color} outline={outline} />
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
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: awayColor }} /> {teamNameShort(awayTeam)} ·{" "}
          {lineup.awayTeam.formation}
          <Term name="formation" label={null} className="font-normal text-muted" />
          <span className="rounded bg-background px-1.5 py-0.5 text-[9px] font-semibold text-muted">AWAY</span>
        </span>
        <span className="flex items-center gap-1.5 font-medium" style={{ color: homeColor }}>
          <span className="rounded bg-background px-1.5 py-0.5 text-[9px] font-semibold text-muted">HOME</span>
          {teamNameShort(homeTeam)} · {lineup.homeTeam.formation}{" "}
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: homeColor }} />
        </span>
      </div>
      <div className="pitch-grass relative flex flex-col justify-between gap-6 px-3 py-6 sm:px-6">
        <div className="flex flex-col gap-5">
          {awayRows.map((row, i) => (
            <Row key={`away-${i}`} row={row} teamId={awayTeam.id} color={awayColor} outline={awayOutline} />
          ))}
        </div>

        <div className="relative flex items-center justify-center">
          <div className="h-px w-full bg-white/15" />
          <div className="absolute h-16 w-16 rounded-full border border-white/15 sm:h-20 sm:w-20" />
        </div>

        <div className="flex flex-col gap-5">
          {homeRows.map((row, i) => (
            <Row key={`home-${i}`} row={row} teamId={homeTeam.id} color={homeColor} />
          ))}
        </div>
      </div>
    </div>
  );
}
