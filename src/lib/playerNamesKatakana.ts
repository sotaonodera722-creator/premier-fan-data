/**
 * Katakana renderings for the players whose names reach a match page, keyed by
 * football-data.org player id.
 *
 * Like `playerNamesJa.ts`, this deliberately does NOT replace `Player.name`.
 * Minutes, goals and assists are all derived by matching lineup and event names
 * against that field, and every feed spells players in Latin script — overwrite
 * it and the whole appearance record goes quietly to zero. Display code reads
 * `nameJa`; matching reads `name`. `npm run audit` fails if the two are ever
 * confused.
 *
 * Written by hand, one at a time. Machine transliteration produces plausible
 * nonsense at scale, and a misspelt person reads worse than an untranslated one,
 * so anyone not listed here stays in Latin script and every display already
 * falls back to it.
 *
 * Scope is the 438 players named in a lineup we hold. The remaining 110 in the
 * roster never appear on a match page; they get a rendering when they play.
 */

const PLAYER_NAMES_KATAKANA: Record<number, string> = {
  // Aston Villa
  3492: "ヴィクトル・ニルソン・リンデロフ",
  // Bournemouth
  41381: "ミケーレ・ディ・グレゴリオ",
  // Brentford
  144530: "ハウコン・ラフン・ヴァルディマルソン",
  193633: "エル・ハジ・マリック・ディウフ",
  // Brighton & Hove Albion
  264300: "ハラランボス・コストゥラス",
  // Coventry City
  6389: "ブランドン・トーマス＝アサンテ",
  // Crystal Palace
  641: "ジャン＝フィリップ・マテタ",
  213269: "ヨルゲン・ストランド・ラーセン",
  // Everton
  7792: "エインズリー・メイトランド＝ナイルズ",
  140194: "キアナン・デューズベリー＝ホール",
  // Hull City
  170812: "コンスタンティノス・ゾラキス",
  // Leeds United
  7839: "ドミニク・カルヴァート＝ルーウィン",
  // Liverpool
  84506: "ギオルギ・ママルダシュヴィリ",
  // Manchester City
  1731: "ジャンルイジ・ドンナルンマ",
  // Newcastle United
  213511: "マティアス・フェルナンデス＝パルド",
};

export function getPlayerNameKatakana(playerId: number): string | undefined {
  return PLAYER_NAMES_KATAKANA[playerId];
}

/** Everyone we hold a katakana rendering for, so the audit can count the gap. */
export function katakanaPlayerIds(): number[] {
  return Object.keys(PLAYER_NAMES_KATAKANA).map(Number);
}
