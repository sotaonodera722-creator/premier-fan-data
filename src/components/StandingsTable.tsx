import { Fragment } from "react";
import Link from "next/link";
import { getForm, getUpcomingFixtures, getTeamById } from "@/lib/data";
import { getTeamColor } from "@/lib/teamColors";
import { getTeamNameJa, teamNameFull } from "@/lib/teamNamesJa";
import { getClubProfile } from "@/lib/clubProfiles";
import { jstShortDate, jstTime } from "@/lib/datetime";
import { ZONE_NAMES, type StandingZone } from "@/lib/leagueRules";
import type { StandingRow } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import FormPills from "@/components/FormPills";
import MovementIndicator from "@/components/MovementIndicator";

/** "+5" / "-3" / "±0" — a bare "0" reads as missing data rather than as level. */
function goalDiff(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return String(value);
  return "±0";
}

// How many results the pills actually show. The header used to say "直近5試合"
// from a constant, and at matchday three that was a lie about every row.
function formLength(rows: StandingRow[]): number {
  return rows.reduce((longest, row) => Math.max(longest, getForm(row.team.id, 5).length), 0);
}

/** Exported so the legend below the table cannot disagree with the header. */
export function visibleFormLength(rows: StandingRow[]): number {
  return formLength(rows);
}

function formHeading(rows: StandingRow[]): string {
  const length = formLength(rows);
  return length > 0 ? `直近${length}試合` : "直近の結果";
}

/**
 * Where each zone begins, found by watching `provisionalZone` change rather than
 * by counting rows. Seventeenth is shared by two clubs this week, which puts
 * four clubs in three relegation places — anything that counts from the bottom
 * gets that wrong (R2, R8). Reading the change point also survives a sliced
 * list, which is what the homepage shows.
 */
type ZoneBand = { index: number; zone: StandingZone; provisional: number[]; label: boolean };

function zoneBands(rows: StandingRow[]): ZoneBand[] {
  const bands: ZoneBand[] = [];
  let open: ZoneBand | undefined;
  rows.forEach((row, index) => {
    const zone = row.provisionalZone;
    const before = rows[index - 1]?.provisionalZone;
    if (zone && zone !== before) {
      open = { index, zone, provisional: [], label: true };
      bands.push(open);
    } else if (!zone && before) {
      // A zone has to end somewhere, and the row below it is entitled to
      // nothing. Without this line the Europa place simply stops with no sign
      // that it has: fifth and sixth looked identical, which is the one
      // difference on that part of the table worth seeing. No label, because
      // what begins here is the middle of the table, and having nothing
      // riding on the season is what the absence of a label says.
      bands.push({ index, zone: before, provisional: [], label: false });
      open = undefined;
    }
    // The dashed "?" badge used to carry this per row. Moving the zone to a band
    // would drop it, so the band says which position is still unsettled.
    if (open && row.tieStraddlesZoneBoundary && row.position != null) {
      open.provisional.push(row.position);
    }
  });
  return bands;
}

const BAND_TONE: Record<StandingZone, string> = {
  cl: "text-success",
  el: "text-info",
  relegation: "text-danger",
};

