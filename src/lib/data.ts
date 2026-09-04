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

export function getPlayers(): Player[] {
  return players;
}

export function getPlayerById(id: number): Player | undefined {
  return players.find((p) => p.id === id);
}

export function getPlayersByTeam(teamId: number): Player[] {
  return players.filter((p) => p.teamId === teamId);
}

export function getJapanesePlayers(): Player[] {
  return players.filter((p) => p.isJapanese);
}

export function getTopScorers(limit = 10): Player[] {
  return players
    .filter((p) => (p.goals ?? 0) > 0)
    .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))
    .slice(0, limit);
}

export function getTopAssists(limit = 10): Player[] {
  return players
    .filter((p) => (p.assists ?? 0) > 0)
    .sort((a, b) => (b.assists ?? 0) - (a.assists ?? 0))
    .slice(0, limit);
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
    .toLowerCase()
    .trim();
}

// Derived from the lineups we've fetched so far (only finished matches with a
// published lineup), matched to our player records by normalized name.
export function getPlayerAppearances(playerId: number): PlayerAppearance[] {
  const player = getPlayerById(playerId);
  if (!player) return [];
  const targetName = normalizeName(player.name);

  const appearances: PlayerAppearance[] = [];
  for (const m of getRecentResults(player.teamId, Infinity)) {
    const lineup = getMatchLineup(m.id);
    if (!lineup) continue;
    const isHome = m.homeTeamId === player.teamId;
    const side = isHome ? lineup.homeTeam : lineup.awayTeam;
    const inStart = side.startXI.flat().some((p) => normalizeName(p.name) === targetName);
    const inBench = side.substitutes.some((p) => normalizeName(p.name) === targetName);
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
