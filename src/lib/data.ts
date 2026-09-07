import teamsJson from "@/data/teams.json";
import playersJson from "@/data/players.json";
import matchesJson from "@/data/matches.json";
import lineupsJson from "@/data/lineups.json";
import h2hJson from "@/data/h2h.json";
import { getPlayerNameJa } from "@/lib/playerNamesJa";
import { getTeamNameJa } from "@/lib/teamNamesJa";
import { zoneForRank } from "@/lib/leagueRules";
import { getClubProfile } from "@/lib/clubProfiles";
import type {
  Team,
  Player,
  MatchesFile,
  Match,
  MatchResultLetter,
  LineupsFile,
  MatchLineup,
  TeamLineup,
  HeadToHead,
  HeadToHeadFile,
  PlayerAppearance,
  JapanesePlayerSummary,
  JapanesePlayerRoundStat,
  JapaneseRoundStatus,
  JapanesePlayerPreviousRound,
  StandingRow,
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
    const nameJa = getPlayerNameJa(p.id);
    const withName = nameJa ? { ...p, nameJa } : p;
    if (!minutesMap.has(p.id)) return withName;
    const c = contributions.get(p.id);
    return { ...withName, goals: c?.goals ?? 0, assists: c?.assists ?? 0 };
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

// Matches the match detail page can render something for: either a finished match
// with real lineup data, or a not-yet-played fixture (shown with a predicted
// lineup instead). A finished match missing lineup data still 404s.
export function getClickableMatchIds(): number[] {
  const upcoming = matchesFile.matches.filter((m) => !m.played).map((m) => m.id);
  return [...getMatchIdsWithLineups(), ...upcoming];
}

// The most recent past match for this team (strictly before `beforeMatchId`'s
// kickoff) that has real lineup data, used to show a "predicted lineup" for a
// fixture that hasn't been played yet. Falls further back automatically if the
// immediately preceding match is missing lineup data.
export function getPredictedLineup(
  teamId: number,
  beforeMatchId: number
): { match: Match; teamLineup: TeamLineup } | undefined {
  const target = getMatchById(beforeMatchId);
  if (!target) return undefined;

  const candidates = getMatchesForTeam(teamId)
    .filter((m) => m.played && m.utcDate < target.utcDate)
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime());

  for (const m of candidates) {
    const lineup = getMatchLineup(m.id);
    if (!lineup) continue;
    const teamLineup =
      lineup.homeTeam.teamId === teamId ? lineup.homeTeam : lineup.awayTeam.teamId === teamId ? lineup.awayTeam : undefined;
    if (teamLineup && teamLineup.startXI.length > 0) return { match: m, teamLineup };
  }
  return undefined;
}

// Every fixture of the "active" matchday — used for the homepage ticket strip.
// The active matchday is the latest one that has kicked off (at least one match
// played) whose predecessor is fully finished; while it's in progress this mixes
// finished matches (shown as scores) with ones still to come (shown as fixtures),
// rather than only trickling in results one at a time as the round plays out.
export function getActiveRoundMatches(): Match[] {
  const all = matchesFile.matches;
  const matchdays = [...new Set(all.map((m) => m.matchday))].sort((a, b) => a - b);

  let active: number | null = null;
  matchdays.forEach((md, i) => {
    const mdMatches = all.filter((m) => m.matchday === md);
    if (!mdMatches.some((m) => m.played)) return;
    const prevMd = i > 0 ? matchdays[i - 1] : null;
    const prevComplete = prevMd == null || all.filter((m) => m.matchday === prevMd).every((m) => m.played);
    if (prevComplete) active = md;
  });

  if (active == null) return [];
  return all
    .filter((m) => m.matchday === active)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
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
    .replace(/ß/g, "ss")
    .toLowerCase()
    .trim();
}

function nameParts(name: string): string[] {
  return name
    .replace(/\./g, "")
    .split(/[\s-]+/)
    .filter(Boolean);
}

// Different endpoints (and even different matches from the same lineup source) give
// player names in inconsistent shapes: full ("Carl Rushworth") or abbreviated
// ("C. Rushworth"), hyphenated or split into separate words ("Dewsbury-Hall" vs
// "Dewsbury Hall"), or as the single name a player is commonly known by ("Alisson",
// "Thiago") instead of their full one. Treats two names as the same player if,
// once normalized, they're an exact match, one is a first-initial + surname
// abbreviation of the other (surname compared as a suffix, so "J. Larsen" matches
// "Jørgen Strand Larsen"), or one is a single word that appears in the other.
function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;
  if (abbreviatesTo(na, nb) || abbreviatesTo(nb, na)) return true;
  if (mononymMatch(na, nb)) return true;
  return transliterationMatch(na, nb);
}

// Last-resort fallback for the same player spelled differently by two data
// providers (e.g. Highlightly's "Yehor Yarmoliuk" vs football-data.org's "Yegor
// Yarmolyuk" — different English transliterations of the same Ukrainian name).
// Only fires for two full (multi-part) names of nearly equal length that are
// within a small edit distance, so it can't casually conflate two different
// players who happen to share a surname.
function transliterationMatch(a: string, b: string): boolean {
  if (nameParts(a).length < 2 || nameParts(b).length < 2) return false;
  if (Math.abs(a.length - b.length) > 2) return false;
  return levenshteinDistance(a, b) <= 2;
}

function levenshteinDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  const curr = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

function abbreviatesTo(shortName: string, fullName: string): boolean {
  const shortParts = nameParts(shortName);
  const fullParts = nameParts(fullName);
  if (shortParts.length < 2 || fullParts.length < 2) return false;
  if (shortParts[0][0] !== fullParts[0][0]) return false;
  const shortLast = shortParts.slice(1).join(" ");
  const fullLast = fullParts.slice(1).join(" ");
  return fullLast === shortLast || fullLast.endsWith(` ${shortLast}`);
}

// One side is a single word (a nickname or mononym like "Beto" or "Thiago") — treat
// it as a match if that word is one of the other, fuller name's parts.
function mononymMatch(a: string, b: string): boolean {
  const aParts = nameParts(a);
  const bParts = nameParts(b);
  if (aParts.length === 1) return bParts.includes(aParts[0]);
  if (bParts.length === 1) return aParts.includes(bParts[0]);
  return false;
}

// Resolves a lineup/event name (full or abbreviated) to one of this team's actual
// player records, since players.json is the one place names are always in full.
// Uses the raw roster (not getPlayers()) to avoid a circular dependency, since
// getPlayers() itself calls into match-event derivation that resolves names.
export function resolveRosterPlayer(name: string, teamId: number): Player | undefined {
  return rawPlayersByTeam(teamId).find((p) => namesMatch(p.name, name));
}

