// Kanji names for the Japanese players in the league, keyed by football-data.org
// player id.
//
// This deliberately does NOT replace `Player.name`. The season's minutes, goals
// and assists are derived by matching lineup and event names against that field
// (see resolveRosterPlayer / getPlayerAppearances in data.ts), and those feeds
// spell everyone in Latin script. Overwriting `name` with kanji would silently
// zero out every Japanese player's appearance record — the exact figures the
// homepage leads with. Display code reads `nameJa` and falls back to `name`.
//
// Only these nine are translated. The other 539 players stay in Latin script
// until there's a source for their katakana that doesn't involve transliterating
// 500-odd names by hand and getting some of them wrong.

const PLAYER_NAMES_JA: Record<number, string> = {
  118920: "鈴木彩艶",
  3269: "遠藤航",
  49092: "守田英正",
  49105: "田中碧",
  44017: "前田大然",
  9034: "冨安健洋",
  6716: "鎌田大地",
  132707: "三笘薫",
  113632: "坂元達裕",
};

export function getPlayerNameJa(playerId: number): string | undefined {
  return PLAYER_NAMES_JA[playerId];
}
