/**
 * Machine-checkable truths about the data and everything derived from it.
 *
 * Why this exists: `src/data/*.json` is rewritten by a GitHub Action six times a
 * day with nobody watching, and almost every number on the site is *derived* —
 * minutes are reconstructed by matching lineup names against the roster, the
 * four-state Japanese-player classification is inferred from substitution
 * events. A wrong number renders perfectly. The browser review cannot see it.
 *
 * So the rule for what belongs here: an assertion that would still be true of
 * any correct Premier League season, stated without reference to today's table.
 * "Hull City are second" is not an invariant. "Points equal wins times three
 * plus draws" is.
 *
 *   npm run audit
 */

import {
  getTeams,
  getStandingsTable,
  getAllMatches,
  getPlayers,
  getPlayersByTeam,
  getJapanesePlayers,
  getJapanesePlayerSummaries,
  getJapaneseRoundSummary,
  getSquadUsage,
  getPlayerUsage,
  getMatchIdsWithLineups,
  getMatchLineup,
  getPlayerMinutesMap,
  getHeadToHead,
  getActiveRoundMatches,
  getRoundProgress,
  getCompetitionMeta,
} from "@/lib/data";
import { CHAMPIONS_LEAGUE_SPOTS, EUROPA_LEAGUE_SPOTS, RELEGATION_SPOTS } from "@/lib/leagueRules";
import pastSeasonsJson from "@/data/past-seasons.json";
import playersJson from "@/data/players.json";
import type { PastSeasonsFile, Player } from "@/lib/types";
import { group, check, soft, every, equal, note, report } from "./harness";

const TEAM_COUNT = 20;
const SEASON_MATCHES = 380;
const MATCHDAYS = 38;
const FULL_MATCH = 90;
const XI = 11;

const teams = getTeams();
const matches = getAllMatches();
const players = getPlayers();
const teamName = (id: number) => getTeams().find((t) => t.id === id)?.shortName ?? `#${id}`;

// ---------------------------------------------------------------------------

group("A. クラブの成績表（teams.json）", () => {
  const withRecord = teams.filter((t) => t.record);

  equal("20クラブある", teams.length, TEAM_COUNT);
  equal("全クラブに成績がある", withRecord.length, teams.length);

  every(
    "消化数 = 勝 + 分 + 敗",
    withRecord,
    (t) => t.record!.played === t.record!.wins + t.record!.draws + t.record!.losses,
    (t) => `${t.shortName}: ${t.record!.played} ≠ ${t.record!.wins}+${t.record!.draws}+${t.record!.losses}`
  );

  every(
    "勝点 = 勝×3 + 分",
    withRecord,
    (t) => t.record!.points === t.record!.wins * 3 + t.record!.draws,
    (t) => `${t.shortName}: ${t.record!.points} ≠ ${t.record!.wins}×3+${t.record!.draws}`
  );

  every(
    "得失点差 = 得点 − 失点",
    withRecord,
    (t) => t.record!.goalDiff === t.record!.goalsFor - t.record!.goalsAgainst,
    (t) => `${t.shortName}: ${t.record!.goalDiff} ≠ ${t.record!.goalsFor}−${t.record!.goalsAgainst}`
  );

  // winRate はパーセント（0〜100、小数第1位まで）で保存されている。
  every(
    "勝率が勝÷消化数と一致する",
    withRecord.filter((t) => t.record!.played > 0),
    (t) => Math.abs(t.record!.winRate - (t.record!.wins / t.record!.played) * 100) < 0.05,
    (t) => `${t.shortName}: ${t.record!.winRate}% ≠ ${t.record!.wins}/${t.record!.played}`
  );

  every(
    "勝率が 0〜100 に収まる",
    withRecord,
    (t) => t.record!.winRate >= 0 && t.record!.winRate <= 100,
    (t) => `${t.shortName}: ${t.record!.winRate}`
  );

  every(
    "順位が 1〜20 に収まる",
    withRecord,
    (t) => t.record!.position >= 1 && t.record!.position <= TEAM_COUNT,
    (t) => `${t.shortName}: 順位 ${t.record!.position}`
  );

  every(
    "消化数が 0〜38 に収まる",
    withRecord,
    (t) => t.record!.played >= 0 && t.record!.played <= MATCHDAYS,
    (t) => `${t.shortName}: ${t.record!.played} 試合`
  );

  every("エンブレムのURLがある", teams, (t) => Boolean(t.crest), (t) => `${t.shortName}: crest 未設定`);
  every("3文字略称がある", teams, (t) => Boolean(t.tla), (t) => `${t.shortName}: tla 未設定`);
});

// ---------------------------------------------------------------------------
// The league as a closed system: every match hands out the same goals and points
// to two clubs, so the table's columns have to add up to the fixture list.

group("B. リーグ全体の保存則", () => {
  const played = matches.filter((m) => m.played);
  const draws = played.filter((m) => m.homeGoals === m.awayGoals);
  const decisive = played.length - draws.length;
  const sum = (pick: (t: (typeof teams)[number]) => number) =>
    teams.reduce((acc, t) => acc + (t.record ? pick(t) : 0), 0);

  equal("Σ消化数 = 消化した試合数 × 2", sum((t) => t.record!.played), played.length * 2);
  equal("Σ勝数 = 決着した試合数", sum((t) => t.record!.wins), decisive);
  equal("Σ敗数 = 決着した試合数", sum((t) => t.record!.losses), decisive);
  equal("Σ分数 = 引き分けた試合数 × 2", sum((t) => t.record!.draws), draws.length * 2);
  equal("Σ得点 = Σ失点", sum((t) => t.record!.goalsFor), sum((t) => t.record!.goalsAgainst));
  equal(
    "Σ得点 = 全試合の総得点",
    sum((t) => t.record!.goalsFor),
    played.reduce((acc, m) => acc + m.homeGoals! + m.awayGoals!, 0)
  );
  equal("Σ得失点差 = 0", sum((t) => t.record!.goalDiff), 0);
  equal(
    "Σ勝点 = 決着×3 + 引分×2",
    sum((t) => t.record!.points),
    decisive * 3 + draws.length * 2
  );
});