// True if `name` belongs to someone who was actually part of this match's squad
// (starting XI or substitutes bench) — used to tell a real player who's simply
// missing from players.json yet (a just-arrived transfer the season roster hasn't
// caught up with) apart from a name that isn't a player at all (a manager or
// backroom staff member the lineup provider recorded a card against).
export function isKnownMatchParticipant(name: string, teamLineup: TeamLineup): boolean {
  const squadNames = [...teamLineup.startXI.flat(), ...teamLineup.substitutes].map((p) => p.name);
  return squadNames.some((n) => namesMatch(n, name));
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

// Japanese players with the playing time we can actually derive from the lineups
// we hold, ordered so whoever played most is first. Minutes stay null (rather than
// 0) for anyone absent from every covered lineup, so the UI can say "no record"
// instead of implying they were an unused sub.
export function getJapanesePlayerSummaries(): JapanesePlayerSummary[] {
  const minutesMap = getPlayerMinutesMap();
  const latest = getLatestResults();
  const round = getRoundStats(latest.matchday);

  const previousMatchday = latest.matchday - 1;
  const previousStats = previousMatchday >= 1 ? getRoundStats(previousMatchday) : null;
  const previousMatches =
    previousMatchday >= 1 ? matchesFile.matches.filter((m) => m.matchday === previousMatchday) : [];

  return getJapanesePlayers()
    .map((player) => {
      const appearances = getPlayerAppearances(player.id);
      const roundStat = round.get(player.id) ?? null;
      const roundMatch = latest.matches.find(
        (m) => m.homeTeamId === player.teamId || m.awayTeamId === player.teamId
      );
      return {
        player,
        minutes: minutesMap.get(player.id) ?? null,
        appearances: appearances.length,
        starts: appearances.filter((a) => a.status === "start").length,
        round: roundStat,
        roundStatus: resolveRoundStatus(player, roundMatch, roundStat),
        roundMatch: roundMatch ?? null,
        previousRound: previousStats
          ? resolvePreviousRound(player, previousMatchday, previousMatches, previousStats, roundStat)
          : null,
      };
    })
    .sort(compareJapaneseSummaries);
}

// The same player one round back, so the section can report a direction rather
// than a single week's number. The status is resolved by the same rules as the
// current round, so "ベンチ入り → 出場" is a like-for-like comparison; a round we
// hold no lineup for resolves to "unknown" and is dropped instead of guessed at.
function resolvePreviousRound(
  player: Player,
  matchday: number,
  matches: Match[],
  stats: Map<number, JapanesePlayerRoundStat>,
  currentStat: JapanesePlayerRoundStat | null
): JapanesePlayerPreviousRound | null {
  const match = matches.find((m) => m.homeTeamId === player.teamId || m.awayTeamId === player.teamId);
  const stat = stats.get(player.id) ?? null;
  const status = resolveRoundStatus(player, match, stat);
  if (status === "unknown" || status === "pending") return null;

  const minutes = stat?.minutes ?? 0;
  const currentMinutes = currentStat?.minutes ?? 0;
  return {
    matchday,
    status,
    minutes,
    // Only comparable when he was on the pitch in both rounds. "-90分" for a
    // player who was left out reports the drop as an arithmetic detail, which is
    // the least interesting way to say it.
    minutesChange: status === "played" && currentMinutes > 0 ? currentMinutes - minutes : null,
  };
}

// "Did not play" hides three different situations from a reader following one
// player: his club has not kicked off yet, he was on the bench and never used,
// or he was left out of the squad entirely. Only the last one is bad news, so
// they are reported separately.
function resolveRoundStatus(
  player: Player,
  match: Match | undefined,
  roundStat: JapanesePlayerRoundStat | null
): JapaneseRoundStatus {
  if ((roundStat?.minutes ?? 0) > 0) return "played";
  if (!match) return "unknown";
  if (!match.played) return "pending";

  const lineup = getMatchLineup(match.id);
  // A finished match with no lineup can't distinguish an unused substitute from
  // an omission, and guessing either way would be a claim we cannot support.
  if (!lineup) return "unknown";

  const side = match.homeTeamId === player.teamId ? lineup.homeTeam : lineup.awayTeam;
  const named = [...side.startXI.flat(), ...side.substitutes].some((p) =>
    namesMatch(p.name, player.name)
  );
  return named ? "benched" : "absent";
}

// Whoever played most this round leads, then the bench, then the squad
// omissions, and finally the clubs still to play — so the section opens on what
// actually happened and the "still to come" tail reads as a preview.
const ROUND_STATUS_ORDER: Record<JapaneseRoundStatus, number> = {
  played: 0,
  benched: 1,
  absent: 2,
  unknown: 3,
  pending: 4,
};

function compareJapaneseSummaries(a: JapanesePlayerSummary, b: JapanesePlayerSummary): number {
  return (
    ROUND_STATUS_ORDER[a.roundStatus] - ROUND_STATUS_ORDER[b.roundStatus] ||
    (b.round?.minutes ?? -1) - (a.round?.minutes ?? -1) ||
    (b.minutes ?? -1) - (a.minutes ?? -1)
  );
}

// Minutes and goal involvement for a single round, for anyone who took the pitch in
// it. Same derivation as the season-wide maps, just scoped to one matchday so a
// weekend view isn't forced to quote season totals.
function getRoundStats(matchday: number): Map<number, JapanesePlayerRoundStat> {
  const stats = new Map<number, JapanesePlayerRoundStat>();
  for (const m of matchesFile.matches.filter((x) => x.matchday === matchday)) {
    const lineup = getMatchLineup(m.id);
    if (!lineup) continue;
    for (const [playerId, minutes] of computeMatchMinutes(lineup)) {
      const cur = stats.get(playerId) ?? { matchday, minutes: 0, goals: 0, assists: 0 };
      cur.minutes += minutes;
      stats.set(playerId, cur);
    }
    for (const [playerId, c] of computeMatchGoalContributions(lineup)) {
      const cur = stats.get(playerId) ?? { matchday, minutes: 0, goals: 0, assists: 0 };
      cur.goals += c.goals;
      cur.assists += c.assists;
      stats.set(playerId, cur);
    }
  }
  return stats;
}

// The most recent round we have results for, limited to the matches actually
// played. The remaining fixtures in that round are reported as a count instead,
// so the results strip never mixes scores with kickoff times.
export function getLatestResults(): { matches: Match[]; matchday: number; played: number; pending: number } {
  const round = getActiveRoundMatches();
  const played = round.filter((m) => m.played);
  return {
    matches: round,
    matchday: played[0]?.matchday ?? round[0]?.matchday ?? getCurrentMatchday(),
    played: played.length,
    pending: round.length - played.length,
  };
}

// First round with no results yet — what the fixtures list should open on, so it
// shows what is coming rather than repeating the results strip above it.
export function getNextFixtureRound(): number {
  const all = matchesFile.matches;
  const matchdays = [...new Set(all.map((m) => m.matchday))].sort((a, b) => a - b);
  const upcoming = matchdays.find((md) => all.filter((m) => m.matchday === md).every((m) => !m.played));
  return upcoming ?? matchdays[matchdays.length - 1] ?? getCurrentMatchday();
}

// How stale the site is. The three feeds refresh independently and at different
// rates, so a single figure would either overstate or understate one of them.
// The headline is the scores-and-table feed — that is what a reader means by
// "last updated" — and every feed is listed with its own timestamp beside it.
export function getDataFreshness(): {
  lastUpdated: string;
  sources: { label: string; provider: string; lastUpdated: string }[];
} {
  const sources = [
    { label: "試合・順位表・選手", provider: "Football-Data.org", lastUpdated: matchesFile.meta.lastUpdated },
    { label: "ラインナップ・試合イベント", provider: "Highlightly", lastUpdated: lineupsFile.meta.lastUpdated },
    { label: "過去の対戦成績", provider: "Football-Data.org", lastUpdated: h2hFile.meta.lastUpdated },
  ].filter((s) => Boolean(s.lastUpdated));

  return { lastUpdated: matchesFile.meta.lastUpdated, sources };
}

// The denominator behind every season-to-date number on the site. Quoted next to
// aggregates so three rounds of data are never mistaken for a settled season.
export function getSampleSize(): {
  matchday: number;
  playedMatches: number;
  totalMatches: number;
  /** Matches we hold a lineup for — the sample behind minutes and goal involvement. */
  coveredMatches: number;
} {
  const all = matchesFile.matches;
  const played = all.filter((m) => m.played);
  return {
    matchday: getCurrentMatchday(),
    playedMatches: played.length,
    totalMatches: all.length,
    coveredMatches: played.filter((m) => Boolean(getMatchLineup(m.id))).length,
  };
}

// The table as rows, with everything the UI needs to render it honestly.
//
// Two things the raw feed gets wrong on its own. It reports a shared position
// number for clubs it cannot separate — this season two clubs are both "17th",
// so there is no 18th, and a zone test written against that number puts only
// two clubs in a three-club relegation zone. Ranks here are therefore positional
// (1..20, always dense), and the shared number is kept alongside so a tie can be
// shown as a tie. And clubs do not always have the same number of matches
// played, which makes a bare position misleading; games in hand are counted so
// the table can say so.
export function getStandingsTable(): StandingRow[] {
  const sorted = [...teams].sort((a, b) => {
    const ra = a.record;
    const rb = b.record;
    if (!ra || !rb) return (ra ? 0 : 1) - (rb ? 0 : 1);
    return (
      ra.position - rb.position ||
      rb.points - ra.points ||
      rb.goalDiff - ra.goalDiff ||
      rb.goalsFor - ra.goalsFor ||
      a.name.localeCompare(b.name)
    );
  });

  const total = sorted.length;
  const maxPlayed = sorted.reduce((max, t) => Math.max(max, t.record?.played ?? 0), 0);
  const movements = getRoundMovements();

  // Ranks held by each shared position number, so a tie can be reported as one.
  const ranksByPosition = new Map<number, number[]>();
  sorted.forEach((t, index) => {
    const pos = t.record?.position;
    if (pos == null) return;
    const ranks = ranksByPosition.get(pos) ?? [];
    ranks.push(index + 1);
    ranksByPosition.set(pos, ranks);
  });

  return sorted.map((team, index) => {
    const rank = index + 1;
    const position = team.record?.position ?? null;
    const tiedRanks = position == null ? [rank] : (ranksByPosition.get(position) ?? [rank]);
    const zone = zoneForRank(rank, total);
    // A tie matters most when it spans a zone edge: which of the level clubs is
    // "in the drop" then rests on a tiebreak the feed has not applied, so the
    // table has to say the boundary is provisional rather than draw a hard line.
    // Both clubs carry the marker — the one that happens to have sorted above
    // the line is exactly as undecided as the one below it.
    const tieZones = tiedRanks.map((r) => zoneForRank(r, total));
    const tieStraddlesZoneBoundary = tieZones.some((z) => z !== zone);

    return {
      team,
      rank,
      position,
      isTied: tiedRanks.length > 1,
      tiedCount: tiedRanks.length,
      zone,
      provisionalZone: zone ?? tieZones.find((z) => z !== null) ?? null,
      tieStraddlesZoneBoundary,
      played: team.record?.played ?? null,
      gamesInHand: maxPlayed - (team.record?.played ?? maxPlayed),
      previousPosition: movements.get(team.id)?.previousPosition ?? null,
      positionChange: movements.get(team.id)?.change ?? null,
      roundPoints: movements.get(team.id)?.pointsGained ?? 0,
    };
  });
}

// Where the current round stands, in the terms a reader opening the site on a
// Sunday morning is actually in: how much of it is already over, and when the
// rest kicks off. The round is structurally unfinished at that hour — Japanese
// kickoff times run from Saturday evening to Monday small hours — so "this
// weekend" has to mean both halves at once.
export function getRoundProgress(): {
  matchday: number;
  total: number;
  played: number;
  pending: number;
  /** Fixtures still to come in this round, earliest first. */
  remaining: Match[];
  /** First kickoff of the following round, once this one is over. */
  nextRoundKickoff: Match | null;
} {
  const latest = getLatestResults();
  const remaining = latest.matches.filter((m) => !m.played);
  const nextRoundKickoff =
    remaining.length > 0
      ? null
      : (matchesFile.matches
          .filter((m) => m.matchday > latest.matchday)
          .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0] ?? null);
  return {
    matchday: latest.matchday,
    total: latest.matches.length,
    played: latest.played,
    pending: latest.pending,
    remaining,
    nextRoundKickoff,
  };
}