function bandLabel(band: ZoneBand): string {
  if (band.provisional.length === 0) return ZONE_NAMES[band.zone];
  const positions = [...new Set(band.provisional)].join("・");
  return `${ZONE_NAMES[band.zone]}（${positions}位は同着のため暫定）`;
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
      className="inline-flex shrink-0 items-center bg-surface-2 px-1 text-micro leading-4 text-muted"
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
  const bands = zoneBands(rows);
  return (
    // No surface and no outer rule: twenty rows separated by nineteen hairlines
    // read as one table, where a panel around them reads as one card. The
    // hairlines stay — four or more like rows with numeric columns is exactly
    // what a rule is for.
    <ul className={`divide-y divide-border ${className}`}>
      <li className="flex items-baseline gap-inline px-panel pb-hair text-micro font-label text-muted">
        <span className="w-6 shrink-0 text-center">順位</span>
        <span className="flex-1">クラブ</span>
        <span className="shrink-0">勝点</span>
      </li>
      {rows.map((row, index) => {
        const r = row.team.record;
        const nameJa = getTeamNameJa(row.team.id);
        const band = bands.find((b) => b.index === index);
        // Counted in the numbers actually printed in the rows, not in dense
        // ranks — otherwise the label can claim to have hidden a position that
        // is visible in the very next row, since tied clubs share a number.
        const omittedHere =
          omittedAfterIndex === index && rows[index + 1]
            ? { from: (rows[index].position ?? rows[index].rank) + 1, to: (rows[index + 1].position ?? rows[index + 1].rank) - 1 }
            : null;
        return (
          <Fragment key={row.team.id}>
          {band && (
            <li
              className={`border-t-2 border-current ${BAND_TONE[band.zone]} ${
                band.label ? "px-panel pb-hair pt-inline text-micro font-label" : ""
              }`}
            >
              {band.label && bandLabel(band)}
            </li>
          )}
          <li className="relative">
            <ClubColorBar teamId={row.team.id} />
            <Link
              href={`/teams/${row.team.id}`}
              className="block py-inline pl-panel pr-panel transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            >
              <div className="flex items-center gap-inline">
                {/* Position and movement read as one figure — "6th, up seven" —
                    so they are stacked in a single column rather than separated
                    by the badge. */}
                <span className="flex w-6 shrink-0 flex-col items-center gap-hair">
                  <span className="font-numeral text-lead font-stat leading-none text-foreground">
                    {row.position ?? "-"}
                  </span>
                  <MovementIndicator row={row} />
                </span>
                <TeamBadge team={row.team} size={24} />
                <span className="flex min-w-0 flex-1 items-center gap-hair">
                  {/* One storey. The English name under every club made each row
                      two lines deep, which is what stopped the points column
                      from being readable as a column. It is still on /teams and
                      on the club page. */}
                  <span className="min-w-0 text-body font-label leading-tight text-foreground">
                    {nameJa?.full ?? row.team.name}
                  </span>
                  <PromotedMark teamId={row.team.id} />
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-numeral text-title font-stat leading-none text-foreground">
                    {r?.points ?? "-"}
                  </span>
                </span>
              </div>
              <div className="mt-hair flex items-center gap-inline pl-8 text-note text-muted">
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
            <li className="bg-background-alt px-panel py-hair text-center text-micro tracking-[0.2em] text-muted">
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
  const bands = zoneBands(rows);
  return (
    // The panel and its soft corners are gone for the same reason as the
    // list's: a table does not need a card around it to be one.
    <div className="hidden lg:block">
      <table className="w-full text-body">
        <caption className="sr-only">プレミアリーグ順位表</caption>
        <thead>
          <tr className="text-left text-micro font-label text-muted">
            <th scope="col" className="px-inline py-inline">#</th>
            <th scope="col" className="px-inline py-inline">クラブ</th>
            <th scope="col" className="px-inline py-inline text-center">試合</th>
            <th scope="col" className="px-inline py-inline text-center">勝</th>
            <th scope="col" className="px-inline py-inline text-center">分</th>
            <th scope="col" className="px-inline py-inline text-center">敗</th>
            <th scope="col" className="px-inline py-inline text-center">得点</th>
            <th scope="col" className="px-inline py-inline text-center">失点</th>
            <th scope="col" className="px-inline py-inline text-center">得失点差</th>
            <th scope="col" className="px-inline py-inline text-center text-foreground">勝点</th>
            <th scope="col" className="px-inline py-inline">{formHeading(rows)}</th>
            <th scope="col" className="px-inline py-inline">次戦</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, index) => {
            const r = row.team.record;
            const nameJa = getTeamNameJa(row.team.id);
            const band = bands.find((b) => b.index === index);
            const nextFixture = getUpcomingFixtures(row.team.id, 1)[0];
            const nextOpponent = nextFixture
              ? getTeamById(
                  nextFixture.homeTeamId === row.team.id ? nextFixture.awayTeamId : nextFixture.homeTeamId
                )
              : undefined;

            return (
              <Fragment key={row.team.id}>
              {band && (
                <tr className={`border-t-2 border-current ${BAND_TONE[band.zone]}`}>
                  <td
                    colSpan={12}
                    className={band.label ? "px-inline pb-hair pt-inline text-micro font-label" : ""}
                  >
                    {band.label && bandLabel(band)}
                  </td>
                </tr>
              )}
              <tr className="transition hover:bg-surface-2">
                <td className="relative py-inline pl-panel pr-inline">
                  <ClubColorBar teamId={row.team.id} />
                  <span className="flex items-center gap-hair">
                    <span className="font-numeral text-lead font-stat text-foreground">
                      {row.position ?? "-"}
                    </span>
                    <MovementIndicator row={row} />
                  </span>
                </td>
                <td className="px-inline py-inline">
                  <Link
                    href={`/teams/${row.team.id}`}
                    className="flex items-center gap-inline hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <TeamBadge team={row.team} size={28} />
                    <span className="flex min-w-0 items-center gap-hair">
                      <span className="font-label text-foreground">{nameJa?.full ?? row.team.name}</span>
                      <PromotedMark teamId={row.team.id} />
                    </span>
                  </Link>
                </td>
                <td className="px-inline py-inline text-center tabular-nums text-foreground">
                  {row.played ?? "-"}
                  {row.gamesInHand > 0 && (
                    <span
                      title={`他クラブより${row.gamesInHand}試合少ない`}
                      className="ml-hair text-micro font-label text-muted"
                    >
                      -{row.gamesInHand}
                    </span>
                  )}
                </td>
                <td className="px-inline py-inline text-center tabular-nums text-muted">{r?.wins ?? "-"}</td>
                <td className="px-inline py-inline text-center tabular-nums text-muted">{r?.draws ?? "-"}</td>
                <td className="px-inline py-inline text-center tabular-nums text-muted">{r?.losses ?? "-"}</td>
                <td className="px-inline py-inline text-center tabular-nums text-muted">{r?.goalsFor ?? "-"}</td>
                <td className="px-inline py-inline text-center tabular-nums text-muted">{r?.goalsAgainst ?? "-"}</td>
                <td className="px-inline py-inline text-center tabular-nums text-foreground">
                  {r ? goalDiff(r.goalDiff) : "-"}
                </td>
                <td className="px-inline py-inline text-center font-numeral text-title font-stat text-foreground">
                  {r?.points ?? "-"}
                </td>
                <td className="px-inline py-inline">
                  <FormPills form={getForm(row.team.id, 5)} />
                </td>
                <td className="px-inline py-inline">
                  {nextOpponent && nextFixture ? (
                    <Link
                      href={`/matches/${nextFixture.id}`}
                      title={`${teamNameFull(nextOpponent)}戦 ${jstShortDate(nextFixture.utcDate)} ${jstTime(nextFixture.utcDate)}（日本時間）`}
                      className="flex items-center gap-inline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <TeamBadge team={nextOpponent} size={22} />
                      <span className="text-micro leading-tight tabular-nums text-muted">
                        <span className="block">{jstShortDate(nextFixture.utcDate)}</span>
                        <span className="block">{jstTime(nextFixture.utcDate)}</span>
                      </span>
                    </Link>
                  ) : (
                    <span className="text-note text-muted">-</span>
                  )}
                </td>
              </tr>
              </Fragment>
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