// ---------------------------------------------------------------------------

group("C. 日程表の構造（matches.json）", () => {
  equal("380試合ある", matches.length, SEASON_MATCHES);
  equal("試合IDが重複していない", new Set(matches.map((m) => m.id)).size, matches.length);

  every(
    "節が 1〜38 に収まる",
    matches,
    (m) => m.matchday >= 1 && m.matchday <= MATCHDAYS,
    (m) => `試合 ${m.id}: 第${m.matchday}節`
  );

  const byMatchday = new Map<number, number>();
  for (const m of matches) byMatchday.set(m.matchday, (byMatchday.get(m.matchday) ?? 0) + 1);
  every(
    "各節が10試合ある",
    [...byMatchday.entries()],
    ([, count]) => count === TEAM_COUNT / 2,
    ([md, count]) => `第${md}節: ${count} 試合`
  );

  const appearances = new Map<number, { home: number; away: number }>();
  for (const m of matches) {
    const h = appearances.get(m.homeTeamId) ?? { home: 0, away: 0 };
    h.home += 1;
    appearances.set(m.homeTeamId, h);
    const a = appearances.get(m.awayTeamId) ?? { home: 0, away: 0 };
    a.away += 1;
    appearances.set(m.awayTeamId, a);
  }
  every(
    "各クラブがホーム19・アウェイ19",
    [...appearances.entries()],
    ([, c]) => c.home === MATCHDAYS / 2 && c.away === MATCHDAYS / 2,
    ([id, c]) => `${teamName(id)}: ホーム${c.home} / アウェイ${c.away}`
  );

  const pairs = matches.map((m) => `${m.homeTeamId}-${m.awayTeamId}`);
  equal("同じホーム＆アウェイの組合せが1度だけ", new Set(pairs).size, matches.length);

  every(
    "自分自身と対戦していない",
    matches,
    (m) => m.homeTeamId !== m.awayTeamId,
    (m) => `試合 ${m.id}: ${teamName(m.homeTeamId)} 対 自分`
  );

  every(
    "対戦相手が実在する20クラブ",
    matches,
    (m) => teams.some((t) => t.id === m.homeTeamId) && teams.some((t) => t.id === m.awayTeamId),
    (m) => `試合 ${m.id}: ${m.homeTeamId} / ${m.awayTeamId} が名簿にない`
  );

  // played と得点の有無がずれると、終わった試合がスコアなしで並ぶか、
  // これからの試合に 0-0 が付く。どちらも読者には「壊れた」に見える。
  every(
    "消化済み ⟺ スコアがある",
    matches,
    (m) => m.played === (m.homeGoals !== null && m.awayGoals !== null),
    (m) => `試合 ${m.id}: played=${m.played} / ${m.homeGoals}-${m.awayGoals}`
  );

  every(
    "スコアが負でない",
    matches.filter((m) => m.played),
    (m) => m.homeGoals! >= 0 && m.awayGoals! >= 0,
    (m) => `試合 ${m.id}: ${m.homeGoals}-${m.awayGoals}`
  );

  every(
    "キックオフ日時が解釈できる",
    matches,
    (m) => !Number.isNaN(new Date(m.utcDate).getTime()),
    (m) => `試合 ${m.id}: utcDate="${m.utcDate}"`
  );
});

// ---------------------------------------------------------------------------