// The round through the eyes of someone who came here for the Japanese players:
// how many of the nine were involved, not how many goals the league scored.
export function getJapaneseRoundSummary(): {
  total: number;
  played: number;
  benched: number;
  absent: number;
  pending: number;
  minutes: number;
  goals: number;
  assists: number;
} {
  const summaries = getJapanesePlayerSummaries();
  const count = (status: JapaneseRoundStatus) =>
    summaries.filter((s) => s.roundStatus === status).length;
  return {
    total: summaries.length,
    played: count("played"),
    benched: count("benched"),
    absent: count("absent") + count("unknown"),
    pending: count("pending"),
    minutes: summaries.reduce((sum, s) => sum + (s.round?.minutes ?? 0), 0),
    goals: summaries.reduce((sum, s) => sum + (s.round?.goals ?? 0), 0),
    assists: summaries.reduce((sum, s) => sum + (s.round?.assists ?? 0), 0),
  };
}

export interface RoundHighlight {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
}

// Two things worth pointing at in a finished round, both picked by rule rather
// than by hand so nothing here depends on someone remembering to write it.
export function getRoundHighlights(): {
  highestScoring: (RoundHighlight & { goals: number }) | null;
  /** The lowest-placed club to beat the highest-placed one, by current table position. */
  biggestUpset:
    | (RoundHighlight & { winner: Team; loser: Team; winnerRank: number; loserRank: number; gap: number })
    | null;
} {
  const played = getLatestResults().matches.filter((m) => m.played);
  const rankByTeam = new Map(getStandingsTable().map((r) => [r.team.id, r.position ?? r.rank]));

  const withTeams = played.flatMap((match) => {
    const homeTeam = getTeamById(match.homeTeamId);
    const awayTeam = getTeamById(match.awayTeamId);
    return homeTeam && awayTeam ? [{ match, homeTeam, awayTeam }] : [];
  });

  const highestScoring = withTeams
    .map((h) => ({ ...h, goals: (h.match.homeGoals ?? 0) + (h.match.awayGoals ?? 0) }))
    .sort((a, b) => b.goals - a.goals)[0];

  const upsets = withTeams.flatMap((h) => {
    const homeGoals = h.match.homeGoals ?? 0;
    const awayGoals = h.match.awayGoals ?? 0;
    if (homeGoals === awayGoals) return [];
    const winner = homeGoals > awayGoals ? h.homeTeam : h.awayTeam;
    const loser = homeGoals > awayGoals ? h.awayTeam : h.homeTeam;
    const winnerRank = rankByTeam.get(winner.id);
    const loserRank = rankByTeam.get(loser.id);
    if (winnerRank == null || loserRank == null || winnerRank <= loserRank) return [];
    return [{ ...h, winner, loser, winnerRank, loserRank, gap: winnerRank - loserRank }];
  });

  return {
    highestScoring: highestScoring && highestScoring.goals > 0 ? highestScoring : null,
    biggestUpset: upsets.sort((a, b) => b.gap - a.gap)[0] ?? null,
  };
}

