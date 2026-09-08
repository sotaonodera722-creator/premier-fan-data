// Fetches last season's final tables and writes them to src/data/past-seasons.json.
// Usage: node scripts/ingest-past-seasons.mjs
// Requires FOOTBALL_DATA_API_TOKEN in .env.local (see .env.local.example).
//
// Deliberately NOT part of the four-hourly refresh workflow. A completed season's
// final table is a fixed number: it was settled in May and will never change again,
// so re-fetching it six times a day would spend rate limit to confirm a constant.
// Run this by hand once per season, when the new fixture list appears and the
// previous campaign becomes "last season".
//
// Two competitions, because three of this season's clubs were not in the Premier
// League last season. Without the Championship table, the promoted clubs would
// have a blank where every other club has a comparison — and "Coventry won the
// division below" is a more useful fact about them than an empty cell.
//
// The provider's free tier reaches back to the 2023/24 season; 2022/23 and earlier
// return 403. That boundary is why this file stores a list of seasons rather than
// assuming any particular depth of history is available.
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "src", "data");
mkdirSync(OUT_DIR, { recursive: true });

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

/** The season that had just finished when this season kicked off. */
const PREVIOUS_SEASON = 2025;

const DIVISIONS = [
  { code: "PL", tier: 1, nameJa: "プレミアリーグ" },
  { code: "ELC", tier: 2, nameJa: "チャンピオンシップ" },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Same pacing as ingest-football-data.mjs: read the remaining count off the
// headers rather than assuming a fixed rate.
async function apiGet(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, { headers: { "X-Auth-Token": TOKEN } });

  const remaining = Number(res.headers.get("x-requests-available-minute"));
  const resetSeconds = Number(res.headers.get("x-requestcounter-reset")) || 60;

  if (res.status === 429) {
    console.log(`Rate limited. Waiting ${resetSeconds}s before retrying ${endpoint} ...`);
    await sleep(resetSeconds * 1000);
    return apiGet(endpoint);
  }
  if (res.status === 403) {
    throw new Error(
      `${endpoint} returned 403. The free tier reaches back to 2023/24 only — check PREVIOUS_SEASON.`
    );
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

function totalTable(standings) {
  const total = standings.standings?.find((s) => s.type === "TOTAL");
  if (!total) throw new Error("No TOTAL standings table in the response.");
  return total.table;
}

async function main() {
  const rows = [];
  let seasonLabel = null;

  for (const division of DIVISIONS) {
    console.log(`Fetching ${division.code} ${PREVIOUS_SEASON} final table ...`);
    const res = await apiGet(`/competitions/${division.code}/standings?season=${PREVIOUS_SEASON}`);

    if (division.tier === 1) {
      seasonLabel = `${res.season.startDate.slice(0, 4)}/${res.season.endDate.slice(2, 4)}`;
      // A table that is still being played is not a final table. Storing one
      // would quietly turn "finished 4th" into "was 4th in March".
      if (res.season.currentMatchday !== 38) {
        throw new Error(
          `${division.code} ${PREVIOUS_SEASON} is on matchday ${res.season.currentMatchday}, not 38 — the season is not over.`
        );
      }
    }

    for (const row of totalTable(res)) {
      rows.push({
        teamId: row.team.id,
        name: row.team.shortName ?? row.team.name,
        tier: division.tier,
        divisionJa: division.nameJa,
        position: row.position,
        played: row.playedGames,
        wins: row.won,
        draws: row.draw,
        losses: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        points: row.points,
      });
    }
  }

  // A club that played in both divisions in one season does not exist, but a
  // duplicate id would silently pick a winner later, so fail loudly instead.
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.teamId)) throw new Error(`Team ${row.teamId} appears in both divisions.`);
    seen.add(row.teamId);
  }

  const out = {
    meta: {
      season: seasonLabel,
      seasonStartYear: PREVIOUS_SEASON,
      fetchedAt: new Date().toISOString(),
      source: "football-data.org",
      note: "Final tables only. Settled results, so this file is refreshed by hand once per season rather than by the scheduled job.",
    },
    // Keyed by team id: every read is "what did this club do last season?".
    teams: Object.fromEntries(rows.map((row) => [row.teamId, row])),
  };

  writeFileSync(path.join(OUT_DIR, "past-seasons.json"), JSON.stringify(out, null, 2));

  const byTier = DIVISIONS.map((d) => `${d.code} ${rows.filter((r) => r.tier === d.tier).length}`).join(", ");
  console.log(`Done. ${seasonLabel} final tables written (${byTier}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
