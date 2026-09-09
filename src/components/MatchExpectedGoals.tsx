import type { Match, MatchEvent, MatchStatistics, Team } from "@/lib/types";
import { getTeamNameJa } from "@/lib/teamNamesJa";
import TeamBadge from "@/components/TeamBadge";

/**
 * Three quarters of a goal. Below that, a single match's expected-goals figure
 * is inside the noise of the model and of the sample, and calling it finishing
 * would be reading a verdict into a rounding difference.
 */
const DECISIVE_GAP = 0.75;

function clubName(team: Team): string {
  return getTeamNameJa(team.id)?.full ?? team.shortName;
}

function xgFor(statistics: MatchStatistics, side: "homeTeam" | "awayTeam"): number | null {
  const found = statistics[side].statistics.find((s) => s.displayName === "Expected Goals");
  return found?.value ?? null;
}

function signed(value: number): string {
  if (value > 0) return `+${value.toFixed(2)}`;
  if (value < 0) return value.toFixed(2);
  return "±0.00";
}

/** What the gap between a side's chances and its goals amounts to. */
// Phrased against the estimate rather than as a judgement on the players: a side
// that scored three off 3.87 expected goals did not play badly, it simply
// created even more than it took, and "決めきれなかった" would say otherwise.
function verdict(delta: number): { text: string; tone: string } {
  if (delta >= DECISIVE_GAP) return { text: "期待値以上に決めた", tone: "text-success" };
  if (delta <= -DECISIVE_GAP) return { text: "期待値ほど決めきれず", tone: "text-danger" };
  return { text: "ほぼ期待どおり", tone: "text-muted" };
}

function Side({
  team,
  goals,
  xg,
  align,
}: {
  team: Team;
  goals: number;
  xg: number;
  align: "left" | "right";
}) {
  const delta = goals - xg;
  const { text, tone } = verdict(delta);
  const side = align === "right" ? "items-end text-right" : "items-start text-left";

  return (
    // `min-w-0` is load-bearing: a nowrap name's min-content width is the whole
    // name, and that width becomes the minimum of a `1fr` grid track, which is
    // how コヴェントリー・シティ pushed the page to 394px at 375. Wrapping the
    // name — rather than truncating it — is the same answer the player cards
    // and the pitch labels reached: 104px of track against 131px of name, and a
    // club is not identifiable from コヴェントリー・シ…. The badge is
    // `shrink-0`, so the name is the only thing that gives way.
    <div className={`flex min-w-0 flex-col gap-2 ${side}`}>
      {/* Two lines of 15px, reserved whether or not the name needs them: without
          it チェルシー sits on one line, ブライトン＆ホーヴ・アルビオン on two,
          and the two xG numbers — the largest thing in the widget, meant to be
          read against each other — stop sharing a baseline. */}
      <span className="flex min-h-[30px] min-w-0 max-w-full items-center gap-2">
        {align === "left" && <TeamBadge team={team} size={22} />}
        <span className="line-clamp-2 text-xs font-medium leading-tight text-foreground">
          {clubName(team)}
        </span>
        {align === "right" && <TeamBadge team={team} size={22} />}
      </span>
      <span className="flex items-baseline gap-2">
        <span className="font-[family-name:var(--font-display)] text-3xl font-bold leading-none tabular-nums text-foreground">
          {xg.toFixed(2)}
        </span>
        <span className="text-[11px] text-muted">xG</span>
      </span>
      <span className="text-[11px] leading-tight text-muted">
        実際は<span className="mx-1 font-[family-name:var(--font-display)] text-sm font-bold tabular-nums text-foreground">{goals}</span>得点
      </span>
      <span className={`font-[family-name:var(--font-display)] text-xs font-bold tabular-nums ${tone}`}>
        {signed(delta)}
      </span>
      <span className={`text-[11px] leading-tight ${tone}`}>{text}</span>
    </div>
  );
}

/**
 * Whether the scoreline was deserved, in the only terms the data supports.
 *
 * A scoreline says who won. It does not say whether the winner created more, and
 * that is usually the interesting half — Hull beating Manchester United 2-0 off
 * 1.01 expected goals against 1.83 is a different match from the one the score
 * describes. This block leads the statistics because it is the one figure that
 * changes how the ninety minutes read, and the rest of the numbers are detail
 * underneath it.
 *
 * It also refuses to overclaim: xG is a model's estimate, one match is a sample
 * of one, and an own goal is a goal no model attributed to anybody. All three
 * are said out loud rather than left for the reader to discover.
 */
export default function MatchExpectedGoals({
  match,
  statistics,
  events,
  homeTeam,
  awayTeam,
}: {
  match: Match;
  statistics: MatchStatistics;
  events?: MatchEvent[];
  homeTeam: Team;
  awayTeam: Team;
}) {
  const homeXg = xgFor(statistics, "homeTeam");
  const awayXg = xgFor(statistics, "awayTeam");
  const homeGoals = match.homeGoals;
  const awayGoals = match.awayGoals;
  if (homeXg == null || awayXg == null || homeGoals == null || awayGoals == null) return null;

  const hasOwnGoal = (events ?? []).some((e) => e.type === "Own Goal");

  // The one sentence worth having: did the side that created more actually win?
  const xgLeader = homeXg > awayXg ? homeTeam : awayTeam;
  const xgGap = Math.abs(homeXg - awayXg);
  const winner = homeGoals > awayGoals ? homeTeam : awayGoals > homeGoals ? awayTeam : null;
  const headline = !winner
    ? `引き分け。チャンスの量では${clubName(xgLeader)}が${xgGap.toFixed(2)}上回っていた。`
    : winner.id === xgLeader.id
      ? `チャンスの量でも${clubName(xgLeader)}が上回っており、スコアと内容は一致している。`
      : `チャンスの量で上回ったのは${clubName(xgLeader)}だが、勝ったのは${clubName(winner)}。`;

  return (
    <div className="glass rounded-xl p-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <Side team={homeTeam} goals={homeGoals} xg={homeXg} align="left" />
        <span className="mt-8 text-[10px] text-muted">対</span>
        <Side team={awayTeam} goals={awayGoals} xg={awayXg} align="right" />
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[13px] leading-relaxed text-foreground">
        {headline}
      </p>

      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        xG（期待得点）は、シュートの位置や状況から平均的にどれだけ得点が見込めたかを推定した値です。1試合単位ではぶれるため、これだけで優劣は決まりません。
        {hasOwnGoal && "この試合にはオウンゴールが含まれます。オウンゴールはどちらのxGにも計上されません。"}
      </p>
    </div>
  );
}