group("D. 選手名簿（players.json）", () => {
  check("選手が1人以上いる", players.length > 0, () => "players.json が空");
  equal("選手IDが重複していない", new Set(players.map((p) => p.id)).size, players.length);

  // S11 の完了条件1。src/lib/playerNamesJa.ts の冒頭が警告しているとおり、`name` を
  // 日本語に置き換えると、ラインナップとイベントの名前照合が全滅し、日本人選手の
  // 出場記録が静かにゼロになる。表示は `nameJa` を読み、照合は `name` を読む —
  // その分離が守られているかを、目視ではなく文字単位で確かめる。
  const rawNames = new Map((playersJson as Player[]).map((p) => [p.id, p.name]));
  every(
    "getPlayers() の name が players.json の name と完全一致する",
    players,
    (p) => rawNames.get(p.id) === p.name,
    (p) => `${p.id}: "${rawNames.get(p.id)}" が "${p.name}" に書き換えられている`
  );

  every(
    "日本語表記が name ではなく nameJa に入っている",
    players,
    (p) => !/[ぁ-んァ-ヶ一-龯]/.test(p.name),
    (p) => `${p.name}: name に日本語が混入している（nameJa に入れること）`
  );

  every(
    "所属クラブが実在する",
    players,
    (p) => teams.some((t) => t.id === p.teamId),
    (p) => `${p.name}: teamId ${p.teamId} が名簿にない`
  );

  every(
    "ポジションが4種のいずれか",
    players,
    (p) => ["GK", "DF", "MF", "FW"].includes(p.position),
    (p) => `${p.name}: position="${p.position}"`
  );

  // 日本人選手の抽出はサイトの入口そのもの。国籍と旗が食い違えば入口が壊れる。
  every(
    "日本人フラグと国籍が一致する",
    players,
    (p) => p.isJapanese === (p.nationality === "Japan"),
    (p) => `${p.name}: isJapanese=${p.isJapanese} / nationality="${p.nationality}"`
  );

  // age は取得時点で計算されて凍結される。基準は「今」ではなく取得時刻でなければ、
  // 取得後に誕生日を迎えた選手が毎回1歳ずれて報告される。
  const ingestedAt = new Date(getCompetitionMeta().lastUpdated).getTime();
  every(
    "年齢が生年月日と整合する（取得時点で±1歳）",
    players.filter((p) => p.age !== null && p.dateOfBirth),
    (p) => {
      const years = (ingestedAt - new Date(p.dateOfBirth).getTime()) / (365.2425 * 24 * 3600 * 1000);
      return Math.abs(years - p.age!) <= 1;
    },
    (p) => `${p.name}: age=${p.age} / 生年月日 ${p.dateOfBirth}`
  );

  every(
    "表示される年齢が 15〜45 に収まる",
    players.filter((p) => p.age !== null),
    (p) => p.age! >= 15 && p.age! <= 45,
    (p) => `${p.name}: ${p.age}歳`
  );

  // 提供元が明らかに誤った生年月日を返している選手。こちらでは直せないので
  // getPlayers() が年齢を落としている（表示は「-」になる）。件数が増えたら気づきたい。
  const rawPlayers = playersJson as Player[];
  const impossibleBirthdays = rawPlayers.filter((p) => {
    const years = (ingestedAt - new Date(p.dateOfBirth).getTime()) / (365.2425 * 24 * 3600 * 1000);
    return !Number.isFinite(years) || years < 15 || years > 45;
  });
  soft(
    "生年月日がありえない選手がいない",
    impossibleBirthdays.length === 0,
    () =>
      `${impossibleBirthdays.length}/${rawPlayers.length} 人（提供元の誤り。年齢は非表示にしている）:\n    ` +
      impossibleBirthdays.map((p) => `${p.name}: ${p.dateOfBirth}`).join("\n    ")
  );

  // 名簿が薄いクラブがあると、そのクラブの序列（「何人中何番手」）が嘘になる。
  every(
    "各クラブに11人以上の登録がある",
    teams,
    (t) => getPlayersByTeam(t.id).length >= XI,
    (t) => `${t.shortName}: ${getPlayersByTeam(t.id).length} 人`
  );

  every(
    "各クラブにGKが1人以上いる",
    teams,
    (t) => getPlayersByTeam(t.id).some((p) => p.position === "GK"),
    (t) => `${t.shortName}: GK 0人`
  );

  const japanese = getJapanesePlayers();
  check("日本人選手が1人以上いる", japanese.length > 0, () => "日本人選手が0人 — サイトの入口が消える");
  note("日本人選手数", `${japanese.length} 人: ${japanese.map((p) => p.nameJa ?? p.name).join(", ")}`);
});

// ---------------------------------------------------------------------------

group("E. 順位表（導出）", () => {
  const table = getStandingsTable();

  equal("20行ある", table.length, TEAM_COUNT);
  equal("順位が重複なく連番", new Set(table.map((r) => r.rank)).size, table.length);
  every(
    "順位が 1〜20 の連番になっている",
    table,
    (r) => r.rank >= 1 && r.rank <= TEAM_COUNT,
    (r) => `${r.team.shortName}: rank ${r.rank}`
  );
  equal("先頭が1位", table[0]?.rank, 1);
  equal("末尾が20位", table[table.length - 1]?.rank, TEAM_COUNT);

  // 上の行が下の行より勝点が少なければ、読者は並び順を信用できなくなる。
  const inversions = table.filter((row, i) => {
    const next = table[i + 1];
    if (!next) return false;
    return (row.team.record?.points ?? 0) < (next.team.record?.points ?? 0);
  });
  every(
    "勝点が上から下へ単調に減る",
    inversions,
    () => false,
    (r) => `${r.rank}位 ${r.team.shortName} の勝点が下位より少ない`
  );

  every(
    "未消化数が負でない",
    table,
    (r) => r.gamesInHand >= 0,
    (r) => `${r.team.shortName}: gamesInHand ${r.gamesInHand}`
  );

  every(
    "同着フラグと同着数が矛盾しない",
    table,
    (r) => r.isTied === r.tiedCount > 1,
    (r) => `${r.team.shortName}: isTied=${r.isTied} / tiedCount=${r.tiedCount}`
  );

  // 過去に「降格圏が3枠のうち2つにしか付かない」不具合を出している箇所。
  equal(
    "CL圏がちょうど4クラブ",
    table.filter((r) => r.zone === "cl").length,
    CHAMPIONS_LEAGUE_SPOTS
  );
  equal("EL圏がちょうど1クラブ", table.filter((r) => r.zone === "el").length, EUROPA_LEAGUE_SPOTS);
  equal(
    "降格圏がちょうど3クラブ",
    table.filter((r) => r.zone === "relegation").length,
    RELEGATION_SPOTS
  );

  every(
    "降格圏は必ず最下位から3クラブ",
    table.filter((r) => r.zone === "relegation"),
    (r) => r.rank > TEAM_COUNT - RELEGATION_SPOTS,
    (r) => `${r.rank}位 ${r.team.shortName} に降格圏バッジが付いている`
  );

  // 順位表が画面に出しているのは `position`（フィードの順位。同着は番号を共有）であり、
  // `rank` は内部の連番。矢印は表示されている数字の移動でなければ検算できないので、
  // 前節順位・変動・表示のすべてが `position` 基準で揃っていることを確認する。
  // 2026-09-09 にこれを `rank` 基準に変えて破綻させた（qa-log R8）。
  every(
    "順位変動が表示されている順位と整合する",
    table.filter((r) => r.previousPosition !== null && r.positionChange !== null && r.position !== null),
    (r) => r.positionChange === r.previousPosition! - r.position!,
    (r) => `${r.team.shortName}: ${r.previousPosition}位 → ${r.position}位 なのに変動 ${r.positionChange}`
  );

  every(
    "前節順位が 1〜20 の範囲に収まる",
    table.filter((r) => r.previousPosition !== null),
    (r) => r.previousPosition! >= 1 && r.previousPosition! <= TEAM_COUNT,
    (r) => `${r.team.shortName}: 前節 ${r.previousPosition}位`
  );

  const tied = table.filter((r) => r.position !== null && r.position !== r.rank);
  note(
    "同着で表示順位と内部連番が異なるクラブ",
    tied.length === 0
      ? "なし"
      : `${tied.length} クラブ: ` +
        tied.map((r) => `${r.team.shortName} 表示${r.position}位/連番${r.rank}`).join(", ")
  );

  every(
    "1節で得た勝点が 0〜3",
    table,
    (r) => r.roundPoints >= 0 && r.roundPoints <= 3,
    (r) => `${r.team.shortName}: roundPoints ${r.roundPoints}`
  );
});

