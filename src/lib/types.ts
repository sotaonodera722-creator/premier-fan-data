import type { StandingZone } from "@/lib/leagueRules";

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
  // The Japanese rendering where we have one — kanji for the Japanese players,
  // katakana for everyone else. Display code prefers it; matching must not.
  nameJa?: string;
  /**
   * Katakana reading, for search only. Needed where `nameJa` is kanji and a
   * reader would type the sound rather than the characters (みとま / ミトマ).
   * Redundant where `nameJa` is already katakana, so it is only set for the
   * Japanese players.
   */
  nameKana?: string;
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

export interface StandingRow {
  team: Team;
  /** Position in the table counted densely, 1..20 — never shared, unlike . */
  rank: number;
  /** The position the feed reports, which clubs it cannot separate share. */
  position: number | null;
  isTied: boolean;
  tiedCount: number;
  zone: StandingZone | null;
  /** The zone this club could still land in when a tie spans a zone edge. */
  provisionalZone: StandingZone | null;
  /** True when the clubs sharing this position do not all fall in the same zone. */
  tieStraddlesZoneBoundary: boolean;
  played: number | null;
  /** Matches fewer than the club that has played the most. */
  gamesInHand: number;
  /**
   * Where this club stood when the previous round finished, counted the same
   * way as `position` — shared between clubs that were level — because
   * `position` is the number the table prints, and the movement beside it has
   * to be that number's own. null in the opening round, when there is no before.
   */
  previousPosition: number | null;
  /** Places gained since then. Positive is upward; null when there is no before. */
  positionChange: number | null;
  /** Points won in the current round alone. */
  roundPoints: number;
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

export type JapaneseRoundStatus = "played" | "benched" | "absent" | "pending" | "unknown";

export interface JapanesePlayerSummary {
  player: Player;
  // Season-to-date, summed over every match we hold a lineup for. null when no
  // covered match has this player in a lineup — distinct from 0, which would mean
  // "named in a lineup but never actually on the pitch".
  minutes: number | null;
  appearances: number;
  starts: number;
  /**
   * Matches he was named in the squad for and never came on.
   *
   * Not derivable from `appearances`, which counts only the matches he played
   * in: a player who has been in every squad without being used has none of
   * them, and reporting him the same way as one his manager has not picked at
   * all loses the distinction the section is built on.
   */
  benchedMatches: number;
  // The most recent completed round only, so a section headed "this weekend" can
  // lead with weekend numbers instead of season totals. null when they did not
  // play in it.
  round: JapanesePlayerRoundStat | null;
  // Four genuinely different answers to "did he play?", which a single
  // "did not play" would flatten into something misleading:
  //   played   — was on the pitch
  //   benched  — named among the substitutes but never came on
  //   absent   — not in the matchday squad at all
  //   pending  — his club has not kicked off in this round yet
  //   unknown  — the match is over but we hold no lineup for it
  roundStatus: JapaneseRoundStatus;
  /** The club's fixture in this round, so the UI can say when it kicks off. */
  roundMatch: Match | null;
  /**
   * The same player a round earlier. A reader following one player is asking
   * whether he is getting closer to the pitch or further from it, and a single
   * round's minutes cannot answer that on its own.
   */
  previousRound: JapanesePlayerPreviousRound | null;
}

export interface JapanesePlayerPreviousRound {
  matchday: number;
  status: JapaneseRoundStatus;
  minutes: number;
  /**
   * Minutes gained on the previous round. Only meaningful when he was on the
   * pitch in both, so it is null whenever either round has him off it — a
   * "-90分" for a player who was dropped says less than the drop itself.
   */
  minutesChange: number | null;
}

/** One club's finishing position in the season before this one. */
export interface PastSeasonRecord {
  teamId: number;
  name: string;
  /** 1 = Premier League, 2 = Championship. */
  tier: number;
  divisionJa: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface PastSeasonsFile {
  meta: {
    season: string;
    seasonStartYear: number;
    fetchedAt: string;
    source: string;
    note: string;
  };
  teams: Record<string, PastSeasonRecord>;
}

/**
 * Where a club has come from since May.
 *
 * Deliberately not the same shape as the round-on-round movement in
 * `StandingRow`. That one compares two Premier League positions and can always
 * subtract them; this one has to cope with a club whose previous position was
 * in a different division, where no subtraction is meaningful — Coventry did
 * not climb nineteen places, they were promoted.
 */
export type SeasonMovementKind = "up" | "down" | "level" | "promoted" | "unknown";

export interface SeasonMovement {
  kind: SeasonMovementKind;
  /** The club's finish last season, or null when we hold no record for it. */
  last: PastSeasonRecord | null;
  position: number | null;
  /**
   * Places gained on last season's finish. Positive is upward. null whenever
   * the two positions are not comparable — a promoted club, or a missing record.
   */
  change: number | null;
}
