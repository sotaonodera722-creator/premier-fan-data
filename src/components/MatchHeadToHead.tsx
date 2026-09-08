import { getHeadToHead, getTeamById } from "@/lib/data";
import { getTeamColor } from "@/lib/teamColors";
import { getClubProfile, isPromotedThisSeason } from "@/lib/clubProfiles";
import { getTeamNameJa, teamNameShort } from "@/lib/teamNamesJa";
import SectionLink from "@/components/SectionLink";
import { jstYearMonth } from "@/lib/datetime";
import type { Team } from "@/lib/types";

/** Below this, a record is a handful of afternoons rather than a pattern. */
const MEANINGFUL_HISTORY = 5;

function clubName(team: Team): string {
  return getTeamNameJa(team.id)?.full ?? team.shortName;
}

/**
 * Why there is nothing to show.
 *
 * Twenty of the hundred and ninety pairings in this league have never met in
 * the seasons we hold, and a section that simply vanishes leaves the reader
 * wondering whether the site is broken. Saying which club is new says something
 * useful at the same time: a fixture with no history is its own kind of
 * occasion.
 */
function NoHistory({ homeTeam, awayTeam }: { homeTeam: Team; awayTeam: Team }) {
  const newcomers = [homeTeam, awayTeam].filter((t) => isPromotedThisSeason(t.id));
  const years = newcomers
    .map((t) => {
      const away = getClubProfile(t.id)?.promotedAfterYears;
      return away ? `${clubName(t)}は${away}年ぶりの1部` : clubName(t);
    })
    .join("、");

  return (
    <p className="glass rounded-xl p-5 text-sm leading-relaxed text-muted">
      保持している範囲（直近シーズン）に、この2クラブの対戦記録がありません。
      {newcomers.length > 0 && `${years}で、この顔合わせ自体が久しぶりです。`}
    </p>
  );
}

export default function MatchHeadToHead({
  homeTeam,
  awayTeam,
  excludeUtcDate,
}: {
  homeTeam: Team;
  awayTeam: Team;
  excludeUtcDate: string;
}) {
  const h2h = getHeadToHead(homeTeam.id, awayTeam.id);
  const homeColor = getTeamColor(homeTeam.id);
  const awayColor = getTeamColor(awayTeam.id);

  if (!h2h || h2h.numberOfMatches === 0) {
    return <NoHistory homeTeam={homeTeam} awayTeam={awayTeam} />;
  }

  // The feed's record is not purely Premier League — 88 of the 1,417 stored
  // meetings were played in the Championship — so a pair whose history runs
  // through the second tier says so rather than presenting it as top-flight form.
  const hasSecondTier = h2h.matches.some((m) => m.competition !== "Premier League");

  // The match this page is showing is itself part of the head-to-head record —
  // its score is already shown at the top of the page, so skip it in the list below.
  const otherMatches = h2h.matches.filter((m) => m.utcDate !== excludeUtcDate);

  return (
    <div>
      {(h2h.numberOfMatches < MEANINGFUL_HISTORY || hasSecondTier) && (
        <p className="mb-3 text-xs leading-relaxed text-muted">
          {h2h.numberOfMatches < MEANINGFUL_HISTORY &&
            `記録は過去${h2h.numberOfMatches}試合のみです。相性を読むには足りません。`}
          {hasSecondTier && "チャンピオンシップ（2部）での対戦を含みます。"}
        </p>
      )}
      {/* A third of 375px leaves about 80px inside the padding. "Brentford 勝利"
          fitted; ブレントフォード 勝利 broke the club name across two lines mid-word.
          The club name gets its own line, and 勝利 sits under it as the label it is. */}
      <div className="glass grid grid-cols-3 divide-x divide-border rounded-xl text-center">
        <div className="px-2 py-4">
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold" style={{ color: homeColor }}>
            {h2h.teamAWins}
          </p>
          <p className="mt-1 text-[11px] leading-tight text-muted">
            <span className="block">{teamNameShort(homeTeam)}</span>
            勝利
          </p>
        </div>
        <div className="px-2 py-4">
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">{h2h.draws}</p>
          <p className="mt-1 text-[11px] leading-tight text-muted">
            <span className="block">両者</span>
            引き分け
          </p>
        </div>
        <div className="px-2 py-4">
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold" style={{ color: awayColor }}>
            {h2h.teamBWins}
          </p>
          <p className="mt-1 text-[11px] leading-tight text-muted">
            <span className="block">{teamNameShort(awayTeam)}</span>
            勝利
          </p>
        </div>
      </div>

      {otherMatches.length > 0 && (
        <div className="glass mt-4 divide-y divide-border rounded-xl">
          {otherMatches.map((m, i) => {
            const home = getTeamById(m.homeTeamId);
            const away = getTeamById(m.awayTeamId);
            return (
              // The date used to sit in a column beside the fixture, which left
              // 84px a side — enough for "Brentford", not for ブレントフォード.
              // It moves above so the two clubs get the full width of the row.
              <div key={i} className="px-4 py-2.5">
                <p className="text-[11px] leading-tight text-muted">{jstYearMonth(m.utcDate)}</p>
                <div className="mt-1 flex items-center gap-3 text-sm">
                  <span className="flex-1 truncate text-right text-foreground">{home && teamNameShort(home)}</span>
                  <span className="font-[family-name:var(--font-display)] font-bold text-foreground">
                    {m.homeGoals} - {m.awayGoals}
                  </span>
                  <span className="flex-1 truncate text-foreground">{away && teamNameShort(away)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SectionLink href={`/compare?a=${homeTeam.id}&b=${awayTeam.id}`} className="mt-6">
        詳しく比較する →
      </SectionLink>
    </div>
  );
}
