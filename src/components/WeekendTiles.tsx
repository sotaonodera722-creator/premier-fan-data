import {
  getJapanesePlayerSummaries,
  getJapaneseRoundSummary,
  getRoundHighlights,
  getTitleRaceSummary,
} from "@/lib/data";
import { getTeamNameJa } from "@/lib/teamNamesJa";
import StatTile from "@/components/StatTile";
import TeamBadge from "@/components/TeamBadge";
import JapaneseSquadDots from "@/components/JapaneseSquadDots";
import type { Team } from "@/lib/types";

function clubLabel(team: Team): string {
  return getTeamNameJa(team.id)?.short ?? team.shortName;
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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        label="日本人選手の出場"
        value={jp.played}
        unit={`/ ${jp.total}人`}
        href="/players"
        footer={<JapaneseSquadDots summaries={summaries} />}
        hint={
          jp.played > 0
            ? `合計${jp.minutes}分${jpInvolvement.length ? `・${jpInvolvement.join("・")}` : ""}${
                jp.pending > 0 ? `／${jp.pending}人はこれから` : ""
              }`
            : jp.pending > 0
              ? `${jp.pending}人の所属クラブはこれから`
              : "この節はまだ出場記録がありません"
        }
      />

      {title ? (
        <StatTile
          label="首位"
          value={clubLabel(title.leader)}
          leading={<TeamBadge team={title.leader} size={30} />}
          href={`/teams/${title.leader.id}`}
          hint={
            title.challenger
              ? title.pointsClear === 0
                ? `勝点${title.points}・${clubLabel(title.challenger)}と同勝点で得失点差の差`
                : `勝点${title.points}・2位の${clubLabel(title.challenger)}に${title.pointsClear}pt差`
              : `勝点${title.points}`
          }
        />
      ) : (
        <StatTile label="首位" value="-" hint="順位データがまだありません" />
      )}

      {highestScoring ? (
        <StatTile
          label="今節いちばん点が入った試合"
          value={`${highestScoring.match.homeGoals}-${highestScoring.match.awayGoals}`}
          unit={`計${highestScoring.goals}点`}
          href={`/matches/${highestScoring.match.id}`}
          hint={`${clubLabel(highestScoring.homeTeam)} 対 ${clubLabel(highestScoring.awayTeam)}`}
        />
      ) : (
        <StatTile label="今節いちばん点が入った試合" value="-" hint="まだ試合が終わっていません" />
      )}

      {biggestUpset ? (
        <StatTile
          label="今節の番狂わせ"
          value={biggestUpset.gap}
          unit="順位差"
          href={`/matches/${biggestUpset.match.id}`}
          hint={`${biggestUpset.winnerRank}位の${clubLabel(biggestUpset.winner)}が${
            biggestUpset.loserRank
          }位の${clubLabel(biggestUpset.loser)}に勝利`}
        />
      ) : (
        <StatTile label="今節の番狂わせ" value="なし" hint="下位が上位を破った試合はありませんでした" />
      )}
    </div>
  );
}
