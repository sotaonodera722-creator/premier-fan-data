import Link from "next/link";
import {
  getSeasonMovers,
  getRelegatedFromLastSeason,
  getPastSeasonMeta,
  getCurrentMatchday,
} from "@/lib/data";
import { getTeamColor } from "@/lib/teamColors";
import { getTeamNameJa } from "@/lib/teamNamesJa";
import { getClubProfile } from "@/lib/clubProfiles";
import type { SeasonMovement, PastSeasonRecord } from "@/lib/types";
import SectionHeading from "@/components/SectionHeading";
import DataNote from "@/components/DataNote";

/**
 * What has changed since last season finished.
 *
 * The table's own ▲▼ already means "since last week". Repeating the glyph here
 * with a different reference point would make the same mark mean two things on
 * one page, so this lives in its own section and spells the comparison out —
 * "4位 → 17位" — rather than compressing it into a symbol.
 *
 * Only the ends of the distribution appear. Fourteen clubs moved a place or two,
 * which is not news, and listing them would bury the three that did not.
 */

function clubName(teamId: number, fallback: string): string {
  return getTeamNameJa(teamId)?.short ?? fallback;
}

function Row({
  teamId,
  name,
  left,
  right,
  tone,
}: {
  teamId: number | null;
  name: string;
  left: string;
  right: React.ReactNode;
  tone: "up" | "down" | "muted";
}) {
  const toneClass =
    tone === "up" ? "text-success" : tone === "down" ? "text-danger" : "text-muted";

  const body = (
    <>
      <span
        aria-hidden="true"
        className="h-9 w-[3px] shrink-0 rounded-full"
        style={{ backgroundColor: teamId ? getTeamColor(teamId) : "var(--border)" }}
      />
      {/* The name gets a line to itself and the positions sit under it, which is
          the shape StandingsCardList already uses at this width. Keeping them on
          one line meant either truncating 「コヴェントリー」— the exact thing S03
          and S04 removed from this site — or letting a row grow taller than the
          eleven around it. */}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold leading-tight text-foreground">
          {name}
        </span>
        <span className="mt-0.5 block truncate text-[11px] leading-tight tabular-nums text-muted">
          {left}
        </span>
      </span>
      {/* "25年ぶり" is the longest string this column holds; the width is set for
          it so no row wraps. The movement figures are the only numbers here, so
          they keep the display weight — 昇格 and 降格 are labels and sit a step
          below rather than competing with them. */}
      <span
        className={`w-[4.5rem] shrink-0 whitespace-nowrap text-right tabular-nums ${
          tone === "muted" ? "text-xs font-semibold" : "text-sm font-bold"
        } ${toneClass}`}
      >
        {right}
      </span>
    </>
  );

  if (!teamId) {
    return <div className="flex items-center gap-3 px-3.5 py-2.5">{body}</div>;
  }
  return (
    <Link
      href={`/teams/${teamId}`}
      className="flex min-h-[44px] items-center gap-3 px-3.5 py-2.5 transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
    >
      {body}
    </Link>
  );
}

/**
 * A club that climbed six places and a club that came up from the division
 * below are not the same kind of fact, and only the first one is a subtraction.
 * The groups that cannot be counted in places sit on the tinted ground with a
 * line saying why, so the eye separates them before it reads a single figure.
 */
function Group({
  label,
  note,
  children,
}: {
  label: string;
  /** Says what kind of fact the group holds, where that is not a place count. */
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`border-t border-border first:border-t-0 ${note ? "bg-background-alt" : ""}`}>
      <p className="px-3.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      {note && <p className="px-3.5 pb-1.5 text-[11px] leading-snug text-muted">{note}</p>}
      <div className="pb-1">{children}</div>
    </div>
  );
}

function MovedRow({ movement }: { movement: SeasonMovement }) {
  const { last, position, change } = movement;
  if (!last || position == null || change == null) return null;
  const up = change > 0;
  return (
    <Row
      teamId={last.teamId}
      name={clubName(last.teamId, last.name)}
      left={`昨季 ${last.position}位 → ${position}位`}
      right={up ? `▲${change}` : `▼${-change}`}
      tone={up ? "up" : "down"}
    />
  );
}