// ---------------------------------------------------------------------------

group("F. スタメン・イベント（lineups.json）", () => {
  const ids = getMatchIdsWithLineups();
  const lineups = ids.map((id) => getMatchLineup(id)!).filter(Boolean);

  check("ラインナップが1件以上ある", lineups.length > 0, () => "lineups.json が空");
  note("ラインナップ被覆", `${lineups.length} / ${matches.filter((m) => m.played).length} 消化試合`);

  every(
    "ラインナップの試合が日程表に存在する",
    lineups,
    (l) => matches.some((m) => m.id === l.matchId),
    (l) => `試合 ${l.matchId} が matches.json にない`
  );

  every(
    "ラインナップがあるのは消化済みの試合のみ",
    lineups,
    (l) => matches.find((m) => m.id === l.matchId)?.played === true,
    (l) => `試合 ${l.matchId} は未消化なのにラインナップがある`
  );

  const sides = lineups.flatMap((l) => [
    { matchId: l.matchId, side: l.homeTeam },
    { matchId: l.matchId, side: l.awayTeam },
  ]);

  every(
    "先発が11人ちょうど",
    sides,
    (s) => s.side.startXI.flat().length === XI,
    (s) => `試合 ${s.matchId} / ${teamName(s.side.teamId)}: ${s.side.startXI.flat().length} 人`
  );

  every(
    "同じ選手が先発と控えに重複していない",
    sides,
    (s) => {
      const squad = [...s.side.startXI.flat(), ...s.side.substitutes];
      return new Set(squad.map((p) => p.id)).size === squad.length;
    },
    (s) => `試合 ${s.matchId} / ${teamName(s.side.teamId)}: メンバーに重複ID`
  );

  every(
    "布陣の数字がフィールドプレーヤー10人分",
    sides.filter((s) => s.side.formation),
    (s) =>
      s.side.formation
        .split("-")
        .map(Number)
        .reduce((a, b) => a + (Number.isFinite(b) ? b : NaN), 0) === XI - 1,
    (s) => `試合 ${s.matchId} / ${teamName(s.side.teamId)}: 布陣 "${s.side.formation}"`
  );

  every(
    "ラインナップの両チームが実際の対戦カードと一致する",
    lineups,
    (l) => {
      const m = matches.find((x) => x.id === l.matchId);
      if (!m) return false;
      const ids = new Set([l.homeTeam.teamId, l.awayTeam.teamId]);
      return ids.has(m.homeTeamId) && ids.has(m.awayTeamId);
    },
    (l) => `試合 ${l.matchId}: ラインナップのクラブが対戦カードと違う`
  );

  const events = lineups.flatMap((l) => (l.events ?? []).map((e) => ({ matchId: l.matchId, e })));
  every(
    "イベントの分が解釈できる",
    events,
    ({ e }) => /\d/.test(e.minute),
    ({ matchId, e }) => `試合 ${matchId}: ${e.type} の minute="${e.minute}"`
  );

  every(
    "イベントのクラブが対戦2クラブのいずれか",
    events,
    ({ matchId, e }) => {
      const l = lineups.find((x) => x.matchId === matchId)!;
      return e.teamId === l.homeTeam.teamId || e.teamId === l.awayTeam.teamId;
    },
    ({ matchId, e }) => `試合 ${matchId}: ${e.type} の teamId=${e.teamId}`
  );

  // 得点イベントの数と最終スコアの一致。オウンゴールは相手の得点として数える。
  const scoreMismatch = lineups.filter((l) => {
    const m = matches.find((x) => x.id === l.matchId);
    if (!m || !m.played || !l.events) return false;
    let home = 0;
    let away = 0;
    for (const e of l.events) {
      const isGoal = e.type === "Goal" || e.type === "Penalty";
      const isOwn = e.type === "Own Goal";
      if (!isGoal && !isOwn) continue;
      const forHome = isOwn ? e.teamId !== m.homeTeamId : e.teamId === m.homeTeamId;
      if (forHome) home += 1;
      else away += 1;
    }
    return home !== m.homeGoals || away !== m.awayGoals;
  });
  soft(
    "得点イベントの合計が最終スコアと一致する",
    scoreMismatch.length === 0,
    () =>
      `${scoreMismatch.length}/${lineups.length} 試合でイベントとスコアが食い違う（提供元の欠損の可能性）:\n    ` +
      scoreMismatch
        .slice(0, 5)
        .map((l) => {
          const m = matches.find((x) => x.id === l.matchId)!;
          return `試合 ${l.matchId} ${teamName(m.homeTeamId)} ${m.homeGoals}-${m.awayGoals} ${teamName(m.awayTeamId)}`;
        })
        .join("\n    ")
  );
});

