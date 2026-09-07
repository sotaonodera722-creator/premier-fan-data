export type Position = "GK" | "DF" | "MF" | "FW";
export type MatchResultLetter = "W" | "D" | "L";

export interface TeamRecord {
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  winRate: number;
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  clubColors: string | null;
  venue: string | null;
  founded: number | null;
  coach: string | null;
  record: TeamRecord | null;
}

export interface Player {
  id: number;
  // Always the Latin-script name from the feed. Lineup and event matching keys off
  // this, so it must not be replaced with a translation — see playerNamesJa.ts.
  name: string;
  // Kanji name where we have one. Display code prefers it; matching must not.
  nameJa?: string;
  teamId: number;
  position: Position;
  dateOfBirth: string;
  age: number | null;
  nationality: string;
  isJapanese: boolean;
  goals: number | null;
  assists: number | null;
  appearances: number | null;
}

export interface Match {
  id: number;
  matchday: number;
  utcDate: string;
  status: string;
  played: boolean;
  homeTeamId: number;
  awayTeamId: number;
  homeGoals: number | null;
  awayGoals: number | null;
}

export interface MatchesFile {
  meta: {
    competition: string;
    season: string;
    currentMatchday: number | null;
    lastUpdated: string;
    source: string;
  };
  matches: Match[];
}

export interface LineupPlayer {
  id: number;
  name: string;
  number: number;
  position: string;
}

export interface TeamLineup {
  teamId: number;
  formation: string;
  startXI: LineupPlayer[][];
  substitutes: LineupPlayer[];
}

export interface MatchEvent {
  minute: string;
  type: string;
  teamId: number;
  player: string;
  assist: string | null;
  substitutedFor: string | null;
}

export interface MatchStatItem {
  displayName: string;
  value: number;
}

export interface TeamStatistics {
  teamId: number;
  statistics: MatchStatItem[];
}

export interface MatchStatistics {
  homeTeam: TeamStatistics;
  awayTeam: TeamStatistics;
}

export interface MatchLineup {
  matchId: number;
  homeTeam: TeamLineup;
  awayTeam: TeamLineup;
  events?: MatchEvent[];
  statistics?: MatchStatistics;
}

export interface LineupsFile {
  meta: {
    source: string;
    lastUpdated: string;
  };
  lineups: Record<string, MatchLineup>;
}

export interface HeadToHeadMatch {
  utcDate: string;
  competition: string;
  homeTeamId: number;
  awayTeamId: number;
  homeGoals: number;
  awayGoals: number;
}

export interface HeadToHead {
  teamAId: number;
  teamBId: number;
  numberOfMatches: number;
  teamAWins: number;
  draws: number;
  teamBWins: number;
  matches: HeadToHeadMatch[];
}

export interface HeadToHeadFile {
  meta: {
    source: string;
    lastUpdated: string;
  };
  headToHead: Record<string, HeadToHead>;
}

export interface PlayerAppearance {
  matchId: number;
  matchday: number;
  utcDate: string;
  opponentId: number;
  isHome: boolean;
  homeGoals: number | null;
  awayGoals: number | null;
  status: "start" | "bench";
}

export interface JapanesePlayerRoundStat {
  matchday: number;
  minutes: number;
  goals: number;
  assists: number;
}

export interface JapanesePlayerSummary {
  player: Player;
  // Season-to-date, summed over every match we hold a lineup for. null when no
  // covered match has this player in a lineup — distinct from 0, which would mean
  // "named in a lineup but never actually on the pitch".
  minutes: number | null;
  appearances: number;
  starts: number;
  // The most recent completed round only, so a section headed "this weekend" can
  // lead with weekend numbers instead of season totals. null when they did not
  // play in it.
  round: JapanesePlayerRoundStat | null;
  // "pending" means their club has not kicked off in this round yet, which is a
  // different statement from "absent" (their club played and they did not feature).
  roundStatus: "played" | "pending" | "absent";
}
