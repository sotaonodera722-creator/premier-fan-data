import Link from "next/link";
import type { Team } from "@/lib/types";
import type { RankingEntry } from "@/components/PlayerRankingList";
import type { TeamStatRow } from "@/components/TeamStatCard";
import TeamBadge from "@/components/TeamBadge";
import SectionHeading from "@/components/SectionHeading";
import SectionLink from "@/components/SectionLink";
import Term from "@/components/Term";
import { getTeamNameJa, teamNameShort } from "@/lib/teamNamesJa";

const ROW =
  "flex min-h-[44px] items-center gap-inline py-hair transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";

// The figure stops at 22px, the same step as the points column in the table.
// Three rows hold three equal figures rather than one that the block is
// about, and nine large numbers at the foot of the page would argue with the
// one at the top that the page is actually about.
const FIGURE = "shrink-0 font-numeral text-title font-stat leading-none text-foreground";
const RANK = "w-4 shrink-0 text-center font-numeral text-note text-muted";

function PlayerTop3({
  title,
  entries,
  teamById,
  emptyLabel,
  moreHref,
}: {
  title: string;
  entries: RankingEntry[];
  teamById: Record<number, Team>;
  emptyLabel: string;
  moreHref: string;
}) {
  return (
    <div>
      <SectionHeading title={title} action={<SectionLink href={moreHref}>もっと見る →</SectionLink>} />
      {entries.length === 0 ? (
        <p className="text-body text-muted">{emptyLabel}のデータがまだありません。</p>
      ) : (
        <ol>
          {entries.map(({ player: p, value, rank }) => {
            const team = teamById[p.teamId];
            return (
              <li key={p.id}>
                <Link href={`/players/${p.id}`} className={ROW}>
                  <span className={RANK}>{rank}</span>
                  {team && <TeamBadge team={team} size={24} />}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-hair text-body font-label leading-tight text-foreground">
                      {p.isJapanese && "🇯🇵"} <span className="line-clamp-2">{p.nameJa ?? p.name}</span>
                    </span>
                    <span className="block truncate text-note text-muted">{team && teamNameShort(team)}</span>
                  </span>
                  <span className={FIGURE}>{value}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function TeamXgTop3({ rows }: { rows: TeamStatRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <SectionHeading
        title="平均期待得点 (xG) TOP3"
        titleSuffix={
          // The mark is 12px tall on its own. Term takes a class for its
          // wrapper only, so the 44px is handed down to its button from here
          // rather than by changing a component every other page shares; the
          // negative margin gives the height back so the heading stays put.
          <Term
            name="xg"
            label={null}
            className="ml-inline align-middle text-micro font-body [&>button]:-my-3 [&>button]:min-h-[44px] [&>button]:min-w-[44px] [&>button]:items-center [&>button]:justify-center"
          />
        }
        action={<SectionLink href="/teams/rankings?tab=xg">もっと見る →</SectionLink>}
      />
      <ol>
        {rows.map((row) => (
          <li key={row.team.id}>
            <Link href={`/teams/${row.team.id}`} className={ROW}>
              <span className={RANK}>{row.rank}</span>
              <TeamBadge team={row.team} size={24} />
              <span className="min-w-0 flex-1 text-body font-label leading-tight text-foreground">
                {getTeamNameJa(row.team.id)?.short ?? row.team.shortName}
              </span>
              <span className={FIGURE}>{row.value.toFixed(2)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * The three short rankings at the foot of the homepage.
 *
 * They were three cards built from PlayerRankingList and TeamStatCard, which
 * /players and the club pages also use. Those belong to S18, so the homepage
 * sets its own here instead of adding a variant to a shared file — a one-line
 * change there would put every other page in this sprint's diff.
 *
 * No rules between the rows. Three rows are too few to need them; the rank,
 * the name and the figure line up on their own.
 */
export default function HomeRankings({
  scorers,
  assists,
  xg,
  teamById,
}: {
  scorers: RankingEntry[];
  assists: RankingEntry[];
  xg: TeamStatRow[];
  teamById: Record<number, Team>;
}) {
  return (
    <div className="grid gap-group sm:grid-cols-2 lg:grid-cols-3">
      <PlayerTop3
        title="得点ランキング TOP3"
        entries={scorers}
        teamById={teamById}
        emptyLabel="得点"
        moreHref="/players/rankings?tab=goals"
      />
      <PlayerTop3
        title="アシストランキング TOP3"
        entries={assists}
        teamById={teamById}
        emptyLabel="アシスト"
        moreHref="/players/rankings?tab=assists"
      />
      <TeamXgTop3 rows={xg} />
    </div>
  );
}
