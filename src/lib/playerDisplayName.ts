import { getPlayerNameJa } from "@/lib/playerNamesJa";
import { getPlayerNameKatakana } from "@/lib/playerNamesKatakana";

/**
 * The Japanese rendering of a player's name, or undefined where we have none.
 *
 * One entry point for two hand-written tables — kanji for the Japanese players,
 * katakana for everyone else named in a lineup. Components that reached past it
 * into `playerNamesJa` alone printed nine names in Japanese and the rest in
 * Latin, on the same pitch diagram.
 *
 * This is for display only. Lineup and event names are matched against
 * `Player.name`, which is always Latin and must stay that way — see
 * playerNamesJa.ts, and the invariants that enforce it.
 */
export function playerNameJa(playerId: number): string | undefined {
  return getPlayerNameJa(playerId) ?? getPlayerNameKatakana(playerId);
}

/**
 * Just the family name, for places with room for one word.
 *
 * A pitch diagram gives each player about four characters. ジャンルイジ・
 * ドンナルンマ in that space is ジャンル…, which names nobody; ドンナルンマ is
 * what a reader is looking for and what every formation graphic prints. The
 * separator is the katakana middle dot, so a double-barrelled surname
 * (トーマス＝アサンテ) stays whole. Kanji names have no separator and are short
 * enough to pass through as they are.
 */
export function playerSurnameJa(playerId: number): string | undefined {
  const full = playerNameJa(playerId);
  if (!full) return undefined;
  const parts = full.split("・");
  return parts[parts.length - 1];
}