function PromotedRow({ movement }: { movement: SeasonMovement }) {
  const { last, position } = movement;
  if (!last || position == null) return null;
  const years = getClubProfile(last.teamId)?.promotedAfterYears;
  return (
    <Row
      teamId={last.teamId}
      name={clubName(last.teamId, last.name)}
      left={`昨季 2部 ${last.position}位 → ${position}位`}
      right={years ? `${years}年ぶり` : "昇格"}
      tone="muted"
    />
  );
}

function GoneRow({ record }: { record: PastSeasonRecord }) {
  // No club page to link to: these clubs are not in this season's data at all.
  return (
    <Row
      teamId={null}
      name={clubName(record.teamId, record.name)}
      left={`昨季 ${record.position}位`}
      right="降格"
      tone="muted"
    />
  );
}

/** One sentence, assembled by rule, so nobody has to write it every August. */
function lede(movers: ReturnType<typeof getSeasonMovers>, gone: PastSeasonRecord[]): string {
  const parts: string[] = [];

  const biggestFall = movers.fell[0];
  if (biggestFall?.last && biggestFall.position != null) {
    parts.push(
      `昨季${biggestFall.last.position}位の${clubName(biggestFall.last.teamId, biggestFall.last.name)}が${biggestFall.position}位`
    );
  }

  const topPromoted = movers.promoted[0];
  if (topPromoted?.last && topPromoted.position != null) {
    parts.push(
      `2部から上がってきた${clubName(topPromoted.last.teamId, topPromoted.last.name)}が${topPromoted.position}位`
    );
  }

  if (gone.length > 0) {
    parts.push(`昨季いた${gone.map((g) => clubName(g.teamId, g.name)).join("・")}はもういない`);
  }

  return parts.length ? `${parts.join("。")}。` : "";
}

export default function SeasonMovers() {
  const movers = getSeasonMovers();
  const gone = getRelegatedFromLastSeason();
  const meta = getPastSeasonMeta();
  const matchday = getCurrentMatchday();

  // Nothing to compare against — the file is missing or the ids did not line up.
  if (!movers.fell.length && !movers.climbed.length && !movers.promoted.length && !gone.length) {
    return null;
  }

  const sentence = lede(movers, gone);

  return (
    <section className="mt-12">
      <SectionHeading eyebrow="Since May" title="昨季から何が変わったか" />

      {sentence && (
        <p className="mb-4 text-sm leading-relaxed text-foreground">{sentence}</p>
      )}

      <div className="glass overflow-hidden rounded-xl">
        {movers.promoted.length > 0 && (
          <Group label="今季上がってきた" note="2部の順位との比較なので、上下の数は出していません">
            {movers.promoted.map((m) => (
              <PromotedRow key={m.last!.teamId} movement={m} />
            ))}
          </Group>
        )}

        {movers.fell.length > 0 && (
          <Group label="昨季より大きく下にいる">
            {movers.fell.map((m) => (
              <MovedRow key={m.last!.teamId} movement={m} />
            ))}
          </Group>
        )}

        {movers.climbed.length > 0 && (
          <Group label="昨季より大きく上にいる">
            {movers.climbed.map((m) => (
              <MovedRow key={m.last!.teamId} movement={m} />
            ))}
          </Group>
        )}

        {gone.length > 0 && (
          <Group label="昨季いて、今季いない" note="2部に降格したため、今季のページはありません">
            {gone.map((g) => (
              <GoneRow key={g.teamId} record={g} />
            ))}
          </Group>
        )}
      </div>

      <DataNote>
        比較対象は{meta.season}シーズンの最終順位（全38節）。今季はまだ第{matchday}
        節で、この差は最終的な順位の差ではありません。出典は{meta.source}。
      </DataNote>
    </section>
  );
}