// ---------------------------------------------------------------------------
// The site's most load-bearing derived number. Minutes are reconstructed, not
// reported: eleven starters are credited 90 each, and a substitution moves time
// from one name to another. That conservation is the check — a team-match whose
// minutes do not total 990 means a substitution's name failed to match, and
// somebody's "レギュラーなのか" answer is quietly wrong.

group("G. 出場時間の導出", () => {
  const perTeam = teams.map((t) => {
    const usage = getSquadUsage(t.id);
    const total = usage.rows.reduce((sum, r) => sum + r.minutes, 0);
    return { team: t, usage, total, expected: usage.coveredMatches * XI * FULL_MATCH };
  });

  const covered = perTeam.filter((p) => p.usage.coveredMatches > 0);
  check("出場時間を算出できる試合がある", covered.length > 0, () => "どのクラブもラインナップ0件");

  // 11人が90分ぶんプレーする、が原則。ずれてよいのは提供元が片側しか記録して
  // いない交代のぶんだけで、その量は導出側が申告する。申告と実測が1分でも食い違えば、
  // それは名前照合か時間計算のバグであって、データの欠損ではない。
  every(
    "クラブの総出場時間 = 被覆試合数 × 11人 × 90分 ± 申告済みのずれ",
    covered,
    (p) => p.total === p.expected + p.usage.imbalance,
    (p) =>
      `${p.team.shortName}: ${p.total}分 ≠ ${p.expected}+${p.usage.imbalance}分 ` +
      `(${p.usage.coveredMatches}試合, 説明できない差 ${p.total - p.expected - p.usage.imbalance}分)`
  );

  const unpaired = covered.filter((p) => p.usage.unpairedSubstitutions > 0);
  const unpairedTotal = unpaired.reduce((s, p) => s + p.usage.unpairedSubstitutions, 0);
  note(
    "片側しか記録されていない交代",
    unpairedTotal === 0
      ? "なし"
      : `${unpairedTotal} 件 / ${unpaired.length} クラブ: ` +
        unpaired.map((p) => `${p.team.shortName} ${p.usage.imbalance > 0 ? "+" : ""}${p.usage.imbalance}分`).join(", ")
  );
  soft(
    "片側しか記録されていない交代が全体の5%未満",
    unpairedTotal <= Math.max(1, covered.reduce((s, p) => s + p.usage.coveredMatches, 0) * 5 * 0.05),
    () => `${unpairedTotal} 件 — 提供元のイベント欠損が増えている`
  );

  every(
    "出場時間が負でない",
    perTeam.flatMap((p) => p.usage.rows.map((r) => ({ team: p.team, row: r }))),
    ({ row }) => row.minutes >= 0,
    ({ team, row }) => `${team.shortName} ${row.name}: ${row.minutes}分`
  );

  every(
    "個人の出場時間がクラブの総試合時間を超えない",
    covered.flatMap((p) => p.usage.rows.map((r) => ({ p, r }))),
    ({ p, r }) => r.minutes <= p.usage.coveredMatches * FULL_MATCH,
    ({ p, r }) => `${p.team.shortName} ${r.name}: ${r.minutes}分 > ${p.usage.coveredMatches * FULL_MATCH}分`
  );

  every(
    "出場割合が 0〜1 に収まる",
    covered.flatMap((p) => p.usage.rows),
    (r) => r.share >= 0 && r.share <= 1,
    (r) => `${r.name}: share ${r.share}`
  );

  every(
    "先発数 + 途中出場数 ≤ 被覆試合数",
    covered.flatMap((p) => p.usage.rows.map((r) => ({ p, r }))),
    ({ p, r }) => r.starts + r.substituteAppearances <= p.usage.coveredMatches,
    ({ p, r }) =>
      `${p.team.shortName} ${r.name}: 先発${r.starts}+途中${r.substituteAppearances} > ${p.usage.coveredMatches}試合`
  );

  // 4つの役割は排他かつ網羅でなければならない。どれにも当てはまらない選手が
  // 出ると、その選手のページから「レギュラーか」の答えだけが消える。
  every(
    "役割分類が4種のいずれか",
    covered.flatMap((p) => p.usage.rows),
    (r) => ["everyPresent", "rotation", "waiting", "unused"].includes(r.role),
    (r) => `${r.name}: role="${r.role}"`
  );

  every(
    "出場0分の選手は unused",
    covered.flatMap((p) => p.usage.rows),
    (r) => r.minutes > 0 || r.role === "unused",
    (r) => `${r.name}: 0分なのに role="${r.role}"`
  );

  every(
    "名簿の全選手がクラブの序列表に1行だけ現れる",
    teams.flatMap((t) => getPlayersByTeam(t.id).map((p) => ({ t, p }))),
    ({ t, p }) => getSquadUsage(t.id).rows.filter((r) => r.player?.id === p.id).length <= 1,
    ({ t, p }) => `${t.shortName} ${p.name}: 序列表に重複`
  );

  // 選手ページの「◯人中◯番手」。分母より大きい順位が出れば、その場で嘘とわかる。
  const usages = players
    .map((p) => ({ p, u: getPlayerUsage(p.id) }))
    .filter((x): x is { p: (typeof players)[number]; u: NonNullable<ReturnType<typeof getPlayerUsage>> } => x.u !== null);
  every(
    "ポジション内順位が母数を超えない",
    usages,
    ({ u }) => u.positionRank <= u.positionTotal,
    ({ p, u }) => `${p.name}: ${u.positionTotal}人中${u.positionRank}番手`
  );

  every(
    "出場のある選手には順位が付く",
    usages.filter(({ u }) => u.minutes > 0),
    ({ u }) => u.positionRank >= 1,
    ({ p, u }) => `${p.name}: ${u.minutes}分あるのに順位 ${u.positionRank}`
  );

  const minutesMap = getPlayerMinutesMap();
  every(
    "季通算の出場時間が負でない",
    [...minutesMap.entries()],
    ([, mins]) => mins >= 0,
    ([id, mins]) => `選手 ${id}: ${mins}分`
  );

  // 名前照合の取りこぼしは避けられない（提供元が "C. Gakpo" と "Cody Gakpo" を
  // 混在させる）。取りこぼし率そのものは失敗ではないが、急に悪化したら気づきたい。
  const totalSquadMinutes = covered.reduce((s, p) => s + p.expected, 0);
  const rosterMinutes = covered.reduce(
    (s, p) => s + p.usage.rows.filter((r) => r.player).reduce((a, r) => a + r.minutes, 0),
    0
  );
  const coverage = totalSquadMinutes > 0 ? rosterMinutes / totalSquadMinutes : 1;
  note("名簿と照合できた出場時間の割合", `${(coverage * 100).toFixed(1)}%`);
  note(
    "出場時間の総和",
    `理論値 ${totalSquadMinutes.toLocaleString("ja-JP")}分 / うち名簿の選手に紐づく ` +
      `${rosterMinutes.toLocaleString("ja-JP")}分`
  );

  // S11（選手名の日本語化）着手時点の実測値。名前照合が壊れれば真っ先にここが落ちる。
  // 提供元が名簿に無い選手を出してくる分の揺れ（現在43人ぶん）は避けられないので、
  // 明らかな破綻を止める硬い床と、悪化に気づくための柔らかい床を分けて置く。
  const COVERAGE_BASELINE = 0.988;
  check(
    "出場時間の9割以上が名簿の選手に紐づく",
    coverage >= 0.9,
    () =>
      `${(coverage * 100).toFixed(1)}% しか紐づいていない — 名前照合が壊れている疑いが強い` +
      `（S11着手時点は ${(COVERAGE_BASELINE * 100).toFixed(1)}%）`
  );
  soft(
    "照合率が着手時点から悪化していない",
    coverage >= COVERAGE_BASELINE - 0.005,
    () => `${(coverage * 100).toFixed(1)}% — 着手時点の ${(COVERAGE_BASELINE * 100).toFixed(1)}% から下がっている`
  );
});

