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

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function clubName(team: Team): string {
  return getTeamNameJa(team.id)?.full ?? team.name;
}

/** Kickoff in the terms a reader in Japan plans an evening around. */
function Kickoff({ iso }: { iso: string }) {
  const tag = lateNightTag(iso);
  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5 text-[11px] leading-tight text-muted">
      <RelativeDay iso={iso} className="font-medium text-accent-2" />
      <span className="tabular-nums">{jstShortDate(iso)}</span>
      <span className="font-[family-name:var(--font-display)] font-bold tabular-nums text-foreground">
        {jstTime(iso)}
      </span>
      {tag && <span className="text-[10px]">{tag}</span>}
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
    <span className="flex items-center gap-2.5">
      <TeamBadge team={team} size={size} />
      <span
        className={`min-w-0 flex-1 truncate leading-tight text-foreground ${
          strong ? "text-base font-semibold" : "text-[13px] font-medium"
        }`}
      >
        {clubName(team)}
      </span>
      <span className="shrink-0 font-[family-name:var(--font-display)] text-xs font-bold tabular-nums text-muted">
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
    <ul className="flex flex-col gap-1">
      {reasons.map((r) => (
        <li key={r.label} className="flex items-baseline gap-1.5 text-[11px] leading-snug">
          <span className="shrink-0 font-semibold text-foreground">{r.label}</span>
          <span className="min-w-0 text-muted">{r.detail}</span>
        </li>
      ))}
    </ul>
  );
}

/** The top pick, given the room to argue its case. */
function LeadPick({ pick }: { pick: MatchPick }) {
  return (
    <Link
      href={`/matches/${pick.match.id}`}
      // On a wide screen the lead pick is obviously the lead pick: it spans the
      // row the other two share. On a phone every card is the same width, so the
      // hierarchy has to be carried by the card itself — a heavier edge, and a
      // line saying what it is.
      className={`glass block rounded-xl border-foreground/25 p-5 transition hover:-translate-y-0.5 hover:border-accent-2/50 sm:p-6 ${FOCUS_RING}`}
    >
      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent-2">
        まず1試合なら
      </p>
      <div className="grid gap-4 sm:grid-cols-[1.15fr_1fr] sm:items-start sm:gap-6">
        <div className="min-w-0">
          <Kickoff iso={pick.match.utcDate} />
          <div className="mt-3 flex flex-col gap-2.5">
            <ClubRow team={pick.homeTeam} position={pick.homePosition} size={38} strong />
            <ClubRow team={pick.awayTeam} position={pick.awayPosition} size={38} strong />
          </div>
        </div>
        <div className="min-w-0 border-t border-border pt-3 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <Reasons reasons={pick.reasons} />
        </div>
      </div>
    </Link>
  );
}

/** The other two, compact — same information, less of the page. */
function SecondaryPick({ pick }: { pick: MatchPick }) {
  return (
    <Link
      href={`/matches/${pick.match.id}`}
      className={`glass flex flex-col rounded-xl p-4 transition hover:-translate-y-0.5 hover:border-accent-2/50 ${FOCUS_RING}`}
    >
      <Kickoff iso={pick.match.utcDate} />
      <div className="mt-2.5 flex flex-col gap-2">
        <ClubRow team={pick.homeTeam} position={pick.homePosition} size={24} />
        <ClubRow team={pick.awayTeam} position={pick.awayPosition} size={24} />
      </div>
      <div className="mt-2.5 border-t border-border pt-2.5">
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
    <section className="mt-14">
      <SectionHeading
        eyebrow="Picks"
        // Eleven characters wrap and strand a lone 合 next to the action link at
        // 375px. Seven fit, and which round they belong to is the part a reader
        // actually needs from the title.
        title={isCurrentRound ? "今節の見どころ" : "次節の見どころ"}
        action={<SectionLink href="/matches">試合一覧へ →</SectionLink>}
      />
      {/* Where the list came from, before the list. Three fixtures presented
          without their denominator read as an editor's choice, and this site
          does not have an editor — it has rules, and they are cheap to state. */}
      <p className="-mt-1 mb-3.5 text-xs leading-relaxed text-muted">
        {isCurrentRound
          ? `第${matchday}節の残り${considered}試合から`
          : `第${matchday}節の${considered}試合から`}
        、順位・過去の対戦成績・日本人選手の在籍をもとに自動選出しています。
      </p>

      <LeadPick pick={lead} />
      {rest.length > 0 && (
        <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
          {rest.map((pick) => (
            <SecondaryPick key={pick.match.id} pick={pick} />
          ))}
        </div>
      )}
    </section>
  );
}