// The gap between the leader and whoever is closest, which is what "首位" means
// in practice: a three-point lead and a level-on-points lead are different
// stories told by the same club name.
export function getTitleRaceSummary(): {
  leader: Team;
  points: number;
  challenger: Team | null;
  pointsClear: number;
} | null {
  const rows = getStandingsTable().filter((r) => r.team.record);
  const leader = rows[0];
  if (!leader?.team.record) return null;
  const challenger = rows[1]?.team ?? null;
  return {
    leader: leader.team,
    points: leader.team.record.points,
    challenger,
    pointsClear: leader.team.record.points - (challenger?.record?.points ?? leader.team.record.points),
  };
}

// The table as it stood at the end of an earlier round, rebuilt from results.
//
// The feed is a snapshot: it knows today's table and nothing about last week's,
// so a weekly site cannot say what changed without recomputing. Replaying the
// results reproduces the feed's current table exactly — points, goal difference,
// goals for and, crucially, its tie convention, where clubs level on all three
// share a position and the next number is skipped. That equivalence is what
// makes a movement figure trustworthy: both ends are counted the same way.
export function getTableAtMatchday(matchday: number): Map<number, number> {
  const totals = new Map<number, { points: number; goalDiff: number; goalsFor: number }>();
  for (const team of teams) totals.set(team.id, { points: 0, goalDiff: 0, goalsFor: 0 });

  for (const m of matchesFile.matches) {
    if (!m.played || m.matchday > matchday) continue;
    const home = totals.get(m.homeTeamId);
    const away = totals.get(m.awayTeamId);
    if (!home || !away || m.homeGoals == null || m.awayGoals == null) continue;

    home.goalsFor += m.homeGoals;
    away.goalsFor += m.awayGoals;
    home.goalDiff += m.homeGoals - m.awayGoals;
    away.goalDiff += m.awayGoals - m.homeGoals;
    if (m.homeGoals > m.awayGoals) home.points += 3;
    else if (m.homeGoals < m.awayGoals) away.points += 3;
    else {
      home.points += 1;
      away.points += 1;
    }
  }

  const rows = [...totals.entries()].map(([id, t]) => ({ id, ...t }));
  const outranks = (
    a: { points: number; goalDiff: number; goalsFor: number },
    b: { points: number; goalDiff: number; goalsFor: number }
  ) =>
    b.points > a.points ||
    (b.points === a.points && (b.goalDiff > a.goalDiff || (b.goalDiff === a.goalDiff && b.goalsFor > a.goalsFor)));

  // Competition ranking: a club's position is one more than the number of clubs
  // strictly above it, so level clubs share a number.
  return new Map(rows.map((row) => [row.id, 1 + rows.filter((other) => outranks(row, other)).length]));
}

