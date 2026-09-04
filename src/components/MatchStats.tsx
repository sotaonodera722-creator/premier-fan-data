import type { MatchStatistics, Team } from "@/lib/types";
import { getTeamColor, colorsClash } from "@/lib/teamColors";
import TeamBadge from "@/components/TeamBadge";

const DISPLAY_STATS: { key: string; label: string; isPercent?: boolean; decimals?: number }[] = [
  { key: "Possession", label: "ポゼッション", isPercent: true },
  { key: "Expected Goals", label: "期待得点 (xG)", decimals: 2 },
  { key: "Shots on target", label: "枠内シュート" },
  { key: "Big Chances Created", label: "ビッグチャンス創出" },
  { key: "Corners", label: "コーナーキック" },
];

function formatValue(value: number, isPercent?: boolean, decimals?: number): string {
  if (isPercent) return `${Math.round(value * 100)}%`;
  if (decimals) return value.toFixed(decimals);
  return String(Math.round(value));
}

export default function MatchStats({
  statistics,
  homeTeam,
  awayTeam,
}: {
  statistics: MatchStatistics;
  homeTeam: Team;
  awayTeam: Team;
}) {
  const homeColor = getTeamColor(homeTeam.id);
  const awayColor = getTeamColor(awayTeam.id);
  // Same-ish colors (e.g. Chelsea navy vs Brighton navy) blend into one bar — give
  // the away side a diagonal stripe instead of a second solid fill in that case.
  const awayStriped = colorsClash(homeColor, awayColor);
  const homeMap = new Map(statistics.homeTeam.statistics.map((s) => [s.displayName, s.value]));
  const awayMap = new Map(statistics.awayTeam.statistics.map((s) => [s.displayName, s.value]));

  const rows = DISPLAY_STATS.map((d) => ({
    ...d,
    home: homeMap.get(d.key),
    away: awayMap.get(d.key),
  })).filter((r): r is typeof r & { home: number; away: number } => r.home !== undefined && r.away !== undefined);

  if (rows.length === 0) return null;

  return (
    <div className="glass space-y-4 rounded-xl p-5">
      <div className="flex items-center justify-between border-b border-border pb-3 text-xs font-medium">
        <span className="flex items-center gap-2" style={{ color: homeColor }}>
          <TeamBadge team={homeTeam} size={20} /> {homeTeam.shortName}
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">HOME</span>
        </span>
        <span className="flex items-center gap-2" style={{ color: awayColor }}>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">AWAY</span>
          {awayTeam.shortName} <TeamBadge team={awayTeam} size={20} />
        </span>
      </div>
      {rows.map((r) => {
        const total = r.home + r.away || 1;
        const homePct = (r.home / total) * 100;
        return (
          <div key={r.key}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-[family-name:var(--font-display)] font-bold" style={{ color: homeColor }}>
                {formatValue(r.home, r.isPercent, r.decimals)}
              </span>
              <span className="text-muted">{r.label}</span>
              <span className="font-[family-name:var(--font-display)] font-bold" style={{ color: awayColor }}>
                {formatValue(r.away, r.isPercent, r.decimals)}
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-border">
              <div style={{ width: `${homePct}%`, backgroundColor: homeColor }} />
              <div className="w-[2px] shrink-0 bg-background" />
              <div
                style={{
                  width: `${100 - homePct}%`,
                  backgroundColor: awayColor,
                  backgroundImage: awayStriped
                    ? `repeating-linear-gradient(135deg, transparent 0, transparent 6px, rgba(255,255,255,0.45) 6px, rgba(255,255,255,0.45) 12px)`
                    : undefined,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
