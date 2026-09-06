import Link from "next/link";
import { getHeadToHead, getTeamById } from "@/lib/data";
import { getTeamColor } from "@/lib/teamColors";
import type { Team } from "@/lib/types";

export default function MatchHeadToHead({
  homeTeam,
  awayTeam,
  excludeUtcDate,
}: {
  homeTeam: Team;
  awayTeam: Team;
  excludeUtcDate: string;
}) {
  const h2h = getHeadToHead(homeTeam.id, awayTeam.id);
  const homeColor = getTeamColor(homeTeam.id);
  const awayColor = getTeamColor(awayTeam.id);

  if (!h2h || h2h.numberOfMatches === 0) return null;

  // The match this page is showing is itself part of the head-to-head record —
  // its score is already shown at the top of the page, so skip it in the list below.
  const otherMatches = h2h.matches.filter((m) => m.utcDate !== excludeUtcDate);

  return (
    <div>
      <div className="glass grid grid-cols-3 divide-x divide-border rounded-xl text-center">
        <div className="p-4">
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold" style={{ color: homeColor }}>
            {h2h.teamAWins}
          </p>
          <p className="mt-1 text-xs text-muted">{homeTeam.shortName} 勝利</p>
        </div>
        <div className="p-4">
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">{h2h.draws}</p>
          <p className="mt-1 text-xs text-muted">引き分け</p>
        </div>
        <div className="p-4">
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold" style={{ color: awayColor }}>
            {h2h.teamBWins}
          </p>
          <p className="mt-1 text-xs text-muted">{awayTeam.shortName} 勝利</p>
        </div>
      </div>

      {otherMatches.length > 0 && (
        <div className="glass mt-4 divide-y divide-border rounded-xl">
          {otherMatches.map((m, i) => {
            const home = getTeamById(m.homeTeamId);
            const away = getTeamById(m.awayTeamId);
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="w-20 shrink-0 text-xs text-muted">
                  {new Date(m.utcDate).toLocaleDateString("ja-JP", { year: "numeric", month: "short", timeZone: "Asia/Tokyo" })}
                </span>
                <span className="flex-1 truncate text-right text-foreground">{home?.shortName}</span>
                <span className="font-[family-name:var(--font-display)] font-bold text-foreground">
                  {m.homeGoals} - {m.awayGoals}
                </span>
                <span className="flex-1 truncate text-foreground">{away?.shortName}</span>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href={`/compare?a=${homeTeam.id}&b=${awayTeam.id}`}
        className="mt-3 inline-block text-sm font-medium text-accent-2 hover:underline"
      >
        詳しく比較する →
      </Link>
    </div>
  );
}
