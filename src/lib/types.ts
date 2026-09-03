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
  name: string;
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
