import Link from "next/link";
import { getPlayerUsage, getPlayerRoundUsage, getTeamById, getUpcomingFixtures, rankByMinutes } from "@/lib/data";
import type { PlayerRoundStatus, UsageRole } from "@/lib/data";
import type { Player, Team } from "@/lib/types";
import { getTeamNameJa } from "@/lib/teamNamesJa";
import { getPositionJa } from "@/lib/positionsJa";
import { jstShortDate, jstTime, lateNightTag } from "@/lib/datetime";
import { RelativeDay } from "@/components/RelativeTime";
import SectionHeading from "@/components/SectionHeading";
import TeamBadge from "@/components/TeamBadge";

const FULL_MATCH_MINUTES = 90;

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Deliberately monochrome. A player waiting for his chance is not a warning and a
// regular is not a success — the semantic tones would turn a description of how a
// manager picks his side into a verdict on the player.
const ROLE_LABELS: Record<UsageRole, string> = {
  everyPresent: "不動",
  rotation: "ローテーション",
  waiting: "出番待ち",
  unused: "出場なし",
};

const ROLE_NOTES: Record<UsageRole, string> = {
  everyPresent: "クラブの総試合時間の7割以上でピッチに立っています",
  rotation: "クラブの総試合時間の3割以上7割未満。試合によって起用が変わります",
  waiting: "クラブの総試合時間の3割未満。出番は限られています",
  unused: "取得済みのラインナップに出場記録がありません",
};

const STATUS_LABELS: Record<PlayerRoundStatus, string> = {
  start: "先発",
  sub: "途中出場",
  bench: "ベンチ",
  out: "メンバー外",
  unknown: "未取得",
};

function clubName(team: Team): string {
  return getTeamNameJa(team.id)?.short ?? team.shortName;
}

/**
 * A share as a whole percent, without the two lies plain rounding tells here.
 *
 * 269 minutes of a possible 270 rounds to 100%, which claims a player never
 * came off; and a player with two minutes rounds to 0%, which claims he never
 * played. Only a genuinely complete share prints 100, and any time at all
 * prints at least 1.
 */
function sharePercent(share: number): number {
  if (share >= 1) return 100;
  if (share <= 0) return 0;
  return Math.min(99, Math.max(1, Math.round(share * 100)));
}

/** One round: the fixture, how long he was on, and what he did while he was. */
function RoundRow({
  round,
}: {
  round: ReturnType<typeof getPlayerRoundUsage>[number];
}) {
  const opponent = getTeamById(round.opponentId);
  const fill = Math.min(100, Math.round((round.minutes / FULL_MATCH_MINUTES) * 100));

  return (
    <Link
      href={`/matches/${round.matchId}`}
      className={`block px-3 py-2.5 transition hover:bg-surface-2 ${FOCUS_RING}`}
    >
      <span className="flex items-center gap-2">
        <span className="w-11 shrink-0 text-[11px] tabular-nums text-muted">第{round.matchday}節</span>
        <span className="w-3 shrink-0 text-[10px] text-muted">{round.isHome ? "H" : "A"}</span>
        {opponent && <TeamBadge team={opponent} size={18} />}
        <span className="min-w-0 flex-1 truncate text-[13px] leading-tight text-foreground">
          {opponent ? clubName(opponent) : ""}
        </span>
        <span className="shrink-0 font-[family-name:var(--font-display)] text-[13px] font-bold tabular-nums text-foreground">
          {round.isHome ? round.homeGoals : round.awayGoals}-{round.isHome ? round.awayGoals : round.homeGoals}
        </span>
      </span>

      <span className="mt-1.5 flex items-baseline gap-1.5">
        <span className="font-[family-name:var(--font-display)] text-sm font-bold tabular-nums text-foreground">
          {round.minutes}
        </span>
        <span className="text-[10px] text-muted">分</span>
        <span className="text-[10px] text-muted">{STATUS_LABELS[round.status]}</span>
        {round.moments.map((m, i) => (
          <span key={i} className="text-[10px] tabular-nums text-foreground">
            {m.kind === "goal" ? "⚽" : "A"}
            {m.minute}&apos;
          </span>
        ))}
      </span>

      {/* The bar is what makes a run of rounds readable at a glance: a wall of
          full blocks is a regular, a comb is a rotation player. */}
      <span className="mt-1 block h-1 w-full bg-surface-2">
        <span className="block h-full bg-foreground" style={{ width: `${fill}%` }} />
      </span>
    </Link>
  );
}

