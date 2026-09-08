import { Fragment } from "react";
import Link from "next/link";
import { getForm, getUpcomingFixtures, getTeamById } from "@/lib/data";
import { getTeamColor } from "@/lib/teamColors";
import { getTeamNameJa, teamNameFull } from "@/lib/teamNamesJa";
import { getClubProfile } from "@/lib/clubProfiles";
import { jstShortDate, jstTime } from "@/lib/datetime";
import type { StandingRow } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import FormPills from "@/components/FormPills";
import ZoneChip from "@/components/ZoneChip";
import MovementIndicator from "@/components/MovementIndicator";

/** "+5" / "-3" / "±0" — a bare "0" reads as missing data rather than as level. */
function goalDiff(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return String(value);
  return "±0";
}

// "Hull City are 2nd" is only surprising if you know Hull City have been away
// for nine years. The table is where that surprise happens, so the marker goes
// here rather than only on the club page.
function PromotedMark({ teamId }: { teamId: number }) {
  const profile = getClubProfile(teamId);
  if (profile?.promotedAfterYears == null) return null;
  return (
    <span
      title={`今季昇格・${profile.promotedAfterYears}年ぶりの1部`}
      className="inline-flex shrink-0 items-center rounded-sm border border-border px-1 text-[9px] leading-4 text-muted"
    >
      昇格
    </span>
  );
}

function ClubColorBar({ teamId }: { teamId: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-y-0 left-0 w-[3px]"
      style={{ backgroundColor: getTeamColor(teamId) }}
    />
  );
}

// Below lg the twelve-column table cannot fit without either sideways scrolling
// or a truncated club name. This list avoids both: the name gets a line to
// itself, and the season numbers move to a second line underneath it. The same
// list carries the standings column on the homepage, which is never wide enough
// for the table either.
export function StandingsCardList({
  rows,
  className = "lg:hidden",
  omittedAfterIndex,
}: {
  rows: StandingRow[];
  /** Overridden where the list is the only layout, as on the homepage. */
  className?: string;
  /**
   * Index after which the caller has cut the middle of the table out. Marking
   * the cut keeps the list honest: without it, ninth place appearing directly
   * under sixth reads as the actual order.
   */
  omittedAfterIndex?: number;
}) {
  return (
    <ul className={`glass divide-y divide-border overflow-hidden rounded-xl ${className}`}>
      {rows.map((row, index) => {
        const r = row.team.record;
        const nameJa = getTeamNameJa(row.team.id);
        // Counted in the numbers actually printed in the rows, not in dense
        // ranks — otherwise the label can claim to have hidden a position that
        // is visible in the very next row, since tied clubs share a number.
        const omittedHere =
          omittedAfterIndex === index && rows[index + 1]
            ? { from: (rows[index].position ?? rows[index].rank) + 1, to: (rows[index + 1].position ?? rows[index + 1].rank) - 1 }
            : null;
        return (
          <Fragment key={row.team.id}>
          <li className="relative">
            <ClubColorBar teamId={row.team.id} />
            <Link
              href={`/teams/${row.team.id}`}
              className="block py-2.5 pl-4 pr-3 transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            >
              <div className="flex items-center gap-2.5">
                {/* Position and movement read as one figure — "6th, up seven" —
                    so they are stacked in a single column rather than separated
                    by the badge. */}
                <span className="flex w-6 shrink-0 flex-col items-center gap-0.5">
                  <span className="font-[family-name:var(--font-display)] text-base font-bold leading-none tabular-nums text-foreground">
                    {row.position ?? "-"}
                  </span>
                  <MovementIndicator row={row} />
                </span>
                <TeamBadge team={row.team} size={24} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-tight text-foreground">
                    {nameJa?.full ?? row.team.name}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] leading-tight text-muted">
                    <span className="truncate">{row.team.name}</span>
                    <PromotedMark teamId={row.team.id} />
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-[family-name:var(--font-display)] text-lg font-bold leading-none tabular-nums text-foreground">
                    {r?.points ?? "-"}
                  </span>
                  <span className="block text-[9px] leading-tight text-muted">勝点</span>
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 pl-[2.125rem] text-[11px] text-muted">
                {row.provisionalZone && (
                  <ZoneChip zone={row.provisionalZone} provisional={row.tieStraddlesZoneBoundary} />
                )}
                <span className="tabular-nums">{row.played ?? "-"}試合</span>
                {row.gamesInHand > 0 && (
                  <span className="tabular-nums text-foreground">未消化{row.gamesInHand}</span>
                )}
                <span className="tabular-nums">得失{goalDiff(r?.goalDiff ?? 0)}</span>
                <span className="ml-auto">
                  <FormPills form={getForm(row.team.id, 5)} />
                </span>
              </div>
            </Link>
          </li>
          {omittedHere && (
            <li className="bg-background-alt px-4 py-1.5 text-center text-[10px] tracking-[0.2em] text-muted">
              <span className="tabular-nums">
                {omittedHere.from}〜{omittedHere.to}位は省略
              </span>
            </li>
          )}
          </Fragment>
        );
      })}
    </ul>
  );
}

function StandingsFullTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-border lg:block">
      <table className="w-full text-sm">
        <caption className="sr-only">プレミアリーグ順位表</caption>
        <thead>
          <tr className="bg-background-alt text-left text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="px-3 py-3 font-medium">#</th>
            <th scope="col" className="px-3 py-3 font-medium">クラブ</th>
            <th scope="col" className="px-2 py-3 text-center font-medium">試合</th>
            <th scope="col" className="px-2 py-3 text-center font-medium">勝</th>
            <th scope="col" className="px-2 py-3 text-center font-medium">分</th>
            <th scope="col" className="px-2 py-3 text-center font-medium">敗</th>
            <th scope="col" className="px-2 py-3 text-center font-medium">得点</th>
            <th scope="col" className="px-2 py-3 text-center font-medium">失点</th>
            <th scope="col" className="px-2 py-3 text-center font-medium">得失点差</th>
            <th scope="col" className="bg-surface-2/60 px-2 py-3 text-center font-semibold text-foreground">勝点</th>
            <th scope="col" className="px-3 py-3 font-medium">直近5試合</th>
            <th scope="col" className="px-3 py-3 font-medium">次戦</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const r = row.team.record;
            const nameJa = getTeamNameJa(row.team.id);
            const nextFixture = getUpcomingFixtures(row.team.id, 1)[0];
            const nextOpponent = nextFixture
              ? getTeamById(
                  nextFixture.homeTeamId === row.team.id ? nextFixture.awayTeamId : nextFixture.homeTeamId
                )
              : undefined;

            return (
              <tr key={row.team.id} className="border-t border-border transition hover:bg-surface-2">
                <td className="relative py-2.5 pl-4 pr-2">
                  <ClubColorBar teamId={row.team.id} />
                  <span className="flex items-center gap-1.5">
                    <span className="font-[family-name:var(--font-display)] font-bold tabular-nums text-foreground">
                      {row.position ?? "-"}
                    </span>
                    <MovementIndicator row={row} />
                    {row.provisionalZone && (
                      <ZoneChip zone={row.provisionalZone} provisional={row.tieStraddlesZoneBoundary} />
                    )}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/teams/${row.team.id}`}
                    className="flex items-center gap-3 rounded-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <TeamBadge team={row.team} size={28} />
                    <span className="min-w-0">
                      <span className="block font-medium text-foreground">{nameJa?.full ?? row.team.name}</span>
                      <span className="flex items-center gap-1.5 text-[11px] leading-tight text-muted">
                        {row.team.name}
                        <PromotedMark teamId={row.team.id} />
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-foreground">
                  {row.played ?? "-"}
                  {row.gamesInHand > 0 && (
                    <span
                      title={`他クラブより${row.gamesInHand}試合少ない`}
                      className="ml-1 text-[10px] font-semibold text-muted"
                    >
                      -{row.gamesInHand}
                    </span>
                  )}
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-muted">{r?.wins ?? "-"}</td>
                <td className="px-2 py-2.5 text-center tabular-nums text-muted">{r?.draws ?? "-"}</td>
                <td className="px-2 py-2.5 text-center tabular-nums text-muted">{r?.losses ?? "-"}</td>
                <td className="px-2 py-2.5 text-center tabular-nums text-muted">{r?.goalsFor ?? "-"}</td>
                <td className="px-2 py-2.5 text-center tabular-nums text-muted">{r?.goalsAgainst ?? "-"}</td>
                <td className="px-2 py-2.5 text-center tabular-nums text-foreground">
                  {r ? goalDiff(r.goalDiff) : "-"}
                </td>
                <td className="bg-surface-2/60 px-2 py-2.5 text-center font-[family-name:var(--font-display)] text-base font-bold tabular-nums text-foreground">
                  {r?.points ?? "-"}
                </td>
                <td className="px-3 py-2.5">
                  <FormPills form={getForm(row.team.id, 5)} />
                </td>
                <td className="px-3 py-2.5">
                  {nextOpponent && nextFixture ? (
                    <Link
                      href={`/matches/${nextFixture.id}`}
                      title={`${teamNameFull(nextOpponent)}戦 ${jstShortDate(nextFixture.utcDate)} ${jstTime(nextFixture.utcDate)}（日本時間）`}
                      className="flex items-center gap-2 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <TeamBadge team={nextOpponent} size={22} />
                      <span className="text-[11px] leading-tight tabular-nums text-muted">
                        <span className="block">{jstShortDate(nextFixture.utcDate)}</span>
                        <span className="block">{jstTime(nextFixture.utcDate)}</span>
                      </span>
                    </Link>
                  ) : (
                    <span className="text-xs text-muted">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <>
      <StandingsCardList rows={rows} />
      <StandingsFullTable rows={rows} />
    </>
  );
}