// ---------------------------------------------------------------------------

group("H. 日本人選手の4状態", () => {
  const summaries = getJapanesePlayerSummaries();
  const valid = ["played", "benched", "absent", "pending", "unknown"];

  check("集計対象がいる", summaries.length > 0, () => "日本人選手のサマリーが0件");

  every(
    "状態が5種のいずれか",
    summaries,
    (s) => valid.includes(s.roundStatus),
    (s) => `${s.player.name}: roundStatus="${s.roundStatus}"`
  );

  every(
    "先発数 ≤ 出場数",
    summaries,
    (s) => s.starts <= s.appearances,
    (s) => `${s.player.name}: 先発${s.starts} > 出場${s.appearances}`
  );

  every(
    "出場・先発が負でない",
    summaries,
    (s) => s.appearances >= 0 && s.starts >= 0,
    (s) => `${s.player.name}: 出場${s.appearances} / 先発${s.starts}`
  );

  // 「出場」と言うからには分数がなければならない。ここが崩れると
  // 「出場」バッジの隣に 0分 が並ぶ。
  every(
    "played なら出場時間が1分以上ある",
    summaries.filter((s) => s.roundStatus === "played"),
    (s) => (s.round?.minutes ?? 0) > 0,
    (s) => `${s.player.name}: played なのに ${s.round?.minutes ?? "null"} 分`
  );

  every(
    "played 以外は今節の出場時間が0",
    summaries.filter((s) => s.roundStatus !== "played"),
    (s) => (s.round?.minutes ?? 0) === 0,
    (s) => `${s.player.name}: ${s.roundStatus} なのに ${s.round?.minutes} 分`
  );

  every(
    "pending なら所属クラブの試合が未消化",
    summaries.filter((s) => s.roundStatus === "pending"),
    (s) => s.roundMatch !== null && !s.roundMatch.played,
    (s) => `${s.player.name}: pending なのに試合は消化済み`
  );

  every(
    "benched / absent は消化済みの試合に対してのみ付く",
    summaries.filter((s) => s.roundStatus === "benched" || s.roundStatus === "absent"),
    (s) => s.roundMatch !== null && s.roundMatch.played,
    (s) => `${s.player.name}: ${s.roundStatus} だが試合が未消化`
  );

  every(
    "通算出場時間は null か0以上",
    summaries,
    (s) => s.minutes === null || s.minutes >= 0,
    (s) => `${s.player.name}: minutes ${s.minutes}`
  );

  // null は「一度もメンバーに入っていない」、0 は「入ったが出ていない」。
  // ここが取り違えられると、サイト全体でこの2つが同じ表示になる。
  every(
    "出場実績があるのに通算時間が null になっていない",
    summaries.filter((s) => s.appearances > 0),
    (s) => s.minutes !== null,
    (s) => `${s.player.name}: 出場${s.appearances}回あるのに minutes=null`
  );

  // ベンチ入りした時点で「メンバーに入っていない」ではなくなる。ここが null のままだと、
  // 3試合ベンチ入りした選手と、一度も招集されていない選手が同じ表示になる。
  every(
    "メンバーに入ったことがある選手の通算時間が null でない",
    summaries.filter((s) => s.roundStatus === "benched" || s.roundStatus === "played"),
    (s) => s.minutes !== null,
    (s) => `${s.player.name}: 今節 ${s.roundStatus} なのに minutes=null`
  );

  every(
    "ベンチ入り試合数が負でない",
    summaries,
    (s) => s.benchedMatches >= 0,
    (s) => `${s.player.name}: benchedMatches ${s.benchedMatches}`
  );

  every(
    "ベンチ入り試合数がクラブの被覆試合数を超えない",
    summaries,
    (s) => s.benchedMatches <= getSquadUsage(s.player.teamId).coveredMatches,
    (s) =>
      `${s.player.name}: ベンチ入り${s.benchedMatches}試合 > 被覆${getSquadUsage(s.player.teamId).coveredMatches}試合`
  );

  // 「今季の出場記録なし」と「ベンチ入り◯試合・出場なし」の出し分けはこの2つに乗っている。
  every(
    "ベンチ入りがあるなら通算時間が null でない",
    summaries.filter((s) => s.benchedMatches > 0),
    (s) => s.minutes !== null,
    (s) => `${s.player.name}: ベンチ入り${s.benchedMatches}試合あるのに minutes=null`
  );

  every(
    "通算時間が null なら一度もメンバーに入っていない",
    summaries.filter((s) => s.minutes === null),
    (s) => s.benchedMatches === 0 && s.appearances === 0,
    (s) => `${s.player.name}: minutes=null なのにベンチ入り${s.benchedMatches}・出場${s.appearances}`
  );

  every(
    "前節比は両方出場のときだけ数値になる",
    summaries.filter((s) => s.previousRound?.minutesChange != null),
    (s) => s.previousRound!.status === "played" && (s.round?.minutes ?? 0) > 0,
    (s) => `${s.player.name}: 前節 ${s.previousRound!.status} なのに増減 ${s.previousRound!.minutesChange}分`
  );

  every(
    "前節比の計算が合っている",
    summaries.filter((s) => s.previousRound?.minutesChange != null),
    (s) => s.previousRound!.minutesChange === (s.round?.minutes ?? 0) - s.previousRound!.minutes,
    (s) =>
      `${s.player.name}: ${s.round?.minutes ?? 0} − ${s.previousRound!.minutes} ≠ ${s.previousRound!.minutesChange}`
  );

  // トップページのタイルはこの内訳をそのまま出す。合計が人数と合わなければ
  // 「9人中10人が出場」のような表示になる。
  const rs = getJapaneseRoundSummary();
  equal("状態の内訳が総数と一致する", rs.played + rs.benched + rs.absent + rs.pending, rs.total);
  equal("総数が日本人選手数と一致する", rs.total, summaries.length);
  every(
    "内訳が負でない",
    [rs.played, rs.benched, rs.absent, rs.pending, rs.minutes, rs.goals, rs.assists],
    (n) => n >= 0,
    (n) => `負の値 ${n}`
  );
});

