// Fetches Premier League starting lineups/formations from Highlightly and writes them to
// src/data/lineups.json, keyed by the football-data.org match id used elsewhere in this app.
// Usage: node scripts/ingest-lineups.mjs
// Requires HIGHLIGHTLY_API_KEY in .env.local (see .env.local.example) and an already
// up-to-date src/data/matches.json / teams.json (run ingest-football-data.mjs first).
//
// Highlightly's free "BASIC" plan is capped at 100 requests/day, so this script only
// fetches lineups for finished matches it doesn't already have, grouping the lookup of
// Highlightly match ids by date to keep the request count low.
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "src", "data");

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // no .env.local; rely on already-set environment variables
  }
}
loadEnvLocal();

const API_KEY = process.env.HIGHLIGHTLY_API_KEY;
if (!API_KEY) {
  console.error("HIGHLIGHTLY_API_KEY is not set. Add it to .env.local (see .env.local.example).");
  process.exit(1);
}

const BASE_URL = "https://soccer.highlightly.net";
const LEAGUE_ID = 33973; // Premier League on Highlightly
const SEASON = 2026;

// Our team ids (football-data.org, from src/data/teams.json) mapped to Highlightly's team ids.
// Only changes on promotion/relegation, so it's maintained by hand alongside teams.json.
const TEAM_ID_MAP = {
  65: 43334, // Manchester City
  57: 36526, // Arsenal
  322: 55248, // Hull City
  61: 42483, // Chelsea
  402: 47589, // Brentford
  67: 29718, // Newcastle United
  62: 39079, // Everton
  341: 54397, // Leeds United
  397: 44185, // Brighton & Hove Albion
  66: 28867, // Manchester United
  71: 635630, // Sunderland
  349: 49291, // Ipswich Town
  64: 34824, // Liverpool
  351: 56099, // Nottingham Forest
  1044: 30569, // Bournemouth
  63: 31420, // Fulham
  1076: 1146230, // Coventry City
  354: 45036, // Crystal Palace
  58: 56950, // Aston Villa
  73: 40781, // Tottenham Hotspur
};

async function apiGet(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "x-rapidapi-key": API_KEY },
  });

  const remaining = Number(res.headers.get("x-ratelimit-requests-remaining"));

  if (res.status === 429) {
    throw new Error("Highlightly daily request limit reached. Try again tomorrow.");
  }
  if (!res.ok) {
    throw new Error(`${endpoint} failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (Number.isFinite(remaining) && remaining <= 3) {
    console.warn(`Only ${remaining} Highlightly requests left today — stopping early to be safe.`);
    return { data, remaining, exhausted: true };
  }

  await sleep(300);
  return { data, remaining, exhausted: false };
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toTeamLineup(teamId, side) {
  return {
    teamId,
    formation: side.formation,
    startXI: side.initialLineup,
    substitutes: side.substitutes,
  };
}

async function main() {
  const matchesPath = path.join(DATA_DIR, "matches.json");
  const lineupsPath = path.join(DATA_DIR, "lineups.json");
  if (!existsSync(matchesPath)) {
    console.error("src/data/matches.json not found. Run scripts/ingest-football-data.mjs first.");
    process.exit(1);
  }

  const { matches } = JSON.parse(readFileSync(matchesPath, "utf-8"));
  const existing = existsSync(lineupsPath)
    ? JSON.parse(readFileSync(lineupsPath, "utf-8"))
    : { meta: { source: "highlightly.net", lastUpdated: null }, lineups: {} };

  const finished = matches.filter((m) => m.played);
  const missing = finished.filter((m) => !(String(m.id) in existing.lineups));

  if (missing.length === 0) {
    console.log("No new finished matches to fetch lineups for.");
    return;
  }
  console.log(`${missing.length} finished match(es) missing lineups. Looking them up on Highlightly ...`);

  const hlReverseMap = Object.fromEntries(Object.entries(TEAM_ID_MAP).map(([ours, hl]) => [hl, Number(ours)]));

  const byDate = new Map();
  for (const m of missing) {
    const date = m.utcDate.slice(0, 10);
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(m);
  }

  let stop = false;
  for (const [date, dateMatches] of byDate) {
    if (stop) break;

    const { data: hlDay, exhausted } = await apiGet(
      `/matches?leagueId=${LEAGUE_ID}&season=${SEASON}&date=${date}&limit=100`
    );
    if (exhausted) stop = true;

    const hlMatchesForDate = hlDay?.data ?? [];

    for (const m of dateMatches) {
      const homeHlId = TEAM_ID_MAP[m.homeTeamId];
      const awayHlId = TEAM_ID_MAP[m.awayTeamId];
      const hlMatch = hlMatchesForDate.find(
        (hm) => hm.homeTeam.id === homeHlId && hm.awayTeam.id === awayHlId
      );
      if (!hlMatch) {
        console.warn(`No Highlightly match found for our match ${m.id} on ${date} (teams ${m.homeTeamId} vs ${m.awayTeamId}).`);
        continue;
      }

      if (stop) break;
      const { data: lineup, exhausted: lineupExhausted } = await apiGet(`/lineups/${hlMatch.id}`);
      if (lineupExhausted) stop = true;

      if (!lineup?.homeTeam?.initialLineup || !lineup?.awayTeam?.initialLineup) {
        console.warn(`No lineup published yet for match ${m.id} (Highlightly id ${hlMatch.id}).`);
        continue;
      }

      existing.lineups[String(m.id)] = {
        matchId: m.id,
        homeTeam: toTeamLineup(m.homeTeamId, lineup.homeTeam),
        awayTeam: toTeamLineup(m.awayTeamId, lineup.awayTeam),
      };
      console.log(`Saved lineup for match ${m.id} (${date}).`);
    }
  }

  existing.meta = { source: "highlightly.net", lastUpdated: new Date().toISOString() };
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(lineupsPath, JSON.stringify(existing, null, 2));
  console.log(`Done. ${Object.keys(existing.lineups).length} match(es) with lineups saved.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
