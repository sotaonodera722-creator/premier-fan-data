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

// Picks black or white text for legibility on top of a given team color,
// via relative luminance (WCAG-style approximation).
export function getContrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? "#14120f" : "#ffffff";
}

// Perceptual-ish distance between two hex colors ("redmean" approximation).
// Used to detect kit clashes (e.g. Brighton navy vs Chelsea navy) since we only
// track one real color per club, not the actual home/away kit worn on the day.
function colorDistance(hexA: string, hexB: string): number {
  const a = {
    r: parseInt(hexA.slice(1, 3), 16),
    g: parseInt(hexA.slice(3, 5), 16),
    b: parseInt(hexA.slice(5, 7), 16),
  };
  const b = {
    r: parseInt(hexB.slice(1, 3), 16),
    g: parseInt(hexB.slice(3, 5), 16),
    b: parseInt(hexB.slice(5, 7), 16),
  };
  const rmean = (a.r + b.r) / 2;
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(
    (2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db
  );
}

// True when two team colors are too close to reliably tell apart on the pitch
// (real-world equivalent: a kit clash forcing the away side to change strip).
export function colorsClash(hexA: string, hexB: string): boolean {
  return colorDistance(hexA, hexB) < 110;
}