export interface RoundMovement {
  /** Position at the end of the previous round; null in the opening round. */
  previousPosition: number | null;
  /** Places gained this round. Positive is upward. Null when there is no previous round. */
  change: number | null;
  /** Points won in this round alone. */
  pointsGained: number;
}

// What this round did to each club: places moved, and points won.
export function getRoundMovements(): Map<number, RoundMovement> {
  const { matchday } = getLatestResults();
  const movements = new Map<number, RoundMovement>();
  if (matchday <= 1) {
    for (const team of teams) {
      movements.set(team.id, { previousPosition: null, change: null, pointsGained: pointsInRound(team.id, matchday) });
    }
    return movements;
  }

  const previous = getTableAtMatchday(matchday - 1);
  for (const team of teams) {
    const previousPosition = previous.get(team.id) ?? null;
    const currentPosition = team.record?.position ?? null;
    movements.set(team.id, {
      previousPosition,
      change:
        previousPosition != null && currentPosition != null ? previousPosition - currentPosition : null,
      pointsGained: pointsInRound(team.id, matchday),
    });
  }
  return movements;
}

export interface PickReason {
  /** What kind of reason this is, for the chip. */
  label: string;
  /** The figure that earned it. Every reason carries one — see getMatchPicks. */
  detail: string;
}

export interface MatchPick {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  homePosition: number | null;
  awayPosition: number | null;
  score: number;
  reasons: PickReason[];
  /** Japanese players at either club, whoever has played most this season first. */
  japanesePlayers: Player[];
}

// How much each reason is worth. Written out rather than buried in the function
// so the ranking can be argued with: every point a match scores is visible to
// the reader as a reason with a number attached, and no point is awarded that
// the page does not show.
const PICK_WEIGHTS = {
  bothTopSix: 3,
  closeInTable: 2,
  bothBigSix: 3,
  evenHistory: 2,
  highScoring: 2,
  japanesePlayer: 3,
  /** Each Japanese player beyond the first, capped — three of them is rare. */
  extraJapanesePlayer: 1,
} as const;

/** Fewer meetings than this and a head-to-head record is an anecdote, not a pattern. */
const MEANINGFUL_HISTORY = 5;
/** Combined goals per game at or above this is a fixture that tends to produce goals. */
const HIGH_SCORING_COMBINED = 3.0;

// The fixtures the picks are chosen from: whatever is still to be played.
//
// A match that has already kicked off cannot answer "what should I watch next",
// which is the question this feature exists for. On a Sunday morning that means
// the rest of this round; once the round is over it means the next one.
export function getPickCandidates(): { matchday: number; isCurrentRound: boolean; matches: Match[] } {
  const latest = getLatestResults();
  const pending = latest.matches.filter((m) => !m.played);
  if (pending.length > 0) {
    return { matchday: latest.matchday, isCurrentRound: true, matches: pending };
  }

  const next = getNextFixtureRound();
  return {
    matchday: next,
    isCurrentRound: false,
    matches: matchesFile.matches.filter((m) => m.matchday === next && !m.played),
  };
}

