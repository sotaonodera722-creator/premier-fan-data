import Link from "next/link";
import {
  getJapanesePlayerSummaries,
  getJapaneseRoundSummary,
  getRoundHighlights,
  getTitleRaceSummary,
} from "@/lib/data";
import { getTeamNameJa } from "@/lib/teamNamesJa";
import TeamBadge from "@/components/TeamBadge";
import JapaneseSquadDots from "@/components/JapaneseSquadDots";
import type { Team } from "@/lib/types";

function clubLabel(team: Team): string {
  return getTeamNameJa(team.id)?.short ?? team.shortName;
}

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Three sizes, and the size says what kind of value it is. 52px is kept for the
// one figure the page opens to answer; 34px for a figure; a club name or a word
// like なし is text and stays at the heading step, because a word set as large
// as a number is decoration pretending to be data.
const HERO_FIGURE = "font-numeral text-stat-xl font-stat text-foreground";
const FIGURE = "font-numeral text-stat font-stat text-foreground";
const WORD = "text-title font-strong text-foreground";

/**
 * One of the four, with no panel around it.
 *
 * They were four identical tiles, which said all four mattered equally. They
 * don't: the page exists for the first. Size carries that now, and space does
 * the separating the borders did. The negative margin lets the hover fill
 * reach past the text without moving the text off the page's left edge.
 */
function Point({
  label,
  href,
  hint,
  className = "",
  children,
}: {
  label: string;
  href?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const inner = (
    <>
      <p className="text-micro font-label text-muted">{label}</p>
      {children}
      {hint && <p className="mt-hair text-micro text-muted">{hint}</p>}
    </>
  );
  if (!href) return <div className={`-m-inline p-inline ${className}`}>{inner}</div>;
  return (
    <Link href={href} className={`-m-inline block p-inline transition hover:bg-surface-2 ${FOCUS_RING} ${className}`}>
      {inner}
    </Link>
  );
}

// These four replaced a row of league-wide aggregates — total goals, matches
// played, goals per game. Those numbers were true and told a reader nothing they
// had come here to find out. Each of these answers a question someone actually
// arrives with: did the Japanese players feature, who is on top and by how much,
// what was worth watching, and what went against form.
export default function WeekendTiles() {
  const summaries = getJapanesePlayerSummaries();
  const jp = getJapaneseRoundSummary();
  const { highestScoring, biggestUpset } = getRoundHighlights();
  const title = getTitleRaceSummary();

  const jpInvolvement = [
    jp.goals > 0 ? `${jp.goals}ゴール` : null,
    jp.assists > 0 ? `${jp.assists}アシスト` : null,
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-2 gap-x-panel gap-y-heading lg:grid-cols-4">
      <Point
        label="日本人選手の出場"
        href="/players"
        className="col-span-2 lg:col-span-1"
        hint={
          jp.played > 0
            ? `合計${jp.minutes}分${jpInvolvement.length ? `・${jpInvolvement.join("・")}` : ""}`
            : jp.pending > 0
              ? "所属クラブの試合がこれから始まります"
              : "この節はまだ出場記録がありません"
        }
      >
        <p className="mt-hair flex items-baseline gap-hair">
          <span className={HERO_FIGURE}>{jp.played}</span>
          <span className="text-note text-muted">{`/ ${jp.total}人`}</span>
        </p>
        <JapaneseSquadDots summaries={summaries} />
      </Point>

      {title ? (
        <Point
          label="首位"
          href={`/teams/${title.leader.id}`}
          hint={
            title.challenger
              ? title.pointsClear === 0
                ? `勝点${title.points}・${clubLabel(title.challenger)}と同勝点で得失点差の差`
                : `勝点${title.points}・2位の${clubLabel(title.challenger)}に${title.pointsClear}pt差`
              : `勝点${title.points}`
          }
        >
          <p className="mt-hair flex items-center gap-inline">
            <TeamBadge team={title.leader} size={30} />
            <span className={WORD}>{clubLabel(title.leader)}</span>
          </p>
        </Point>
      ) : (
        <Point label="首位" hint="順位データがまだありません">
          <p className={`mt-hair ${WORD}`}>-</p>
        </Point>
      )}

      {highestScoring ? (
        <Point
          label="今節いちばん点が入った試合"
          href={`/matches/${highestScoring.match.id}`}
          hint={`${clubLabel(highestScoring.homeTeam)} 対 ${clubLabel(highestScoring.awayTeam)}`}
        >
          <p className="mt-hair flex items-center gap-inline">
            <span className="flex shrink-0 items-center -space-x-1">
              <TeamBadge team={highestScoring.homeTeam} size={24} />
              <TeamBadge team={highestScoring.awayTeam} size={24} />
            </span>
            <span className="flex items-baseline gap-hair">
              <span className={FIGURE}>{`${highestScoring.match.homeGoals}-${highestScoring.match.awayGoals}`}</span>
              <span className="text-note text-muted">{`計${highestScoring.goals}点`}</span>
            </span>
          </p>
        </Point>
      ) : (
        <Point label="今節いちばん点が入った試合" hint="まだ試合が終わっていません">
          <p className={`mt-hair ${WORD}`}>-</p>
        </Point>
      )}

      {biggestUpset ? (
        <Point
          label="今節の番狂わせ"
          href={`/matches/${biggestUpset.match.id}`}
          className="col-span-2 lg:col-span-1"
          hint={`${biggestUpset.winnerRank}位の${clubLabel(biggestUpset.winner)}が${
            biggestUpset.loserRank
          }位の${clubLabel(biggestUpset.loser)}に勝利`}
        >
          <p className="mt-hair flex items-center gap-inline">
            <TeamBadge team={biggestUpset.winner} size={24} />
            <span className="flex items-baseline gap-hair">
              <span className={FIGURE}>{biggestUpset.gap}</span>
              <span className="text-note text-muted">順位差</span>
            </span>
          </p>
        </Point>
      ) : (
        <Point
          label="今節の番狂わせ"
          className="col-span-2 lg:col-span-1"
          hint="下位が上位を破った試合はありませんでした"
        >
          <p className={`mt-hair ${WORD}`}>なし</p>
        </Point>
      )}
    </div>
  );
}