// ---------------------------------------------------------------------------

group("I. 過去の対戦成績（h2h.json）", () => {
  const pairs: { a: number; b: number; h2h: NonNullable<ReturnType<typeof getHeadToHead>> }[] = [];
  for (let i = 0; i < teams.length; i += 1) {
    for (let j = i + 1; j < teams.length; j += 1) {
      const h2h = getHeadToHead(teams[i].id, teams[j].id);
      if (h2h) pairs.push({ a: teams[i].id, b: teams[j].id, h2h });
    }
  }

  const expectedPairs = (TEAM_COUNT * (TEAM_COUNT - 1)) / 2;
  note("取得済みのペア", `${pairs.length} / ${expectedPairs}`);
  soft(
    "全ペアの対戦成績が揃っている",
    pairs.length === expectedPairs,
    () => `${expectedPairs - pairs.length} ペアが未取得 — 該当カードの試合ページでH2Hが空になる`
  );

  every(
    "勝 + 分 + 敗 = 対戦数",
    pairs,
    ({ h2h }) => h2h.teamAWins + h2h.draws + h2h.teamBWins === h2h.numberOfMatches,
    ({ a, b, h2h }) =>
      `${teamName(a)} 対 ${teamName(b)}: ${h2h.teamAWins}+${h2h.draws}+${h2h.teamBWins} ≠ ${h2h.numberOfMatches}`
  );

  every(
    "対戦数が負でない",
    pairs,
    ({ h2h }) => h2h.numberOfMatches >= 0,
    ({ a, b, h2h }) => `${teamName(a)} 対 ${teamName(b)}: ${h2h.numberOfMatches}`
  );

  every(
    "対戦履歴の件数が対戦数と一致する",
    pairs,
    ({ h2h }) => h2h.matches.length === h2h.numberOfMatches,
    ({ a, b, h2h }) =>
      `${teamName(a)} 対 ${teamName(b)}: 履歴 ${h2h.matches.length} 件 / 対戦数 ${h2h.numberOfMatches}`
  );

  // 保存されている勝敗数を、試合履歴から数え直して突き合わせる。
  every(
    "履歴から数え直した勝敗が保存値と一致する",
    pairs,
    ({ a, h2h }) => {
      let aw = 0;
      let d = 0;
      let bw = 0;
      for (const m of h2h.matches) {
        if (m.homeGoals === m.awayGoals) d += 1;
        else if ((m.homeGoals > m.awayGoals) === (m.homeTeamId === a)) aw += 1;
        else bw += 1;
      }
      return aw === h2h.teamAWins && d === h2h.draws && bw === h2h.teamBWins;
    },
    ({ a, b, h2h }) =>
      `${teamName(a)} 対 ${teamName(b)}: 保存値 ${h2h.teamAWins}-${h2h.draws}-${h2h.teamBWins} が履歴と合わない`
  );

  every(
    "対戦相手の並びが正しい",
    pairs,
    ({ a, b, h2h }) => (h2h.teamAId === a && h2h.teamBId === b) || (h2h.teamAId === b && h2h.teamBId === a),
    ({ a, b, h2h }) => `${teamName(a)} 対 ${teamName(b)}: 保存されたIDが ${h2h.teamAId}/${h2h.teamBId}`
  );
});

