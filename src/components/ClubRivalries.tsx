import Link from "next/link";
import { getRivalriesFor, getAbsentRival, RIVALRY_KIND_LABELS, RIVALRY_SOURCES } from "@/lib/rivalries";
import { getHeadToHead, getTeamById } from "@/lib/data";
import { getTeamColor } from "@/lib/teamColors";
import { getTeamNameJa } from "@/lib/teamNamesJa";
import { jstYearMonth } from "@/lib/datetime";
import type { Rivalry } from "@/lib/rivalries";
import type { Team } from "@/lib/types";
import SectionHeading from "@/components/SectionHeading";
import DataNote from "@/components/DataNote";

/**
 * The fixtures that do not depend on the table.
 *
 * The record shown under each one is derived; the reason it matters is not, and
 * cannot be — see the note at the top of rivalries.ts. Keeping them visually
 * distinct is the point of the layout: the sentence is written, the numbers
 * underneath it are counted.
 */

function shortName(team: Team): string {
  return getTeamNameJa(team.id)?.short ?? team.shortName;
}

function Record({ club, opponent }: { club: Team; opponent: Team }) {
  const h2h = getHeadToHead(club.id, opponent.id);

  if (!h2h || h2h.numberOfMatches === 0) {
    return (
      <p className="border-t border-border bg-surface-2 px-3.5 py-3 text-xs leading-relaxed text-muted">
        保持している記録（2020年以降）に、この2クラブの対戦がありません。
      </p>
    );
  }

  const secondTier = h2h.matches.filter((m) => m.competition !== "Premier League").length;
  const latest = h2h.matches[0];

  return (
    <>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 border-t border-border bg-surface-2 px-3.5 py-3">
        <span className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: getTeamColor(club.id) }}
          />
          <span className="truncate text-xs font-semibold text-foreground">{shortName(club)}</span>
        </span>
        <span
          className="whitespace-nowrap font-[family-name:var(--font-display)] text-base font-bold tabular-nums text-foreground"
          aria-label={`${h2h.teamAWins}勝${h2h.draws}分${h2h.teamBWins}敗`}
        >
          {h2h.teamAWins}
          <span className="mx-0.5 font-normal text-muted">-</span>
          {h2h.draws}
          <span className="mx-0.5 font-normal text-muted">-</span>
          {h2h.teamBWins}
        </span>
        <span className="flex min-w-0 items-center justify-end gap-2">
          <span className="truncate text-xs font-semibold text-foreground">{shortName(opponent)}</span>
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: getTeamColor(opponent.id) }}
          />
        </span>
      </div>
      <p className="px-3.5 pb-3 pt-2 text-[11px] leading-relaxed text-muted">
        {/* All of them being second-tier is the interesting case, not a footnote:
            it means these two have not met in this division at all. */}
        2020年以降の{h2h.numberOfMatches}試合
        {secondTier === h2h.numberOfMatches
          ? "。すべて2部での対戦で、プレミアリーグでの記録はありません"
          : secondTier > 0 && `（うち${secondTier}試合は2部）`}
        。直近の対戦は{jstYearMonth(latest.utcDate)}。
      </p>
    </>
  );
}

function RivalryCard({ rivalry, club }: { rivalry: Rivalry; club: Team }) {
  const opponentId = rivalry.teamIds[0] === club.id ? rivalry.teamIds[1] : rivalry.teamIds[0];
  const opponent = getTeamById(opponentId);
  if (!opponent) return null;

  return (
    <article className="glass overflow-hidden rounded-xl">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-3.5 pt-3.5">
        <span className="shrink-0 border border-foreground px-1.5 py-0.5 text-[10px] font-bold leading-4 tracking-[0.08em] text-foreground">
          {RIVALRY_KIND_LABELS[rivalry.kind]}
        </span>
        <Link
          href={`/teams/${opponent.id}`}
          className="text-base font-bold leading-tight tracking-tight text-foreground hover:underline"
        >
          {rivalry.name ?? `対 ${shortName(opponent)}`}
        </Link>
      </div>
      <p className="px-3.5 pb-3.5 pt-2 text-xs leading-relaxed text-muted">{rivalry.why}</p>
      <Record club={club} opponent={opponent} />
    </article>
  );
}

/**
 * Five of the twenty clubs have no rival in this division. Saying so, and saying
 * who it would have been, is more use to a reader placing the club than an empty
 * section — and it is exactly the fact a returning viewer has missed.
 */
function NoRivalInLeague({ club }: { club: Team }) {
  const absent = getAbsentRival(club.id);
  if (!absent) return null;

  return (
    <section className="mt-12">
      <SectionHeading title="因縁のある相手" />
      <div className="glass rounded-xl p-5">
        <p className="text-sm leading-relaxed text-foreground">
          {shortName(club)}が最も意識する相手
          {absent.name ? `、${absent.rivalName}との${absent.name}` : `の${absent.rivalName}`}
          は、今季プレミアリーグにいません。
        </p>
        <p className="mt-2.5 text-xs leading-relaxed text-muted">{absent.why}</p>
      </div>
      <DataNote>
        どの対戦を因縁とみなすかは Wikipedia の各ダービーの記事を参考に手作業で定めています。
        対戦成績はデータから集計していますが、因縁かどうかはデータからは導けません。
      </DataNote>
    </section>
  );
}

export default function ClubRivalries({ club }: { club: Team }) {
  const rivalries = getRivalriesFor(club.id);

  if (rivalries.length === 0) return <NoRivalInLeague club={club} />;

  return (
    <section className="mt-12">
      <SectionHeading title="因縁のある相手" />
      <p className="mb-4 text-sm leading-relaxed text-foreground">
        順位表では隣り合わないこともあるのに、
        {rivalries.length === 1 ? "この1試合" : `この${rivalries.length}試合`}
        だけは順位と関係なく重くなります。
      </p>
      <div className="space-y-3.5">
        {rivalries.map((r) => (
          <RivalryCard key={r.teamIds.join("-")} rivalry={r} club={club} />
        ))}
      </div>
      <DataNote>
        どの対戦を因縁とみなすかは、
        {RIVALRY_SOURCES.map((s, i) => (
          <span key={s.url}>
            {i > 0 && "・"}
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              {s.label}
            </a>
          </span>
        ))}
        などを参考に手作業で定めています。対戦成績はデータから集計していますが、
        記録が2020年以降しかないため、対戦数の多さは因縁の強さを表しません。
      </DataNote>
    </section>
  );
}
