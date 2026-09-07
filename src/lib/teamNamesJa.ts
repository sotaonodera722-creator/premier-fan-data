// Japanese club names, keyed by the football-data.org team id.
//
// Only `full` is in use right now, on the team detail page. The rest of the site
// stays on the English names on purpose: a Japanese short name runs about 1.6x
// the pixel width of its English counterpart (「ブレントフォード」is eight
// full-width characters against Brentford's ten half-width ones), and the
// standings table and fixtures list already truncate club names at 375px. Those
// layouts have to be rebuilt around the wider strings before `short` can be used
// there — until then, swapping them in would make the mobile problem worse.
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
};

// Returns undefined for a club we have no translation for — a promoted side the
// table hasn't caught up with, say — so callers fall back to the English name
// rather than rendering a blank heading.
export function getTeamNameJa(teamId: number): TeamNameJa | undefined {
  return TEAM_NAMES_JA[teamId];
}
