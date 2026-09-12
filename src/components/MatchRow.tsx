import type { ReactNode } from "react";
import Link from "next/link";
import type { Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import { getTeamNameJa } from "@/lib/teamNamesJa";

/** How a club came out of a finished match. Fixtures and draws are "level". */
export type SideTone = "won" | "lost" | "level";

// Ink, not colour. The winner is set heavier and the loser greyed, so a reader
// running down ten results sees who won without comparing two numbers — and a
// round with six draws reads as one, because six rows carry no verdict at all.
const TONE: Record<SideTone, string> = {
  won: "font-strong text-foreground",
  lost: "text-muted",
  level: "text-foreground",
};

export function sideTones(played: boolean, homeGoals: number, awayGoals: number): [SideTone, SideTone] {
  if (!played || homeGoals === awayGoals) return ["level", "level"];
  return homeGoals > awayGoals ? ["won", "lost"] : ["lost", "won"];
}

function clubLabel(team: Team): string {
  return getTeamNameJa(team.id)?.short ?? team.shortName;
}

/** One side of the row, mirrored for the away club so the middle stays centred. */
function Side({
  team,
  align,
  tone,
  after,
}: {
  team: Team;
  align: "home" | "away";
  tone: SideTone;
  after?: ReactNode;
}) {
  return (
    <span
      className={`flex min-w-0 items-center gap-hair ${
        align === "home" ? "justify-end text-right" : "justify-start text-left"
      }`}
    >
      {align === "away" && <TeamBadge team={team} size={18} />}
      <span className={`min-w-0 text-body leading-tight ${TONE[tone]}`}>{clubLabel(team)}</span>
      {align === "home" && <TeamBadge team={team} size={18} />}
      {after}
    </span>
  );
}

/**
 * One match as one line — the shape S16 is to follow.
 *
 * The homepage used to draw this twice, once for results and once for fixtures,
 * and the two copies had drifted: different middle widths, different name
 * sizes, different crests. A result and a fixture are meant to carry equal
 * weight, so they now share one layout and differ only in what sits in the
 * middle — a score or a kickoff time.
 *
 * The row holds layout and nothing else. Every word and number in it comes
 * from the caller, because the two lists do not say the same things: results
 * carry a spoken score for screen readers and fixtures do not, and folding the
 * wording in here would quietly add one to the other.
 *
 * No rule between rows: a list with one numeric column is aligned, not boxed.
 * The date heading above each group does the grouping.
 */
export default function MatchRow({
  home,
  away,
  homeTone = "level",
  awayTone = "level",
  homeAfter,
  awayAfter,
  center,
  href,
  ariaLabel,
  unplayedMark = false,
}: {
  home: Team;
  away: Team;
  homeTone?: SideTone;
  awayTone?: SideTone;
  /** Rendered after each side's crest — screen-reader text, typically. */
  homeAfter?: ReactNode;
  awayAfter?: ReactNode;
  /** The score, or the kickoff time and whatever qualifies it. */
  center: ReactNode;
  href?: string;
  ariaLabel?: string;
  /**
   * A dashed left edge for a match not yet played, where finished and
   * unfinished matches share one list. Type size stays the same on purpose.
   */
  unplayedMark?: boolean;
}) {
  const body = (
    // The middle is fixed at 48px so every score and kickoff in both lists
    // stands on the same vertical, and both name columns get what is left —
    // enough at 375px for the longest short name on one line.
    <div className="grid min-h-[44px] grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] items-center gap-inline py-inline">
      <Side team={home} align="home" tone={homeTone} after={homeAfter} />
      <span className="flex flex-col items-center text-center leading-none">{center}</span>
      <Side team={away} align="away" tone={awayTone} after={awayAfter} />
    </div>
  );

  const mark = unplayedMark ? "border-l-2 border-dashed border-border" : "";
  if (!href) return <div className={mark}>{body}</div>;
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`block transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${mark}`}
    >
      {body}
    </Link>
  );
}