/**
 * The club's own players in the same position, ranked by minutes.
 *
 * The ranking counts everyone who actually took the pitch, including the players
 * players.json does not carry — about one appearance in twenty. Those names have
 * no page behind them, which is a visible gap, but ranking a squad against a
 * squad with holes in it would put a player third when he is fifth, and that is
 * the one number this section exists to get right.
 */
function PositionRanking({
  peers,
  player,
}: {
  peers: ReturnType<typeof getPlayerUsage> extends null ? never : NonNullable<ReturnType<typeof getPlayerUsage>>["positionPeers"];
  player: Player;
}) {
  const missingRoster = peers.some((p) => !p.player);
  const rows = peers;

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">
        {getPositionJa(player.position)}の序列
        <span className="ml-1.5 font-normal tabular-nums text-muted">{rows.length}人</span>
      </h3>
      <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
        同じクラブ・同じポジションで、出場時間の多い順
      </p>
      <ol className="glass mt-2.5 divide-y divide-border overflow-hidden rounded-xl">
        {rows.map((row, index) => {
          const isThisPlayer = row.player?.id === player.id;
          const rank = rankByMinutes(rows, row);
          // Repeating "6" down five consecutive rows reads as a duplicated row
          // rather than as five players who are equally unused. The ditto mark
          // says "same as above" without inventing an order between them.
          const sharesRankWithRowAbove = index > 0 && rankByMinutes(rows, rows[index - 1]) === rank;
          const name = row.player ? (row.player.nameJa ?? row.player.name) : row.name;
          const inner = (
            <span
              className={`flex min-h-[44px] items-center gap-2.5 px-3 py-2 ${
                isThisPlayer ? "bg-surface-2" : ""
              }`}
            >
              <span
                className="w-4 shrink-0 text-center font-[family-name:var(--font-display)] text-xs font-bold tabular-nums text-muted"
                title={sharesRankWithRowAbove ? `${rank}位（同着）` : undefined}
              >
                {sharesRankWithRowAbove ? "〃" : rank}
              </span>
              <span
                className={`min-w-0 flex-1 truncate text-[13px] leading-tight ${
                  isThisPlayer ? "font-semibold text-foreground" : "text-foreground"
                }`}
              >
                {name}
                {!row.player && (
                  <span
                    title="選手名鑑に未収録のため、個別ページはありません"
                    className="ml-1.5 text-[10px] text-muted"
                  >
                    （名鑑未収録）
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-[family-name:var(--font-display)] text-[13px] font-bold leading-none tabular-nums text-foreground">
                  {row.minutes}
                </span>
                <span className="block text-[9px] leading-tight text-muted">分</span>
              </span>
              <span className="w-9 shrink-0 text-right font-[family-name:var(--font-display)] text-[11px] font-bold tabular-nums text-muted">
                {sharePercent(row.share)}%
              </span>
            </span>
          );

          return (
            <li key={row.lineupPlayerId}>
              {/* The row for the player whose page this is stays flat: a link
                  back to where you already are is a tap target that does
                  nothing. */}
              {row.player && !isThisPlayer ? (
                <Link href={`/players/${row.player.id}`} className={`block transition hover:bg-surface-2 ${FOCUS_RING}`}>
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ol>
      {missingRoster && (
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          「名鑑未収録」は、出場記録はあるのに選手データに載っていない選手です。個別ページはありませんが、序列を正しく出すため人数に数えています。
        </p>
      )}
    </div>
  );
}

/**
 * "Is he a regular?" — the question a reader asks straight after "did he play?"
 *
 * Everything here is derived from the lineups we hold, which is a small sample
 * this early in a season, so the denominator travels with every figure rather
 * than being left in a footnote.
 */
export default function PlayerUsageSection({ player }: { player: Player }) {
  const usage = getPlayerUsage(player.id);
  if (!usage) return null;

  const rounds = getPlayerRoundUsage(player.id);
  const nextFixture = getUpcomingFixtures(player.teamId, 1)[0];
  const nextOpponent = nextFixture
    ? getTeamById(
        nextFixture.homeTeamId === player.teamId ? nextFixture.awayTeamId : nextFixture.homeTeamId
      )
    : undefined;
  const percent = sharePercent(usage.share);

  return (
    <section className="mt-12">
      <SectionHeading eyebrow="Playing Time" title="起用のされ方" />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="min-w-0">
          <div className="glass rounded-xl p-5">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">
                {ROLE_LABELS[usage.role]}
              </span>
              {/* Three rounds is not a season. The label is the loudest thing on
                  the card, so the caveat rides next to it rather than only in
                  the small print underneath. */}
              {usage.coveredMatches < 5 && (
                <span className="rounded-sm border border-border px-1 text-[9px] leading-4 text-muted">
                  暫定
                </span>
              )}
              <span className="flex items-baseline gap-1">
                <span className="font-[family-name:var(--font-display)] text-3xl font-bold leading-none tabular-nums text-foreground">
                  {percent}
                </span>
                <span className="text-xs text-muted">%</span>
              </span>
              <span className="text-[11px] text-muted">出場割合</span>
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{ROLE_NOTES[usage.role]}</p>

            <div className="mt-3 h-1.5 w-full bg-surface-2" aria-hidden="true">
              <div className="h-full bg-foreground" style={{ width: `${percent}%` }} />
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3">
              <Figure label="出場時間" value={`${usage.minutes}分`} />
              <Figure label="先発" value={`${usage.starts}試合`} />
              <Figure label="途中出場" value={`${usage.substituteAppearances}試合`} />
            </dl>

            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              {/* The share's denominator, stated where the share is, not in a
                  footnote at the bottom of the page. */}
              クラブが戦った{usage.coveredMatches}試合 × 90分 ={" "}
              {usage.coveredMatches * FULL_MATCH_MINUTES}分 に対する割合です。
              {usage.coveredMatches < 5 && "まだ試合数が少ないため、暫定的な数字です。"}
            </p>

            {usage.positionRank > 0 && (
              <p className="mt-2 border-t border-border pt-3 text-[13px] leading-relaxed text-foreground">
                {usage.minutes > 0 ? (
                  <>
                    {getPositionJa(player.position)}のなかで
                    <span className="mx-1 font-[family-name:var(--font-display)] text-lg font-bold tabular-nums">
                      {usage.positionRank}
                    </span>
                    番手（{usage.positionTotal}人中）
                  </>
                ) : (
                  // No ordinal for a player on no minutes: he is not fourth
                  // choice ahead of the others on zero, he is level with them.
                  <>
                    {getPositionJa(player.position)}
                    {usage.positionTotal}人のうち、まだ出場時間がありません
                  </>
                )}
              </p>
            )}
          </div>

          {nextFixture && nextOpponent && (
            <Link
              href={`/matches/${nextFixture.id}`}
              className={`glass mt-3.5 flex items-center gap-2.5 rounded-xl px-4 py-3 transition hover:bg-surface-2 ${FOCUS_RING}`}
            >
              <span className="shrink-0 text-[11px] text-muted">次戦</span>
              <TeamBadge team={nextOpponent} size={22} />
              <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                {clubName(nextOpponent)}
              </span>
              <span className="shrink-0 text-right text-[11px] leading-tight text-muted">
                <RelativeDay iso={nextFixture.utcDate} className="mr-1 text-accent-2" />
                <span className="tabular-nums">{jstShortDate(nextFixture.utcDate)}</span>{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {jstTime(nextFixture.utcDate)}
                </span>
                {lateNightTag(nextFixture.utcDate) && (
                  <span className="block text-[10px]">{lateNightTag(nextFixture.utcDate)}</span>
                )}
              </span>
            </Link>
          )}

          {rounds.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground">節ごとの出場時間</h3>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                出場していない節も含めて並べています
              </p>
              <div className="glass mt-2.5 divide-y divide-border overflow-hidden rounded-xl">
                {rounds.map((round) => (
                  <RoundRow key={round.matchId} round={round} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <PositionRanking peers={usage.positionPeers} player={player} />
        </div>
      </div>
    </section>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] text-muted">{label}</dt>
      <dd className="font-[family-name:var(--font-display)] text-sm font-bold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}