// Three matches worth staying up for, chosen by rule.
//
// Rule-based on purpose: a hand-picked list is a list that stops being updated,
// and a stale "見どころ" is worse than none. The reasons are the output, not the
// score — a reader should be able to disagree with the ranking and still learn
// something from why each fixture is on it, so every point awarded is shown.
//
// What it cannot see: rivalry. A Manchester derby between 1st and 11th scores
// only as a meeting of two big clubs, because nothing in the data knows the two
// of them share a city. That is S10's ライバル・因縁マップ.
export function getMatchPicks(limit = 3): {
  matchday: number;
  isCurrentRound: boolean;
  considered: number;
  picks: MatchPick[];
} | null {
  const { matchday, isCurrentRound, matches } = getPickCandidates();
  if (matches.length === 0) return null;

  const japanese = getJapanesePlayers();
  const minutes = getPlayerMinutesMap();

  const scored = matches.flatMap((match) => {
    const homeTeam = getTeamById(match.homeTeamId);
    const awayTeam = getTeamById(match.awayTeamId);
    if (!homeTeam || !awayTeam) return [];

    const home = homeTeam.record;
    const away = awayTeam.record;
    const reasons: PickReason[] = [];
    let score = 0;

    if (home && away) {
      if (home.position <= 6 && away.position <= 6) {
        score += PICK_WEIGHTS.bothTopSix;
        reasons.push({ label: "上位対決", detail: `${home.position}位と${away.position}位の対戦` });
      }
      const gap = Math.abs(home.position - away.position);
      if (gap <= 3) {
        score += PICK_WEIGHTS.closeInTable;
        reasons.push({
          label: "順位が近い",
          detail: gap === 0 ? `同じ${home.position}位で並んでいる` : `順位差${gap}の直接対決`,
        });
      }
      const combined = home.goalsFor / Math.max(1, home.played) + away.goalsFor / Math.max(1, away.played);
      if (combined >= HIGH_SCORING_COMBINED) {
        score += PICK_WEIGHTS.highScoring;
        // Written as a sentence, not as a labelled quantity: the reader this is
        // for does not already know what "合計3.7" is the total of.
        reasons.push({
          label: "点が入る",
          detail: `両クラブ合わせて1試合平均${combined.toFixed(1)}点`,
        });
      }
    }

    if (getClubProfile(homeTeam.id)?.tier === "big6" && getClubProfile(awayTeam.id)?.tier === "big6") {
      score += PICK_WEIGHTS.bothBigSix;
      reasons.push({ label: "名門対決", detail: "ビッグ6と呼ばれる6クラブ同士" });
    }

    const h2h = getHeadToHead(homeTeam.id, awayTeam.id);
    if (h2h && h2h.numberOfMatches >= MEANINGFUL_HISTORY && Math.abs(h2h.teamAWins - h2h.teamBWins) <= 1) {
      score += PICK_WEIGHTS.evenHistory;
      reasons.push({
        label: "五分の相性",
        detail: `過去${h2h.numberOfMatches}試合で${clubShortJa(homeTeam)}の${h2h.teamAWins}勝${h2h.draws}分${h2h.teamBWins}敗`,
      });
    }

    const japanesePlayers = japanese
      .filter((p) => p.teamId === homeTeam.id || p.teamId === awayTeam.id)
      .sort((a, b) => (minutes.get(b.id) ?? 0) - (minutes.get(a.id) ?? 0));
    if (japanesePlayers.length > 0) {
      score +=
        PICK_WEIGHTS.japanesePlayer +
        Math.min(2, japanesePlayers.length - 1) * PICK_WEIGHTS.extraJapanesePlayer;
      // Leads the list rather than joining the end of it. It is the reason this
      // site exists, and it is the reason most likely to be the one a reader
      // came for — it should not be the one that falls off a narrow card.
      reasons.unshift({
        label: "日本人選手",
        detail: japanesePlayers.map((p) => p.nameJa ?? p.name).join("・"),
      });
    }

    return [
      {
        match,
        homeTeam,
        awayTeam,
        homePosition: home?.position ?? null,
        awayPosition: away?.position ?? null,
        score,
        reasons,
        japanesePlayers,
      },
    ];
  });

  const picks = scored
    .filter((p) => p.reasons.length > 0)
    // Level on score, the one that kicks off first is the one a reader can still
    // catch, so it leads.
    .sort((a, b) => b.score - a.score || new Date(a.match.utcDate).getTime() - new Date(b.match.utcDate).getTime())
    .slice(0, limit);

  return { matchday, isCurrentRound, considered: matches.length, picks };
}

export interface RoundSummary {
  matchday: number;
  /** Nothing came before this round, so no clause here can be a comparison. */
  isOpeningRound: boolean;
  /** Every fixture in the round has been played. */
  complete: boolean;
  /** The round in one paragraph, assembled from the clauses that had something to say. */
  text: string;
}

// The round in a sentence, written by rule rather than by hand.
//
// A sentence someone has to remember to rewrite every week is a sentence that
// goes stale and then quietly starts lying, so every clause here is derived from
// the same data the rest of the page is drawn from. Clauses that have nothing to
// report drop out instead of padding: a round with no particular shape says
// nothing about its shape, and a round with no Japanese involvement does not
// pretend otherwise.
export function getRoundSummary(): RoundSummary | null {
  const { matchday, matches } = getLatestResults();
  const played = matches.filter((m) => m.played);
  if (played.length === 0) return null;

  const complete = played.length === matches.length;
  const isOpeningRound = matchday <= 1;
  const clauses: string[] = [];

  const goals = played.reduce((sum, m) => sum + (m.homeGoals ?? 0) + (m.awayGoals ?? 0), 0);
  const roundLabel = isOpeningRound ? "開幕節" : `第${matchday}節`;
  // Mid-round, the denominator has to lead: every figure below it is a figure
  // about part of a round, and a reader who misses that reads them as final.
  const opening = complete
    ? `${roundLabel}は${played.length}試合で${goals}ゴール。`
    : `${roundLabel}はここまで${matches.length}試合中${played.length}試合を終えて${goals}ゴール。`;

  // The shape of the round, if it had one. Thresholds are deliberately far from
  // ordinary — an average round should trip none of them and simply say nothing.
  const shape = describeRoundShape(played);
  clauses.push(opening + (shape ?? ""));

  const race = describeTitleRace();
  if (race) clauses.push(race);

  if (!isOpeningRound) {
    const climb = describeBiggestClimb();
    if (climb) clauses.push(climb);
  }

  const japanese = describeJapaneseInvolvement(complete);
  if (japanese) clauses.push(japanese);

  return { matchday, isOpeningRound, complete, text: clauses.join("") };
}

