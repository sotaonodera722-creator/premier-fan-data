// Fetches historical head-to-head results between every pair of this season's Premier
// League teams from football-data.org and writes them to src/data/h2h.json.
// Usage: node scripts/ingest-h2h.mjs
// Requires FOOTBALL_DATA_API_TOKEN in .env.local (see .env.local.example) and an
// up-to-date src/data/matches.json (run ingest-football-data.mjs first).
//
// football-data.org's own `aggregates` field on this endpoint doesn't reliably match
// the `matches` it returns, so wins/draws/losses here are computed locally from the
// match list instead of trusting that field.
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

const TOKEN = process.env.FOOTBALL_DATA_API_TOKEN;
if (!TOKEN) {
  console.error("FOOTBALL_DATA_API_TOKEN is not set. Add it to .env.local (see .env.local.example).");
  process.exit(1);
}

const BASE_URL = "https://api.football-data.org/v4";
const H2H_LIMIT = 15; // how many past meetings to keep per pair

async function apiGet(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "X-Auth-Token": TOKEN },
  });

  const remaining = Number(res.headers.get("x-requests-available-minute"));
  const resetSeconds = Number(res.headers.get("x-requestcounter-reset")) || 60;

  if (res.status === 429) {
    console.log(`Rate limited. Waiting ${resetSeconds}s before retrying ${endpoint} ...`);
    await sleep(resetSeconds * 1000);
    return apiGet(endpoint);
  }
  if (!res.ok) {
    throw new Error(`${endpoint} failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (Number.isFinite(remaining) && remaining <= 1) {
    console.log(`Only ${remaining} requests left this minute — pausing ${resetSeconds}s.`);
    await sleep(resetSeconds * 1000);
  } else {
    await sleep(600);
  }

  return data;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pairKey(a, b) {
  return [a, b].sort((x, y) => x - y).join("-");
}

async function main() {
  const matchesPath = path.join(DATA_DIR, "matches.json");
  const h2hPath = path.join(DATA_DIR, "h2h.json");
  if (!existsSync(matchesPath)) {
    console.error("src/data/matches.json not found. Run scripts/ingest-football-data.mjs first.");
    process.exit(1);
  }

  const { matches } = JSON.parse(readFileSync(matchesPath, "utf-8"));
  const existing = existsSync(h2hPath)
    ? JSON.parse(readFileSync(h2hPath, "utf-8"))
    : { meta: { source: "football-data.org", lastUpdated: null }, headToHead: {} };

  // One representative match id per unique team pair this season is enough to look up
  // their full head-to-head history via football-data.org's /head2head endpoint.
  const pairMatchId = new Map();
  for (const m of matches) {
    const key = pairKey(m.homeTeamId, m.awayTeamId);
    if (!pairMatchId.has(key)) pairMatchId.set(key, m.id);
  }

  const missing = [...pairMatchId.entries()].filter(([key]) => !(key in existing.headToHead));
  if (missing.length === 0) {
    console.log("No new team pairs to fetch. Delete src/data/h2h.json to force a full refresh.");
    return;
  }
  console.log(`Fetching head-to-head history for ${missing.length} team pair(s) ...`);

  let done = 0;
  for (const [key, matchId] of missing) {
    const [teamAId, teamBId] = key.split("-").map(Number);
    const data = await apiGet(`/matches/${matchId}/head2head?limit=${H2H_LIMIT}`);

    let teamAWins = 0;
    let draws = 0;
    let teamBWins = 0;
    const pastMatches = (data.matches ?? [])
      .filter((m) => m.status === "FINISHED" && m.score.fullTime.home !== null)
      .map((m) => {
        const home = m.homeTeam.id;
        const away = m.awayTeam.id;
        const hg = m.score.fullTime.home;
        const ag = m.score.fullTime.away;
        if (hg === ag) {
          draws++;
        } else {
          const winnerId = hg > ag ? home : away;
          if (winnerId === teamAId) teamAWins++;
          else teamBWins++;
        }
        return {
          utcDate: m.utcDate,
          competition: m.competition.name,
          homeTeamId: home,
          awayTeamId: away,
          homeGoals: hg,
          awayGoals: ag,
        };
      })
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime());

    existing.headToHead[key] = {
      teamAId,
      teamBId,
      numberOfMatches: pastMatches.length,
      teamAWins,
      draws,
      teamBWins,
      matches: pastMatches,
    };

    done++;
    if (done % 10 === 0) {
      console.log(`${done}/${missing.length} pairs done ...`);
      existing.meta = { source: "football-data.org", lastUpdated: new Date().toISOString() };
      mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(h2hPath, JSON.stringify(existing, null, 2));
    }
  }

  existing.meta = { source: "football-data.org", lastUpdated: new Date().toISOString() };
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(h2hPath, JSON.stringify(existing, null, 2));
  console.log(`Done. ${Object.keys(existing.headToHead).length} team pair(s) saved.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
