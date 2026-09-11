import { Fragment } from "react";
import Link from "next/link";
import type { JapanesePlayerSummary, JapaneseRoundStatus, Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import { RelativeDay } from "@/components/RelativeTime";
import { getTeamNameJa } from "@/lib/teamNamesJa";
import { jstShortDate, jstTime, lateNightTag } from "@/lib/datetime";

const ROW =
  "flex min-h-[44px] items-center gap-inline py-inline transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";

// "出場なし" is three different pieces of news, and collapsing them tells a
// reader following one player something that isn't true. The wording here keeps
// them apart, and the order runs from best to worst so the list reads downhill.
const GROUPS: { status: JapaneseRoundStatus; heading: string; note: string }[] = [
  {
    status: "benched",
    heading: "ベンチ入り・出番なし",
    note: "メンバーには入ったが、ピッチには立たなかった選手",
  },
  {
    status: "absent",
    heading: "メンバー外",
    note: "この試合の18人に入らなかった選手（負傷・出場停止かどうかはデータがないため不明）",
  },
  {
    status: "unknown",
    heading: "出場状況が未取得",
    note: "この試合のラインナップをまだ取得できていません",
  },
  {
    status: "pending",
    heading: "所属クラブはこれから",
    note: "この節の試合がまだキックオフしていない選手",
  },
];

// Where a player stands compared with a week ago. The four statuses are ordered
// by how close they put him to the pitch, so a change between them has a
// direction: coming off the bench is progress, dropping out of the squad is not.
const STATUS_LABELS: Record<JapaneseRoundStatus, string> = {
  played: "出場",
  benched: "ベンチ",
  absent: "メンバー外",
  pending: "未消化",
  unknown: "不明",
};

const CLOSENESS_TO_PITCH: Record<JapaneseRoundStatus, number> = {
  played: 2,
  benched: 1,
  absent: 0,
  // Not yet knowable rather than worse — these two compare against nothing.
  pending: -1,
  unknown: -1,
};

const TONE_CLASS = {
  up: "text-success",
  down: "text-danger",
  flat: "text-muted",
} as const;

/** Roughly a substitution. Below this, a minutes change is timing, not selection. */
const MEANINGFUL_MINUTES_CHANGE = 15;

function lastRoundNote(
  summary: JapanesePlayerSummary
): { text: string; tone: keyof typeof TONE_CLASS } | null {
  const prev = summary.previousRound;
  if (!prev) return null;

  const now = summary.roundStatus;
  const nowRank = CLOSENESS_TO_PITCH[now];
  const prevRank = CLOSENESS_TO_PITCH[prev.status];

  // On the pitch in both rounds, so the change worth reporting is how long for.
  if (now === "played" && prev.status === "played") {
    const delta = prev.minutesChange ?? 0;
    const text = delta > 0 ? `前節比 +${delta}分` : delta < 0 ? `前節比 ${delta}分` : "前節比 ±0分";
    // Coming off in stoppage time instead of playing the ninety is not a change
    // in his role, and colouring it as one would put a red mark on noise. Below
    // a substitution's worth of minutes the figure is printed without a verdict.
    const tone = Math.abs(delta) < MEANINGFUL_MINUTES_CHANGE ? "flat" : delta > 0 ? "up" : "down";
    return { text, tone };
  }

  const from = prev.status === "played" ? `出場${prev.minutes}分` : STATUS_LABELS[prev.status];

  // Either nothing has happened yet this round, or he is exactly where he was.
  if (nowRank < 0 || prevRank === nowRank) {
    return {
      text: prev.status === "played" ? `前節は${from}` : `前節も${from}`,
      tone: "flat",
    };
  }

  return { text: `${from} → ${STATUS_LABELS[now]}`, tone: nowRank > prevRank ? "up" : "down" };
}

/** One line answering "is he getting closer to the pitch or further from it?" */
function LastRoundNote({
  summary,
  className = "",
}: {
  summary: JapanesePlayerSummary;
  className?: string;
}) {
  const note = lastRoundNote(summary);
  if (!note) return null;
  return (
    <span className={`whitespace-nowrap text-note leading-tight ${TONE_CLASS[note.tone]} ${className}`}>
      {note.text}
    </span>
  );
}

/**
 * The season so far, for a player who did not take the pitch this round.
 *
 * "今季の出場記録なし" was covering two different seasons. A player who has been
 * in every matchday squad without being used is in his manager's plans and one
 * substitution away from playing; a player who has not been picked at all is
 * not. To someone following one name, that is the whole question.
 */
function seasonSoFar(minutes: number | null, appearances: number, benchedMatches: number): string {
  if (minutes) return `今季 ${appearances}試合・${minutes}分`;
  // No "・出場なし": every group this line appears under already says he did not
  // play, and the longer wording crowded the club name off a 375px row.
  if (benchedMatches > 0) return `今季 ベンチ入り${benchedMatches}試合`;
  return "今季の出場記録なし";
}

function clubLabel(team: Team): string {
  return getTeamNameJa(team.id)?.short ?? team.shortName;
}

function StatPair({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-hair">
      <dt>{label}</dt>
      <dd className={`font-numeral font-strong tabular-nums ${value > 0 ? "text-foreground" : "text-muted"}`}>
        {value}
      </dd>
    </div>
  );
}

/**
 * A player who was on the pitch this round. The minutes are the right-hand
 * figure — the column the rows below share with everyone who wasn't.
 */
function PlayedRow({ summary, teamById }: { summary: JapanesePlayerSummary; teamById: Record<number, Team> }) {
  const { player, round, minutes, appearances } = summary;
  const team = teamById[player.teamId];

  return (
    <li>
      <Link href={`/players/${player.id}`} className={ROW}>
        {team && <TeamBadge team={team} size={20} />}
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-inline">
            <span className="text-body font-strong leading-tight text-foreground">
              {player.nameJa ?? player.name}
            </span>
            <span className="font-numeral text-micro text-muted">{player.position}</span>
          </p>
          <div className="mt-hair flex flex-wrap items-baseline gap-x-inline text-note leading-tight text-muted">
            {team && <span>{clubLabel(team)}</span>}
            <span className="whitespace-nowrap">
              今季 {appearances}試合・{minutes ?? 0}分
            </span>
            <dl className="flex items-baseline gap-inline">
              <StatPair label="得点" value={round?.goals ?? 0} />
              <StatPair label="アシスト" value={round?.assists ?? 0} />
            </dl>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="flex items-baseline justify-end gap-hair">
            <span className="font-numeral text-title font-stat leading-none text-foreground">
              {round?.minutes ?? 0}
            </span>
            <span className="text-micro text-muted">分出場</span>
          </p>
          <LastRoundNote summary={summary} className="mt-hair block" />
        </div>
      </Link>
    </li>
  );
}

/**
 * A player who did not take the pitch. What happened to him this round is
 * already said by the note that compares it with last week — "出場74分 → ベンチ" —
 * so that note moves to the right-hand column, and the season line goes under
 * his name where the other rows keep theirs. The column reads as one without
 * a new label.
 */
function OtherRow({
  summary,
  teamById,
  showKickoff,
}: {
  summary: JapanesePlayerSummary;
  teamById: Record<number, Team>;
  /** Their club has not kicked off yet, so the row says when it does. */
  showKickoff: boolean;
}) {
  const { player, minutes, appearances, benchedMatches, roundMatch } = summary;
  const team = teamById[player.teamId];
  const kickoff = showKickoff && roundMatch ? roundMatch : null;

  return (
    <li>
      <Link href={`/players/${player.id}`} className={ROW}>
        {team && <TeamBadge team={team} size={20} />}
        <div className="min-w-0 flex-1">
          <p className="text-body leading-tight text-foreground">{player.nameJa ?? player.name}</p>
          <p className="mt-hair flex items-baseline gap-inline text-note leading-tight text-muted">
            <span className="truncate">{team ? clubLabel(team) : ""}</span>
            {kickoff ? (
              <LastRoundNote summary={summary} />
            ) : (
              <span className="shrink-0 whitespace-nowrap tabular-nums">
                {seasonSoFar(minutes, appearances, benchedMatches)}
              </span>
            )}
          </p>
        </div>
        {kickoff ? (
          <span className="shrink-0 text-right text-note leading-tight text-muted">
            <RelativeDay iso={kickoff.utcDate} className="mr-hair text-accent-2" />
            <span className="tabular-nums">{jstShortDate(kickoff.utcDate)}</span>{" "}
            <span className="tabular-nums text-foreground">{jstTime(kickoff.utcDate)}</span>
            {lateNightTag(kickoff.utcDate) && (
              <span className="block text-micro">{lateNightTag(kickoff.utcDate)}</span>
            )}
          </span>
        ) : (
          <LastRoundNote summary={summary} className="shrink-0 text-right" />
        )}
      </Link>
    </li>
  );
}

/**
 * All nine in one table.
 *
 * The four who played had cards and the other five had a different-shaped list
 * underneath, so the one comparison a reader comes for — who played, who sat,
 * who was not picked — ran across three layouts. One list with one right-hand
 * column puts "90分出場" and "出場74分 → ベンチ" on the same vertical, and the
 * weekend reads top to bottom.
 */
export default function JapanesePlayersSection({
  summaries,
  matchday,
  teamById,
}: {
  summaries: JapanesePlayerSummary[];
  matchday: number;
  teamById: Record<number, Team>;
}) {
  const played = summaries.filter((s) => s.roundStatus === "played");

  if (summaries.length === 0) {
    return (
      <p className="text-body text-muted">
        プレミアリーグに在籍する日本人選手のデータが見つかりませんでした。
      </p>
    );
  }

  return (
    <div>
      {played.length > 0 ? (
        // Each card said which round its minutes were from. In one table the
        // column says it once, above the figures it applies to.
        <p className="pb-hair text-right text-micro text-muted">第{matchday}節</p>
      ) : (
        <p className="pb-inline text-body text-muted">
          第{matchday}節でピッチに立った日本人選手はまだいません。
        </p>
      )}

      <ul className="divide-y divide-border">
        {played.map((summary) => (
          <PlayedRow key={summary.player.id} summary={summary} teamById={teamById} />
        ))}

        {GROUPS.map((group) => {
          const players = summaries.filter((s) => s.roundStatus === group.status);
          if (players.length === 0) return null;
          return (
            <Fragment key={group.status}>
              <li className="pb-inline pt-heading">
                <h3 className="text-body font-strong text-foreground">
                  {group.heading}
                  <span className="ml-inline font-body tabular-nums text-muted">{players.length}人</span>
                </h3>
                <p className="mt-hair text-note text-muted">{group.note}</p>
              </li>
              {players.map((summary) => (
                <OtherRow
                  key={summary.player.id}
                  summary={summary}
                  teamById={teamById}
                  showKickoff={group.status === "pending"}
                />
              ))}
            </Fragment>
          );
        })}
      </ul>
    </div>
  );
}
