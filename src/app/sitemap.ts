import type { MetadataRoute } from "next";
import {
  getTeams,
  getPlayers,
  getClickableMatchIds,
  getDataFreshness,
} from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

// A search engine finds a page two ways: a link from a page it already knows,
// or a sitemap. Neither was working here. The player list filters client-side
// and the match list is paginated by matchday, so the 548 player pages and the
// 380 match pages sit behind interactions a crawler never performs — and until
// this file existed, nothing told Google they were there at all.
//
// The match set deliberately comes from `getClickableMatchIds()` rather than
// every fixture in the file. A finished match with no lineup data 404s, and a
// sitemap that lists URLs which 404 is worse than one that omits them.
const LANDING_PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1.0 },
  { path: "/standings", priority: 0.9 },
  { path: "/players", priority: 0.8 },
  { path: "/matches", priority: 0.8 },
  { path: "/teams", priority: 0.8 },
  { path: "/players/rankings", priority: 0.7 },
  { path: "/teams/rankings", priority: 0.7 },
  { path: "/compare", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const { lastUpdated } = getDataFreshness();
  const refreshed = new Date(lastUpdated);

  // The eight pages that exist regardless of what the season does. The home page
  // and the table are what a reader lands on, so they rank above the indexes.
  const landing: MetadataRoute.Sitemap = LANDING_PAGES.map(({ path, priority }) => ({
    url: absoluteUrl(path),
    lastModified: refreshed,
    changeFrequency: "daily",
    priority,
  }));

  const teams: MetadataRoute.Sitemap = getTeams().map((team) => ({
    url: absoluteUrl(`/teams/${team.id}`),
    lastModified: refreshed,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const players: MetadataRoute.Sitemap = getPlayers().map((player) => ({
    url: absoluteUrl(`/players/${player.id}`),
    lastModified: refreshed,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const matches: MetadataRoute.Sitemap = getClickableMatchIds().map((id) => ({
    url: absoluteUrl(`/matches/${id}`),
    lastModified: refreshed,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...landing, ...teams, ...players, ...matches];
}
