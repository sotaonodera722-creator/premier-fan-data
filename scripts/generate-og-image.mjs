// Generates src/app/opengraph-image.png — the picture a shared link shows.
//
// Run by hand, not by the build:
//
//   node scripts/generate-og-image.mjs
//
// The image carries no data from the season, so there is nothing to keep in
// sync and no reason to pay for it on every deploy. Generating it at build time
// would mean downloading and embedding a 5MB Japanese font in all six of the
// day's deployments, against a deployment budget that has already been exceeded
// once (docs/product-spec.md §7). A committed 1200x630 PNG costs tens of KB.
//
// Re-run it only when the wording or the design changes.
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

// `next` publishes no exports map, so ESM cannot resolve the extensionless
// "next/og" the way the framework's own bundler does. require() still can.
const { ImageResponse } = createRequire(import.meta.url)("next/og");

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "app", "opengraph-image.png");

// Google Fonts picks the format from the user agent, and the renderer inside
// ImageResponse reads ttf, otf and woff but not woff2 — which is all a modern
// browser string gets you. An old Android is the string that returns ttf; an
// old IE returns eot, which fails later with an opaque "Unsupported OpenType
// signature" rather than anything that names the real problem.
const TTF_USER_AGENT =
  "Mozilla/5.0 (Linux; U; Android 2.2; en-us; Nexus One Build/FRF91) " +
  "AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1";

async function loadFont(family, weight) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`;
  const css = await fetch(cssUrl, {
    headers: { "User-Agent": TTF_USER_AGENT },
  }).then((r) => r.text());

  // The legacy URL carries no .ttf extension — it is a /l/font?kit=… endpoint
  // that decides the format from the request's user agent.
  // The URL carries no extension — it is a /l/font?kit=… endpoint that decides
  // the format from the request, so the same user agent has to go with it.
  const url = css.match(/src:\s*url\((https:\/\/[^)]+)\)/)?.[1];
  if (!url) throw new Error(`no font url in the css for ${family} ${weight}`);

  const bytes = new Uint8Array(
    await fetch(url, { headers: { "User-Agent": TTF_USER_AGENT } }).then((r) => r.arrayBuffer())
  );

  // 00 01 00 00 is the TrueType signature. Checking it here turns a wrong
  // format into a message that says so.
  const [a, b, c, d] = bytes;
  if (!(a === 0x00 && b === 0x01 && c === 0x00 && d === 0x00)) {
    throw new Error(`${family} ${weight} came back in some format other than ttf (${a} ${b} ${c} ${d})`);
  }

  return bytes;
}

const [regular, bold] = await Promise.all([
  loadFont("Noto+Sans+JP", 400),
  loadFont("Noto+Sans+JP", 700),
]);

const image = new ImageResponse(
  {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#ffffff",
        color: "#14120f",
        padding: "72px 80px",
        fontFamily: "Noto Sans JP",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "0.34em",
              color: "#6d6a66",
            },
            children: "PREMIER FAN DATA",
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column" },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex", fontSize: 82, fontWeight: 700, lineHeight: 1.22 },
                  children: "プレミアリーグを、",
                },
              },
              {
                type: "div",
                props: {
                  style: { display: "flex", fontSize: 82, fontWeight: 700, lineHeight: 1.22 },
                  children: "日本語の数字で読む。",
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              borderTop: "3px solid #14120f",
              paddingTop: 28,
            },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex", fontSize: 30, fontWeight: 700 },
                  children: "順位表・全20クラブ・全選手・日本人選手の出場時間",
                },
              },
              {
                type: "div",
                props: {
                  style: { display: "flex", fontSize: 25, color: "#6d6a66", marginTop: 12 },
                  children: "日本時間で、4時間ごとに更新",
                },
              },
            ],
          },
        },
      ],
    },
  },
  {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Noto Sans JP", data: regular, weight: 400, style: "normal" },
      { name: "Noto Sans JP", data: bold, weight: 700, style: "normal" },
    ],
  }
);

await writeFile(OUT, Buffer.from(await image.arrayBuffer()));
console.log(`書き出しました: ${path.relative(process.cwd(), OUT)}`);
