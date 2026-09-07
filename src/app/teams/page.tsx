import {
  getStandingsTable,
  getForm,
  getPlayersByTeam,
  getUpcomingFixtures,
  getTeamById,
} from "@/lib/data";
import { getClubProfile, CLUB_SOURCES, TIER_LABELS, TIER_DESCRIPTIONS } from "@/lib/clubProfiles";
import { getTeamNameJa } from "@/lib/teamNamesJa";
import SectionHeading from "@/components/SectionHeading";
import TeamsExplorer, { type ClubCard } from "@/components/TeamsExplorer";
import KeyTeamStats from "@/components/KeyTeamStats";
import DataNote from "@/components/DataNote";

export const metadata = {
  title: "クラブ名鑑 | Premier Fan Data",
  description:
    "プレミアリーグ全20クラブが何者かを日本語で。街、スタジアム、創設年、優勝回数、そして今季の順位まで。",
};

const FORM_POINTS: Record<string, number> = { W: 3, D: 1, L: 0 };

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string; tier?: string }>;
}) {
  const { sort, q, tier } = await searchParams;
  const rows = getStandingsTable();

  // Assembled here rather than in the explorer: the card needs form, fixtures
  // and squad data, and reaching for those from a client component would ship
  // the whole match and lineup dataset to the browser.
  const clubs: ClubCard[] = rows.map((row) => {
    const team = row.team;
    const record = team.record;
    const form = getForm(team.id, 5);
    const nextFixture = getUpcomingFixtures(team.id, 1)[0];
    const nextOpponent = nextFixture
      ? getTeamById(nextFixture.homeTeamId === team.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)
      : undefined;

    return {
      team,
      nameJa: getTeamNameJa(team.id)?.full ?? team.name,
      position: row.position,
      points: record?.points ?? null,
      goalDiff: record?.goalDiff ?? null,
      winRate: record?.winRate ?? null,
      wins: record?.wins ?? null,
      draws: record?.draws ?? null,
      losses: record?.losses ?? null,
      founded: team.founded ?? null,
      form,
      formPoints: form.reduce((sum, r) => sum + (FORM_POINTS[r] ?? 0), 0),
      nextOpponent: nextOpponent ?? null,
      japaneseCount: getPlayersByTeam(team.id).filter((p) => p.isJapanese).length,
      // The same rule the table uses, including the clubs whose position is
      // level with one inside the drop zone.
      inRelegationZone: row.provisionalZone === "relegation",
      profile: getClubProfile(team.id),
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
      <SectionHeading eyebrow="Clubs" title="クラブ名鑑" />
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
        プレミアリーグの20クラブが、それぞれ何者なのか。街、スタジアム、創設年、これまでに獲ってきたタイトル、そして今季の順位まで。
        順位表の数字が意味を持つのは、そのクラブが何者か分かってからです。
      </p>

      <dl className="mb-8 grid gap-3 sm:grid-cols-3">
        {(["big6", "midtable", "promoted"] as const).map((key) => (
          <div key={key} className="rounded-lg border border-border bg-background-alt px-3.5 py-3">
            <dt className="text-xs font-semibold text-foreground">{TIER_LABELS[key]}</dt>
            <dd className="mt-1 text-[11px] leading-relaxed text-muted">{TIER_DESCRIPTIONS[key]}</dd>
          </div>
        ))}
      </dl>

      <TeamsExplorer clubs={clubs} initialSort={sort} initialQuery={q} initialFilter={tier} />

      <DataNote>
        街・スタジアム・創設年・優勝回数・昇格の経緯は Wikipedia を参考にしています。
        「残留争い」は順位表から自動で判定しているため、順位の変動に合わせて変わります。
      </DataNote>
      {/* Citations sit on their own line rather than inside the sentence: as
          inline links they were 14px tall, which is not a tap target. */}
      <ul className="mt-2 flex flex-wrap gap-2 pl-3">
        {CLUB_SOURCES.map((s) => (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center rounded-md border border-border px-2.5 text-[11px] text-muted transition hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-14">
        <SectionHeading eyebrow="Key Stats" title="重要な統計" />
        <KeyTeamStats />
      </div>
    </div>
  );
}