// ---------------------------------------------------------------------------

group("J. 昨季の最終順位（past-seasons.json）", () => {
  const file = pastSeasonsJson as PastSeasonsFile;
  const records = Object.values(file.teams);

  check("昨季の記録がある", records.length > 0, () => "past-seasons.json が空");

  every(
    "消化数 = 勝 + 分 + 敗",
    records,
    (r) => r.played === r.wins + r.draws + r.losses,
    (r) => `${r.name}: ${r.played} ≠ ${r.wins}+${r.draws}+${r.losses}`
  );

  every(
    "勝点 = 勝×3 + 分",
    records,
    (r) => r.points === r.wins * 3 + r.draws,
    (r) => `${r.name}: ${r.points} ≠ ${r.wins}×3+${r.draws}`
  );

  every(
    "所属ディビジョンが1部か2部",
    records,
    (r) => r.tier === 1 || r.tier === 2,
    (r) => `${r.name}: tier ${r.tier}`
  );

  every(
    "日本語のディビジョン名がある",
    records,
    (r) => Boolean(r.divisionJa),
    (r) => `${r.name}: divisionJa 未設定`
  );

  for (const tier of [1, 2]) {
    const inTier = records.filter((r) => r.tier === tier);
    if (inTier.length === 0) continue;
    every(
      `${tier}部の順位が重複していない`,
      [inTier],
      (rows) => new Set(rows.map((r) => r.position)).size === rows.length,
      (rows) => `${tier}部 ${rows.length} クラブに順位の重複がある`
    );
  }

  // 今季の20クラブのうち昨季2部だった3クラブ = 昇格組。層Cの浦島太郎問題に
  // 直接効く数字なので、3でなくなったら気づく必要がある。
  const promoted = teams.filter((t) => file.teams[String(t.id)]?.tier === 2);
  const missing = teams.filter((t) => !file.teams[String(t.id)]);
  soft(
    "昇格組が3クラブ特定できる",
    promoted.length === 3,
    () =>
      `${promoted.length} クラブ (${promoted.map((t) => t.shortName).join(", ")})` +
      (missing.length > 0 ? ` / 昨季の記録がない ${missing.length} クラブ: ${missing.map((t) => t.shortName).join(", ")}` : "")
  );
});

// ---------------------------------------------------------------------------
// The failure mode nobody is watching for: the robot commits a refresh in which
// a page's data source has gone empty. Nothing throws, the build passes, and the
// homepage renders a blank rectangle until a human happens to open it.

group("K. 空データへの耐性", () => {
  const meta = getCompetitionMeta();
  check("大会名がある", Boolean(meta.competition), () => "meta.competition が空");
  check("シーズン表記がある", Boolean(meta.season), () => "meta.season が空");
  check(
    "最終更新日時が解釈できる",
    !Number.isNaN(new Date(meta.lastUpdated).getTime()),
    () => `lastUpdated="${meta.lastUpdated}"`
  );

  const age = (Date.now() - new Date(meta.lastUpdated).getTime()) / 3600_000;
  note("データの鮮度", `${age.toFixed(1)} 時間前`);
  soft(
    "24時間以内に更新されている",
    age < 24,
    () => `${age.toFixed(1)} 時間前が最終更新 — 4時間ごとの自動更新が止まっている可能性`
  );

  check(
    "現在の節が 1〜38 に収まる",
    meta.currentMatchday === null || (meta.currentMatchday >= 1 && meta.currentMatchday <= MATCHDAYS),
    () => `currentMatchday=${meta.currentMatchday}`
  );

  // トップページの中心。ここが空になると週末サマリーごと消える。
  const active = getActiveRoundMatches();
  check("トップページに出す今節の試合がある", active.length > 0, () => "getActiveRoundMatches() が空");
  equal("今節が10試合ある", active.length, TEAM_COUNT / 2);

  const progress = getRoundProgress();
  check(
    "節の進捗が 1〜38 の節を指している",
    progress.matchday >= 1 && progress.matchday <= MATCHDAYS,
    () => `matchday=${progress.matchday}`
  );
  equal("消化 + 残り = その節の試合数", progress.played + progress.pending, progress.total);
  equal("残り試合の件数が pending と一致する", progress.remaining.length, progress.pending);
  note(
    "今節の進捗",
    `第${progress.matchday}節 ${progress.played}/${progress.total} 消化、残り ${progress.pending}`
  );

  check("順位表が空でない", getStandingsTable().length > 0, () => "getStandingsTable() が空");
  check("日本人選手セクションが空でない", getJapanesePlayerSummaries().length > 0, () => "サマリーが0件");
  equal("順位表が20クラブのまま", getStandingsTable().length, TEAM_COUNT);
});

process.exit(report("プレミアリーグ・データ監査（不変条件）"));
