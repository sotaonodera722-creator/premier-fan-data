import Link from "next/link";
import type { MatchPick } from "@/lib/data";
import { getMatchPicks } from "@/lib/data";
import { getTeamNameJa } from "@/lib/teamNamesJa";
import { jstShortDate, jstTime, lateNightTag } from "@/lib/datetime";
import { RelativeDay } from "@/components/RelativeTime";
import TeamBadge from "@/components/TeamBadge";
import SectionHeading from "@/components/SectionHeading";
import SectionLink from "@/components/SectionLink";
import type { Team } from "@/lib/types";

const PICK_LINK =
  "-m-inline block p-inline transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function clubName(team: Team): string {
  return getTeamNameJa(team.id)?.full ?? team.name;
}

/** Kickoff in the terms a reader in Japan plans an evening around. */
function Kickoff({ iso, lead = false }: { iso: string; lead?: boolean }) {
  const tag = lateNightTag(iso);
  return (
    <p className="flex flex-wrap items-baseline gap-x-inline text-note leading-tight text-muted">
      <RelativeDay iso={iso} className="font-label text-accent-2" />
      <span className="tabular-nums">{jstShortDate(iso)}</span>
      <span className={`font-numeral font-strong text-foreground ${lead ? "text-lead" : "text-body"}`}>
        {jstTime(iso)}
      </span>
      {tag && <span className="text-micro">{tag}</span>}
    </p>
  );
}

function ClubRow({
  team,
  position,
  size,
  strong = false,
}: {
  team: Team;
  position: number | null;
  size: number;
  /** The top pick's clubs are set larger — it is the one being recommended. */
  strong?: boolean;
}) {
  return (
    <span className="flex items-center gap-inline">
      <TeamBadge team={team} size={size} />
      {/* Wraps rather than truncating: "ブライトン＆ホーヴ・アルビオン" at the
          lead pick's size is a few pixels short of one line at 375px. */}
      <span
        className={`min-w-0 flex-1 leading-tight text-foreground ${
          strong ? "text-lead font-strong" : "text-body font-label"
        }`}
      >
        {clubName(team)}
      </span>
      <span className="shrink-0 font-numeral text-note font-strong tabular-nums text-muted">
        {position != null ? `${position}位` : "—"}
      </span>
    </span>
  );
}

/**
 * The reasons are the point, not the ranking.
 *
 * A reader is entitled to disagree with the order and still get something out
 * of the list, so every point a fixture scored is printed as a reason with the
 * figure that earned it. Nothing is weighted invisibly.
 */
function Reasons({ reasons }: { reasons: MatchPick["reasons"] }) {
  return (
    <ul className="flex flex-col gap-hair">
      {reasons.map((r) => (
        <li key={r.label} className="flex items-baseline gap-inline text-note leading-snug">
          <span className="shrink-0 font-strong text-foreground">{r.label}</span>
          <span className="min-w-0 text-muted">{r.detail}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The top pick, given the room to argue its case.
 *
 * The line above it says "まず1試合なら", and the three used to be the same
 * size anyway — the words claimed a hierarchy the layout didn't show. Now the
 * size does: bigger crests and names, and the other two folded smaller below.
 */
function LeadPick({ pick }: { pick: MatchPick }) {
  return (
    <Link href={`/matches/${pick.match.id}`} className={PICK_LINK}>
      <p className="mb-inline text-micro font-label text-muted">まず1試合なら</p>
      <div className="grid gap-panel sm:grid-cols-[1.15fr_1fr] sm:items-start sm:gap-group">
        <div className="min-w-0">
          <Kickoff iso={pick.match.utcDate} lead />
          <div className="mt-panel flex flex-col gap-inline">
            <ClubRow team={pick.homeTeam} position={pick.homePosition} size={32} strong />
            <ClubRow team={pick.awayTeam} position={pick.awayPosition} size={32} strong />
          </div>
        </div>
        <div className="min-w-0">
          <Reasons reasons={pick.reasons} />
        </div>
      </div>
    </Link>
  );
}

/** The other two, compact — same information, less of the page. */
function SecondaryPick({ pick }: { pick: MatchPick }) {
  return (
    <Link href={`/matches/${pick.match.id}`} className={PICK_LINK}>
      <Kickoff iso={pick.match.utcDate} />
      <div className="mt-inline flex flex-col gap-hair">
        <ClubRow team={pick.homeTeam} position={pick.homePosition} size={20} />
        <ClubRow team={pick.awayTeam} position={pick.awayPosition} size={20} />
      </div>
      <div className="mt-inline">
        <Reasons reasons={pick.reasons} />
      </div>
    </Link>
  );
}

export default function MatchPicks() {
  const result = getMatchPicks(3);
  if (!result || result.picks.length === 0) return null;

  const { matchday, isCurrentRound, considered, picks } = result;
  const [lead, ...rest] = picks;

  return (
    <section className="mt-section">
      <SectionHeading
        // Eleven characters wrap and strand a lone 合 next to the action link at
        // 375px. Seven fit, and which round they belong to is the part a reader
        // actually needs from the title.
        title={isCurrentRound ? "今節の見どころ" : "次節の見どころ"}
        action={<SectionLink href="/matches">試合一覧へ →</SectionLink>}
      />
      {/* Where the list came from, before the list. Three fixtures presented
          without their denominator read as an editor's choice, and this site
          does not have an editor — it has rules, and they are cheap to state. */}
      <p className="-mt-inline mb-panel text-note text-muted">
        {isCurrentRound
          ? `第${matchday}節の残り${considered}試合から`
          : `第${matchday}節の${considered}試合から`}
        、順位・過去の対戦成績・日本人選手の在籍をもとに自動選出しています。
      </p>

      <LeadPick pick={lead} />
      {rest.length > 0 && (
        <div className="mt-group grid gap-heading sm:grid-cols-2 sm:gap-group">
          {rest.map((pick) => (
            <SecondaryPick key={pick.match.id} pick={pick} />
          ))}
        </div>
      )}
    </section>
  );
}
