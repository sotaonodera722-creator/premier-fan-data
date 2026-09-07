// Facts about the Premier League that the data feed does not carry. The API
// returns a table; it never says what any position entitles a club to, so the
// numbers arrive without meaning attached. These constants supply it.

/**
 * England's Champions League allocation. Usually four, but UEFA hands an extra
 * place to the top-performing associations in some seasons — nothing in the
 * feed reports it, so it has to be maintained here by hand.
 */
export const CHAMPIONS_LEAGUE_SPOTS = 4;

/** Fifth place goes to the Europa League league-phase. */
export const EUROPA_LEAGUE_SPOTS = 1;

/** Bottom three are relegated to the Championship. */
export const RELEGATION_SPOTS = 3;

export type StandingZone = "cl" | "el" | "relegation";

export const ZONE_LABELS: Record<StandingZone, string> = {
  cl: "CL",
  el: "EL",
  relegation: "降格",
};

export const ZONE_NAMES: Record<StandingZone, string> = {
  cl: "チャンピオンズリーグ圏",
  el: "ヨーロッパリーグ圏",
  relegation: "降格圏",
};

export const ZONE_MEANINGS: Record<StandingZone, string> = {
  cl: "来季のチャンピオンズリーグに出場できる。欧州で最も格の高い大会で、クラブの収入も評価も大きく変わる",
  el: "来季のヨーロッパリーグに出場できる。チャンピオンズリーグに次ぐ欧州二番目の大会",
  relegation:
    "来季は2部（チャンピオンシップ）に降格する。放映権収入が大きく減るため、クラブにとって最も避けたい結果",
};

/** Which zone a club sits in, by its rank in the table. */
export function zoneForRank(rank: number, totalTeams: number): StandingZone | null {
  if (rank >= 1 && rank <= CHAMPIONS_LEAGUE_SPOTS) return "cl";
  if (rank <= CHAMPIONS_LEAGUE_SPOTS + EUROPA_LEAGUE_SPOTS) return "el";
  if (rank > totalTeams - RELEGATION_SPOTS) return "relegation";
  return null;
}

/** The rank at which each zone stops, used to spot ties straddling a boundary. */
export function zoneBoundaryRanks(totalTeams: number): number[] {
  return [
    CHAMPIONS_LEAGUE_SPOTS,
    CHAMPIONS_LEAGUE_SPOTS + EUROPA_LEAGUE_SPOTS,
    totalTeams - RELEGATION_SPOTS,
  ];
}
