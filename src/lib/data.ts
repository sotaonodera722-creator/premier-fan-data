import teamsJson from "@/data/teams.json";
import playersJson from "@/data/players.json";
import matchesJson from "@/data/matches.json";
import lineupsJson from "@/data/lineups.json";
import h2hJson from "@/data/h2h.json";
import type {
  Team,
  Player,
  MatchesFile,
  Match,
  MatchResultLetter,
  LineupsFile,
  MatchLineup,
  HeadToHead,
  HeadToHeadFile,
  PlayerAppearance,
} from "@/lib/types";

const teams = teamsJson as Team[];
const players = playersJson as Player[];
const matchesFile = matchesJson as MatchesFile;
const lineupsFile = lineupsJson as LineupsFile;
const h2hFile = h2hJson as HeadToHeadFile;

export function getTeams(): Team[] {
  return teams;
}

export function getTeamById(id: number): Team | undefined {
  return teams.find((t) => t.id === id);
}

export function getStandings(): Team[] {
  return [...teams].sort((a, b) => (a.record?.position ?? 99) - (b.record?.position ?? 99));
}

// Raw roster rows, before goals/assists are overlaid with match-event derived counts.
// Used internally (name resolution) to avoid a circular dependency with getPlayers().
function rawPlayersByTeam(teamId: number): Player[] {
  return players.filter((p) => p.teamId === teamId);
}

// players.json's own goals/assists fields only cover the ~50 players on the official
// top-scorer list. Overlays them with counts derived from match events (every player
// who has actually appeared in a covered match gets a real 0-or-more value instead of
// null), which is both more accurate and covers far more players.
export function getPlayers(): Player[] {
  const minutesMap = getPlayerMinutesMap();
  const contributions = getPlayerGoalContributionsMap();
  return players.map((p) => {
    if (!minutesMap.has(p.id)) return p;
    const c = contributions.get(p.id);
    return { ...p, goals: c?.goals ?? 0, assists: c?.assists ?? 0 };
  });
}

export function getPlayerById(id: number): Player | undefined {
  return getPlayers().find((p) => p.id === id);
}

export function getPlayersByTeam(teamId: number): Player[] {
  return getPlayers().filter((p) => p.teamId === teamId);
}

export function getJapanesePlayers(): Player[] {
  return getPlayers().filter((p) => p.isJapanese);
}

export function getTopScorers(limit = 10): Player[] {
  return getPlayers()
    .filter((p) => (p.goals ?? 0) > 0)
    .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))
    .slice(0, limit);
}

export function getTopAssists(limit = 10): Player[] {
  return getPlayers()
    .filter((p) => (p.assists ?? 0) > 0)
    .sort((a, b) => (b.assists ?? 0) - (a.assists ?? 0))
    .slice(0, limit);
}

export function getTopGoalContributions(limit = 10): Player[] {
  return getPlayers()
    .filter((p) => (p.goals ?? 0) > 0 || (p.assists ?? 0) > 0)
    .sort((a, b) => (b.goals ?? 0) + (b.assists ?? 0) - ((a.goals ?? 0) + (a.assists ?? 0)))
    .slice(0, limit);
}

export function getAllMatches(): Match[] {
  return [...matchesFile.matches].sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  );
}

export function getMatchesForTeam(teamId: number): Match[] {
  return matchesFile.matches
    .filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
    .sort((a, b) => a.matchday - b.matchday);
}

export function getCurrentMatchday(): number {
  return matchesFile.meta.currentMatchday ?? 1;
}

export function getCompetitionMeta() {
  return matchesFile.meta;
}

export function getForm(teamId: number, limit = 5): MatchResultLetter[] {
  return getRecentResults(teamId, limit)
    .slice()
    .reverse()
    .map((m) => {
      const isHome = m.homeTeamId === teamId;
      const gf = isHome ? m.homeGoals! : m.awayGoals!;
      const ga = isHome ? m.awayGoals! : m.homeGoals!;
      if (gf > ga) return "W";
      if (gf < ga) return "L";
      return "D";
    });
}