// Reads as a connective onto the clause that follows it ("引き分けが6試合と多く、
// 首位は…"), so it is returned with its comma attached, or not at all.
function describeRoundShape(played: Match[]): string | null {
  // Under half a round the sample is too thin to call anything a tendency.
  if (played.length < 5) return null;

  const draws = played.filter((m) => m.homeGoals === m.awayGoals).length;
  const homeWins = played.filter((m) => (m.homeGoals ?? 0) > (m.awayGoals ?? 0)).length;
  const awayWins = played.length - draws - homeWins;
  const goals = played.reduce((sum, m) => sum + (m.homeGoals ?? 0) + (m.awayGoals ?? 0), 0);
  const perMatch = goals / played.length;

  if (draws / played.length >= 0.4) return `引き分けが${draws}試合と多く、`;
  if (perMatch >= 3.2) return `1試合平均${perMatch.toFixed(1)}ゴールとよく点が入り、`;
  if (perMatch <= 1.8) return `1試合平均${perMatch.toFixed(1)}ゴールと締まった内容で、`;
  if (awayWins >= 4 && awayWins >= homeWins * 2) return `アウェイの勝利が${awayWins}試合と目立ち、`;
  if (homeWins / played.length >= 0.6) return `ホームが${homeWins}試合で勝ち、`;
  return null;
}

// "首位" on its own is not news. What the top of the table is doing is: pulling
// away, or level and unresolved.
//
// The clause has to agree with the table printed under it. Early in a season
// half the league can share a points total while the table still numbers them
// 1, 2, 2, 4 — so "並んだ" is reserved for two clubs, where it reads the way
// football coverage uses it, and a wider pile-up names the leader and the
// tiebreak that actually put them on top instead of claiming nine joint leaders.
function describeTitleRace(): string | null {
  const rows = getStandingsTable().filter((r) => r.team.record);
  const leader = rows[0];
  const leaderRecord = leader?.team.record;
  if (!leaderRecord) return null;

  const points = leaderRecord.points;
  const level = rows.filter((r) => r.team.record?.points === points);

  if (level.length === 2) {
    return `首位は${clubNameJa(level[0].team)}と${clubNameJa(level[1].team)}が勝点${points}で並んだ。`;
  }
  if (level.length > 2) {
    const next = level[1]?.team.record;
    const separator =
      next && leaderRecord.goalDiff > next.goalDiff
        ? "得失点差"
        : next && leaderRecord.goalsFor > next.goalsFor
          ? "総得点"
          : null;
    return separator
      ? `勝点${points}で並ぶ${level.length}クラブのうち、${separator}で${clubNameJa(leader.team)}が首位に立っている。`
      : `首位は${level.length}クラブが勝点${points}で並んだ。`;
  }

  const challenger = rows[1];
  if (!challenger?.team.record) return `首位は${clubNameJa(leader.team)}（勝点${points}）。`;
  return `首位は${clubNameJa(leader.team)}が勝点${points}で、${clubNameJa(
    challenger.team
  )}に勝点${points - challenger.team.record.points}差をつけている。`;
}

// One club stands for the whole week's movement: the one that climbed furthest.
// A round where nobody climbed is itself worth a word, since the reason a reader
// opens the table on a Sunday is to find out whether anything moved.
function describeBiggestClimb(): string | null {
  const rows = getStandingsTable().filter((r) => r.positionChange != null && r.position != null);
  const climbs = rows
    .filter((r) => (r.positionChange ?? 0) > 0)
    .sort((a, b) => (b.positionChange ?? 0) - (a.positionChange ?? 0) || (a.position ?? 0) - (b.position ?? 0));

  const best = climbs[0];
  if (!best) return rows.length > 0 ? "順位の入れ替わりはなかった。" : null;
  return `${clubNameJa(best.team)}が${best.previousPosition}位から${best.position}位へ最も順位を上げている。`;
}

// The clause the site exists for. It reports nothing rather than reporting a
// zero, except once the round is over — by then "出場はなかった" is the answer.
function describeJapaneseInvolvement(complete: boolean): string | null {
  const jp = getJapaneseRoundSummary();
  if (jp.total === 0) return null;
  if (jp.played === 0) return complete ? "日本人選手の出場はなかった。" : null;

  const record =
    jp.goals > 0 && jp.assists > 0
      ? `${jp.goals}ゴール${jp.assists}アシスト`
      : jp.goals > 0
        ? `${jp.goals}ゴール`
        : jp.assists > 0
          ? `${jp.assists}アシスト`
          : null;

  return record
    ? `日本人選手は${jp.played}人が出場し、${record}を記録した。`
    : `日本人選手は${jp.played}人が出場した。`;
}

function clubNameJa(team: Team): string {
  return getTeamNameJa(team.id)?.full ?? team.name;
}

/** The spoken short form, for running text where the full name would crowd. */
function clubShortJa(team: Team): string {
  return getTeamNameJa(team.id)?.short ?? team.shortName;
}

function pointsInRound(teamId: number, matchday: number): number {
  return matchesFile.matches
    .filter((m) => m.matchday === matchday && m.played && (m.homeTeamId === teamId || m.awayTeamId === teamId))
    .reduce((sum, m) => {
      const isHome = m.homeTeamId === teamId;
      const scored = (isHome ? m.homeGoals : m.awayGoals) ?? 0;
      const conceded = (isHome ? m.awayGoals : m.homeGoals) ?? 0;
      if (scored > conceded) return sum + 3;
      if (scored === conceded) return sum + 1;
      return sum;
    }, 0);
}
