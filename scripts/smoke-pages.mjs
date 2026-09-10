// Renders the pages the build no longer renders.
//
// `next build` used to prerender all 959 pages, which made it a test: if any
// player or fixture broke its page, the build failed. Bounding the prerendered
// sets to 88 pages (deployment storage — see docs/product-spec.md §7) took that
// away from 871 of them. This puts most of it back for the cost of one server
// start: serve the build, ask for a sample of the pages nobody prerendered, and
// fail on anything that is not a 200.
//
// It samples rather than sweeps because 871 requests would cost more CI time
// than the coverage is worth, and because a page that breaks usually breaks for
// a shape of data many rows share. The sample rotates with the run, so a
// different set is covered each time.

import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const PORT = 3123;
const SAMPLE_PER_ROUTE = 12;
const READY_TIMEOUT_MS = 60_000;

/** Deterministic per run, different between runs. */
function pick(all, count, seed) {
  const out = [];
  const pool = [...all];
  let x = seed;
  while (out.length < count && pool.length) {
    x = (x * 1103515245 + 12345) % 2147483648;
    out.push(pool.splice(x % pool.length, 1)[0]);
  }
  return out;
}

async function waitForServer(url, deadline) {
  for (;;) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok || res.status === 404) return;
    } catch {
      // not listening yet
    }
    if (Date.now() > deadline) throw new Error(`server did not answer within ${READY_TIMEOUT_MS}ms`);
    await new Promise((r) => setTimeout(r, 500));
  }
}

const {
  getPlayers,
  getAllMatches,
  getPrerenderedMatchIds,
  getPrerenderedPlayerIds,
} = await import("../src/lib/data.ts");

const builtMatches = new Set(getPrerenderedMatchIds());
const builtPlayers = new Set(getPrerenderedPlayerIds());
const unbuiltMatches = getAllMatches().map((m) => m.id).filter((id) => !builtMatches.has(id));
const unbuiltPlayers = getPlayers().map((p) => p.id).filter((id) => !builtPlayers.has(id));

const seed = Number(process.env.GITHUB_RUN_NUMBER ?? Date.now() % 100000) || 1;
const targets = [
  ...pick(unbuiltMatches, SAMPLE_PER_ROUTE, seed).map((id) => `/matches/${id}`),
  ...pick(unbuiltPlayers, SAMPLE_PER_ROUTE, seed + 7).map((id) => `/players/${id}`),
];

console.log(
  `事前生成していないページ: 試合 ${unbuiltMatches.length} / 選手 ${unbuiltPlayers.length}。` +
    `そのうち ${targets.length} 件を描画して確かめる（seed ${seed}）。`
);

// Started through node with Next's CLI resolved directly, rather than through
// `npx` with a shell: a shell-wrapped child survives `kill()` on Windows, and
// the script then hangs after passing every check.
const nextCli = createRequire(import.meta.url).resolve("next/dist/bin/next");
const server = spawn(process.execPath, [nextCli, "start", "--port", String(PORT)], {
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

let failures = [];
try {
  await waitForServer(`http://127.0.0.1:${PORT}/`, Date.now() + READY_TIMEOUT_MS);
  for (const path of targets) {
    const started = Date.now();
    let status = 0;
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}${path}`, { signal: AbortSignal.timeout(30_000) });
      status = res.status;
      // A page that answers 200 with an error boundary is still a broken page.
      const html = await res.text();
      if (status === 200 && !html.includes("</html>")) status = -1;
    } catch (error) {
      failures.push(`${path} — ${error.message}`);
      continue;
    }
    const ms = Date.now() - started;
    if (status !== 200) failures.push(`${path} — HTTP ${status}`);
    console.log(`  ${status === 200 ? "OK " : "NG "} ${path.padEnd(24)} ${ms}ms`);
  }
} finally {
  server.kill();
}

if (failures.length) {
  console.error(`\n${failures.length} 件が描画できませんでした:`);
  failures.forEach((f) => console.error("  " + f));
  console.error("\nサーバーの出力:\n" + serverLog.slice(-2000));
  process.exit(1);
}
console.log(`\n${targets.length} 件すべて描画できました。`);