export function getRecentResults(teamId: number, limit = 5): Match[] {
  return getMatchesForTeam(teamId)
    .filter((m) => m.played)
    .slice(-limit)
    .reverse();
}

export function getUpcomingFixtures(teamId: number, limit = 5): Match[] {
  return getMatchesForTeam(teamId)
    .filter((m) => !m.played)
    .slice(0, limit);
}

export function getMatchById(id: number): Match | undefined {
  return matchesFile.matches.find((m) => m.id === id);
}

export function getMatchLineup(matchId: number): MatchLineup | undefined {
  return lineupsFile.lineups[String(matchId)];
}

export function getMatchIdsWithLineups(): number[] {
  return Object.values(lineupsFile.lineups).map((l) => l.matchId);
}

// The most recently completed matchday's results, across every team — used for the
// homepage "latest scores" ticket strip.
export function getLatestResults(limit = 8): Match[] {
  const finished = matchesFile.matches.filter((m) => m.played);
  if (finished.length === 0) return [];
  const latestMatchday = Math.max(...finished.map((m) => m.matchday));
  return finished
    .filter((m) => m.matchday === latestMatchday)
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, limit);
}

export function getGoalsPerGameRanking(limit = 3): { team: Team; value: number }[] {
  return teams
    .filter((t) => (t.record?.played ?? 0) > 0)
    .map((t) => ({ team: t, value: t.record!.goalsFor / t.record!.played }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function getGoalsConcededPerGameRanking(limit = 3): { team: Team; value: number }[] {
  return teams
    .filter((t) => (t.record?.played ?? 0) > 0)
    .map((t) => ({ team: t, value: t.record!.goalsAgainst / t.record!.played }))
    .sort((a, b) => a.value - b.value)
    .slice(0, limit);
}

export function getCleanSheetsRanking(limit = 3): { team: Team; value: number }[] {
  return teams
    .map((t) => {
      const cleanSheets = getRecentResults(t.id, Infinity).filter((m) => {
        const conceded = m.homeTeamId === t.id ? m.awayGoals : m.homeGoals;
        return conceded === 0;
      }).length;
      return { team: t, value: cleanSheets };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

// Averages a per-match team statistic (by its displayName in lineup.statistics,
// e.g. "Possession", "Expected Goals") over whichever of a team's matches we have
// lineup data for. Teams with no covered matches are left out.
export function getTeamStatAverage(
  displayName: string,
  limit = 3,
  ascending = false
): { team: Team; value: number }[] {
  const lineupIds = new Set(getMatchIdsWithLineups());
  return teams
    .map((t) => {
      const values: number[] = [];
      for (const m of getMatchesForTeam(t.id)) {
        if (!lineupIds.has(m.id)) continue;
        const lineup = getMatchLineup(m.id);
        if (!lineup?.statistics) continue;
        const isHome = m.homeTeamId === t.id;
        const side = isHome ? lineup.statistics.homeTeam : lineup.statistics.awayTeam;
        const stat = side.statistics.find((s) => s.displayName === displayName);
        if (stat) values.push(stat.value);
      }
      const value = values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
      return { team: t, value };
    })
    .filter((x): x is { team: Team; value: number } => x.value !== null)
    .sort((a, b) => (ascending ? a.value - b.value : b.value - a.value))
    .slice(0, limit);
}

function h2hKey(a: number, b: number): string {
  return [a, b].sort((x, y) => x - y).join("-");
}

export function getHeadToHead(teamAId: number, teamBId: number): HeadToHead | undefined {
  const stored = h2hFile.headToHead[h2hKey(teamAId, teamBId)];
  if (!stored) return undefined;
  // Stored records always key teamA as the lower team id; reorient to whatever
  // order the caller asked for so teamAWins/teamBWins line up with their teamAId/teamBId.
  if (stored.teamAId === teamAId) return stored;
  return {
    ...stored,
    teamAId,
    teamBId,
    teamAWins: stored.teamBWins,
    teamBWins: stored.teamAWins,
  };
}

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[øØ]/g, "o")
    .replace(/[đĐ]/g, "d")
    .replace(/[łŁ]/g, "l")
    .toLowerCase()
    .trim();
}

// Different endpoints (and even different matches from the same lineup source) give
// player names in inconsistent shapes — full ("Carl Rushworth") or abbreviated
// ("C. Rushworth"). Treats two names as the same player if they're an exact match
// once normalized, or if one is a first-initial + last-name abbreviation of the other.
function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;
  return abbreviatesTo(na, nb) || abbreviatesTo(nb, na);
}

function abbreviatesTo(shortName: string, fullName: string): boolean {
  const shortParts = shortName.replace(/\./g, "").split(/\s+/).filter(Boolean);
  const fullParts = fullName.split(/\s+/).filter(Boolean);
  if (shortParts.length < 2 || fullParts.length < 2) return false;
  const shortLast = shortParts.slice(1).join(" ");
  const fullLast = fullParts.slice(1).join(" ");
  return shortParts[0][0] === fullParts[0][0] && shortLast === fullLast;
}

// Resolves a lineup/event name (full or abbreviated) to one of this team's actual
// player records, since players.json is the one place names are always in full.
// Uses the raw roster (not getPlayers()) to avoid a circular dependency, since
// getPlayers() itself calls into match-event derivation that resolves names.
function resolveRosterPlayer(name: string, teamId: number): Player | undefined {
  return rawPlayersByTeam(teamId).find((p) => namesMatch(p.name, name));
}

// "45", "90+3" -> 45, 90. Stoppage time is dropped, not added, so a full match is
// always exactly 90. Falls back to 0 for anything unparseable.
function parseMinute(raw: string): number {
  const m = raw.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

const FULL_MATCH_MINUTES = 90;

// Rough per-match minutes for everyone who appeared: starters get full time unless
// subbed off, substitutes get the time from their sub-on minute to full time. No
// allowance for red cards or stoppage time. Keyed by player id (resolved against
// each side's actual roster) rather than by name, since lineup names aren't always
// full ("C. Rushworth" some matches, "Carl Rushworth" others).
function computeMatchMinutes(lineup: MatchLineup): Map<number, number> {
  const minutes = new Map<number, number>();
  const events = lineup.events ?? [];
  const fullTime = FULL_MATCH_MINUTES;

  for (const side of [lineup.homeTeam, lineup.awayTeam]) {
    for (const p of side.startXI.flat()) {
      const player = resolveRosterPlayer(p.name, side.teamId);
      if (player) minutes.set(player.id, fullTime);
    }
  }

  for (const e of events) {
    if (e.type !== "Substitution") continue;
    const subMinute = parseMinute(e.minute);
    // event.player left the pitch; event.substitutedFor came on.
    const outPlayer = e.player ? resolveRosterPlayer(e.player, e.teamId) : undefined;
    const inPlayer = e.substitutedFor ? resolveRosterPlayer(e.substitutedFor, e.teamId) : undefined;
    if (outPlayer) minutes.set(outPlayer.id, subMinute);
    if (inPlayer) minutes.set(inPlayer.id, fullTime - subMinute);
  }

  return minutes;
}

// Total season minutes per player, summed across every match we have a lineup for.
export function getPlayerMinutesMap(): Map<number, number> {
  const totals = new Map<number, number>();
  for (const matchId of getMatchIdsWithLineups()) {
    const lineup = getMatchLineup(matchId);
    if (!lineup) continue;
    for (const [playerId, mins] of computeMatchMinutes(lineup)) {
      totals.set(playerId, (totals.get(playerId) ?? 0) + mins);
    }
  }
  return totals;
}

// Goals/assists for one match, keyed by player id. Only "Goal" and "Penalty" events
// count as a personal goal (a converted penalty is its own event, separate from any
// "Goal" entry for the same strike — the two never coexist for one goal). "Own Goal"
// scores for the *other* team and is never credited to anyone's personal tally,
// matching standard football stats convention. "VAR Goal Confirmed/Cancelled" and
// "VAR Penalty Cancelled" are just markers on an existing (or non-existent) entry,
// not new goals, so they're ignored to avoid double-counting.
function computeMatchGoalContributions(lineup: MatchLineup): Map<number, { goals: number; assists: number }> {
  const contributions = new Map<number, { goals: number; assists: number }>();
  const bump = (playerId: number, key: "goals" | "assists") => {
    const cur = contributions.get(playerId) ?? { goals: 0, assists: 0 };
    cur[key] += 1;
    contributions.set(playerId, cur);
  };

  for (const e of lineup.events ?? []) {
    if (e.type !== "Goal" && e.type !== "Penalty") continue;
    const scorer = e.player ? resolveRosterPlayer(e.player, e.teamId) : undefined;
    if (scorer) bump(scorer.id, "goals");
    const assister = e.assist ? resolveRosterPlayer(e.assist, e.teamId) : undefined;
    if (assister) bump(assister.id, "assists");
  }

  return contributions;
}

// Total season goals/assists per player, derived from match events rather than the
// sparse players.json fields (which only cover the official top-scorer list).
export function getPlayerGoalContributionsMap(): Map<number, { goals: number; assists: number }> {
  const totals = new Map<number, { goals: number; assists: number }>();
  for (const matchId of getMatchIdsWithLineups()) {
    const lineup = getMatchLineup(matchId);
    if (!lineup) continue;
    for (const [playerId, c] of computeMatchGoalContributions(lineup)) {
      const cur = totals.get(playerId) ?? { goals: 0, assists: 0 };
      cur.goals += c.goals;
      cur.assists += c.assists;
      totals.set(playerId, cur);
    }
  }
  return totals;
}

export function getTopMinutes(limit = 10): { player: Player; minutes: number }[] {
  const map = getPlayerMinutesMap();
  return [...map.entries()]
    .map(([id, minutes]) => ({ player: getPlayerById(id), minutes }))
    .filter((x): x is { player: Player; minutes: number } => Boolean(x.player))
    .sort((a, b) => b.minutes - a.minutes || a.player.name.localeCompare(b.player.name))
    .slice(0, limit);
}

// Derived from the lineups we've fetched so far (only finished matches with a
// published lineup), matched to our player records by normalized name.
export function getPlayerAppearances(playerId: number): PlayerAppearance[] {
  const player = getPlayerById(playerId);
  if (!player) return [];

  const appearances: PlayerAppearance[] = [];
  for (const m of getRecentResults(player.teamId, Infinity)) {
    const lineup = getMatchLineup(m.id);
    if (!lineup) continue;
    const isHome = m.homeTeamId === player.teamId;
    const side = isHome ? lineup.homeTeam : lineup.awayTeam;
    const inStart = side.startXI.flat().some((p) => namesMatch(p.name, player.name));
    // Only count a bench spot as an appearance if they actually came on — an unused
    // substitute (e.g. a backup keeper) never sets foot on the pitch.
    const cameOnAsSub = (lineup.events ?? []).some(
      (e) => e.type === "Substitution" && e.substitutedFor && namesMatch(e.substitutedFor, player.name)
    );
    const inBench = side.substitutes.some((p) => namesMatch(p.name, player.name)) && cameOnAsSub;
    if (!inStart && !inBench) continue;

    appearances.push({
      matchId: m.id,
      matchday: m.matchday,
      utcDate: m.utcDate,
      opponentId: isHome ? m.awayTeamId : m.homeTeamId,
      isHome,
      homeGoals: m.homeGoals,
      awayGoals: m.awayGoals,
      status: inStart ? "start" : "bench",
    });
  }
  return appearances;
}
