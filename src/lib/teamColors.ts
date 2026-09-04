// Each club's real primary shirt/brand color, keyed by football-data.org team id.
// This is the one place color is allowed to represent team identity in the UI — the
// rest of the interface is monochrome (see globals.css). Update when a team's id
// changes (promotion/relegation) alongside src/data/teams.json.
const TEAM_COLORS: Record<number, string> = {
  65: "#6cabdd", // Manchester City
  57: "#ef0107", // Arsenal
  322: "#f18a01", // Hull City
  61: "#034694", // Chelsea
  402: "#d2122e", // Brentford
  67: "#241f20", // Newcastle United
  62: "#003399", // Everton
  341: "#1d428a", // Leeds United
  397: "#0057b8", // Brighton & Hove Albion
  66: "#da291c", // Manchester United
  71: "#eb172b", // Sunderland
  349: "#0044a9", // Ipswich Town
  64: "#c8102e", // Liverpool
  351: "#dd0000", // Nottingham Forest
  1044: "#c8202d", // AFC Bournemouth
  63: "#1a1a1a", // Fulham
  1076: "#78d0f2", // Coventry City
  354: "#1b458f", // Crystal Palace
  58: "#670e36", // Aston Villa
  73: "#132257", // Tottenham Hotspur
};

const FALLBACK_COLOR = "#9a9a9a";

export function getTeamColor(teamId: number): string {
  return TEAM_COLORS[teamId] ?? FALLBACK_COLOR;
}
