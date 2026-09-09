/**
 * Names the feed uses that no rule can turn into the name on the roster.
 *
 * The lineup provider abbreviates a player by the initial of the name he is
 * *known* by rather than the one he is registered under: Newcastle's Valentino
 * Livramento appears as "T. Livramento", for Tino. No amount of fuzzy matching
 * reaches that — the initials genuinely disagree — and loosening the matcher
 * until they meet is how "B. Thomas" started matching Brandon Thomas-Asante and
 * a defender was credited with a team-mate's substitutions (see qa-log R6).
 *
 * So these are written down one at a time instead, keyed by club, because the
 * club is the fence that keeps two players with the same surname apart. Every
 * row must resolve to exactly one player at that club; `npm run audit` fails if
 * one resolves to none or to several.
 *
 * Small on purpose. Of the 64 lineup names that go unmatched today, 63 are not
 * this problem: 43 are players missing from players.json entirely, and 20 have
 * their only same-surname candidate at a different club. Neither is solved by a
 * spelling.
 */

/** Club id → the feed's spelling → the roster player it means. */
const PLAYER_ALIASES: Record<number, Record<string, number>> = {
  // Newcastle United — "Tino" Livramento, registered as Valentino.
  67: {
    "T. Livramento": 168712,
    "Tino Livramento": 168712,
  },
};

export function getAliasedPlayerId(name: string, teamId: number): number | undefined {
  return PLAYER_ALIASES[teamId]?.[name.trim()];
}

/** Every row, so the audit can check each one resolves to exactly one player. */
export function playerAliasEntries(): { teamId: number; alias: string; playerId: number }[] {
  return Object.entries(PLAYER_ALIASES).flatMap(([teamId, aliases]) =>
    Object.entries(aliases).map(([alias, playerId]) => ({ teamId: Number(teamId), alias, playerId }))
  );
}
