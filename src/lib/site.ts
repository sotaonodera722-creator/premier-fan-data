// The site's own origin.
//
// Everything the site hands to something outside the browser needs an absolute
// URL: the sitemap, robots.txt, and the Open Graph tags a link preview reads.
// All of them are built from this one value, so moving to a custom domain — or
// off Vercel entirely — is one environment variable rather than a search and
// replace across the app.
//
// `NEXT_PUBLIC_*` is inlined at build time, not read at request time, so a
// change to it only takes effect on the next deploy.
const FALLBACK_ORIGIN = "https://premier-fan-data.vercel.app";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_ORIGIN).replace(/\/+$/, "");

/** `/players/123` → `https://…/players/123`. Leading slash optional. */
export function absoluteUrl(path: string): string {
  return path.startsWith("/") ? `${SITE_URL}${path}` : `${SITE_URL}/${path}`;
}
