// Fetches real Premier League data from football-data.org and writes it to src/data/*.json.
// Usage: node scripts/ingest-football-data.mjs
// Requires FOOTBALL_DATA_API_TOKEN in .env.local (see .env.local.example).
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
const COMPETITION = "PL";

// The API grants 10 requests/minute on the free tier. Read the actual remaining
// count off the response headers (as the provider's own onboarding email asks)
// instead of assuming a fixed pace, and back off when we're about to run out.
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

const POSITION_MAP = {
  Goalkeeper: "GK",
  Defence: "DF",
  Midfield: "MF",
  Offence: "FW",
};

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

async function main() {
  console.log("Fetching Premier League teams & squads ...");
  const teamsRes = await apiGet(`/competitions/${COMPETITION}/teams`);

  console.log("Fetching standings ...");
  const standingsRes = await apiGet(`/competitions/${COMPETITION}/standings`);

  console.log("Fetching season matches ...");
  const matchesRes = await apiGet(`/competitions/${COMPETITION}/matches`);

  console.log("Fetching top scorers ...");
  const scorersRes = await apiGet(`/competitions/${COMPETITION}/scorers?limit=100`);

  const standingsTable = standingsRes.standings.find((s) => s.type === "TOTAL")?.table ?? [];
  const standingsByTeam = Object.fromEntries(standingsTable.map((row) => [row.team.id, row]));

  const scorersByPerson = Object.fromEntries(
    scorersRes.scorers.map((s) => [s.player.id, { goals: s.goals ?? 0, assists: s.assists ?? 0, playedMatches: s.playedMatches ?? 0 }])
  );

  const teams = teamsRes.teams.map((t) => {
    const row = standingsByTeam[t.id];
    const record = row
      ? {
          position: row.position,
          played: row.playedGames,
          wins: row.won,
          draws: row.draw,
          losses: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          goalDiff: row.goalDifference,
          points: row.points,
          winRate: row.playedGames ? Math.round((row.won / row.playedGames) * 1000) / 10 : 0,
        }
      : null;
    return {
      id: t.id,
      name: t.name,
      shortName: t.shortName || t.tla,
      tla: t.tla,
      crest: t.crest,
      clubColors: t.clubColors || null,
      venue: t.venue || null,
      founded: t.founded || null,
      coach: t.coach?.name || null,
      record,
    };
  });
  teams.sort((a, b) => (a.record?.position ?? 99) - (b.record?.position ?? 99));

  const players = [];
  teamsRes.teams.forEach((t) => {
    (t.squad || []).forEach((p) => {
      const stat = scorersByPerson[p.id];
      players.push({
        id: p.id,
        name: p.name,
        teamId: t.id,
        position: POSITION_MAP[p.position] || "MF",
        dateOfBirth: p.dateOfBirth,
        age: calcAge(p.dateOfBirth),
        nationality: p.nationality,
        isJapanese: p.nationality === "Japan",
        goals: stat?.goals ?? null,
        assists: stat?.assists ?? null,
        appearances: stat?.playedMatches ?? null,
      });
    });
  });

  const matches = matchesRes.matches.map((m) => ({
    id: m.id,
    matchday: m.matchday,
    utcDate: m.utcDate,
    status: m.status,
    played: m.status === "FINISHED",
    homeTeamId: m.homeTeam.id,
    awayTeamId: m.awayTeam.id,
    homeGoals: m.score.fullTime.home,
    awayGoals: m.score.fullTime.away,
  }));

  const meta = {
    competition: "Premier League",
    season: `${matchesRes.resultSet?.first?.slice(0, 4) ?? ""}/${matchesRes.resultSet?.last?.slice(2, 4) ?? ""}`,
    currentMatchday: teamsRes.season?.currentMatchday ?? null,
    lastUpdated: new Date().toISOString(),
    source: "football-data.org",
  };

  writeFileSync(path.join(OUT_DIR, "teams.json"), JSON.stringify(teams, null, 2));
  writeFileSync(path.join(OUT_DIR, "players.json"), JSON.stringify(players, null, 2));
  writeFileSync(path.join(OUT_DIR, "matches.json"), JSON.stringify({ meta, matches }, null, 2));

  const jpCount = players.filter((p) => p.isJapanese).length;
  console.log(`Done. ${teams.length} teams, ${players.length} players (${jpCount} Japanese), ${matches.length} matches.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
