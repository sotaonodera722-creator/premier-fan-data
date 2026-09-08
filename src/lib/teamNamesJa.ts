// Japanese club names, keyed by the football-data.org team id.
//
// Both forms are in use across the site. That was not always true: `short` was
// held back while the standings table and fixtures list still truncated club
// names at 375px, and the note here said so long after those layouts had been
// rebuilt — which is its own small trap, since the next person to read it stops
// looking for the English names still on the screen.
//
// The width problem the note described is real and has not gone away. A Japanese
// name runs about 1.6x the pixel width of its English counterpart —
// 「ブレントフォード」is eight full-width characters against Brentford's ten
// half-width ones — so any layout that fitted the English name may not fit this
// one. Two of them did not: the head-to-head summary broke the club name across
// two lines, and its list of past meetings truncated it. Both had to be
// restructured. Check the 375px width when putting either form somewhere new.
//
// English names deliberately remain in two places, under the Japanese name and
// set smaller: the standings table and the club cards on /teams. Those are
// bilingual pairs, not untranslated strings.
//
// Conventions settled with the user: ヴ over ブ/バ throughout (リヴァプール,
// エヴァートン, アストン・ヴィラ, コヴェントリー); マンC / マンU for the two
// Manchester clubs, which is what Japanese football coverage uses and keeps them
// apart at a glance; and the short forms follow how each club is actually spoken
// about rather than always keeping the place name (パレス, フォレスト, ヴィラ, ハル).

export interface TeamNameJa {
  full: string;
  short: string;
}

const TEAM_NAMES_JA: Record<number, TeamNameJa> = {
  65: { full: "マンチェスター・シティ", short: "マンC" },
  57: { full: "アーセナル", short: "アーセナル" },
  322: { full: "ハル・シティ", short: "ハル" },
  61: { full: "チェルシー", short: "チェルシー" },
  402: { full: "ブレントフォード", short: "ブレントフォード" },
  64: { full: "リヴァプール", short: "リヴァプール" },
  67: { full: "ニューカッスル・ユナイテッド", short: "ニューカッスル" },
  62: { full: "エヴァートン", short: "エヴァートン" },
  341: { full: "リーズ・ユナイテッド", short: "リーズ" },
  397: { full: "ブライトン＆ホーヴ・アルビオン", short: "ブライトン" },
  66: { full: "マンチェスター・ユナイテッド", short: "マンU" },
  71: { full: "サンダーランド", short: "サンダーランド" },
  349: { full: "イプスウィッチ・タウン", short: "イプスウィッチ" },
  354: { full: "クリスタル・パレス", short: "パレス" },
  1044: { full: "ボーンマス", short: "ボーンマス" },
  351: { full: "ノッティンガム・フォレスト", short: "フォレスト" },
  58: { full: "アストン・ヴィラ", short: "ヴィラ" },
  73: { full: "トッテナム・ホットスパー", short: "トッテナム" },
  63: { full: "フラム", short: "フラム" },
  1076: { full: "コヴェントリー・シティ", short: "コヴェントリー" },

  // Relegated in May, so not in this season's twenty and not in teams.json — but
  // "昨季から何が変わったか" names them, and a reader who left in the spring is
  // the one most likely to be looking for them. A club leaving the division is
  // no reason for its name to revert to English.
  563: { full: "ウェスト・ハム・ユナイテッド", short: "ウェスト・ハム" },
  328: { full: "バーンリー", short: "バーンリー" },
  76: { full: "ウルヴァーハンプトン・ワンダラーズ", short: "ウルヴァーハンプトン" },
};

// Returns undefined for a club we have no translation for — a promoted side the
// table hasn't caught up with, say — so callers fall back to the English name
// rather than rendering a blank heading.
export function getTeamNameJa(teamId: number): TeamNameJa | undefined {
  return TEAM_NAMES_JA[teamId];
}

/**
 * The name to print where space is tight — beside a crest, in a table row, in a
 * legend. Falls back to the English short name for a club we have no entry for.
 *
 * The same three lines had been written out in each component that needed them;
 * having one of them drift is how a single screen ends up half-translated.
 */
export function teamNameShort(team: { id: number; shortName: string }): string {
  return getTeamNameJa(team.id)?.short ?? team.shortName;
}

/** The full name, for headings and page titles where the width is not fought over. */
export function teamNameFull(team: { id: number; name: string }): string {
  return getTeamNameJa(team.id)?.full ?? team.name;
}
