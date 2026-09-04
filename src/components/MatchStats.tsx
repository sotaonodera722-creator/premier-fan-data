import type { MatchStatistics } from "@/lib/types";

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

export default function MatchStats({ statistics }: { statistics: MatchStatistics }) {
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
      {rows.map((r) => {
        const total = r.home + r.away || 1;
        const homePct = (r.home / total) * 100;
        return (
          <div key={r.key}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-[family-name:var(--font-display)] font-bold text-accent">
                {formatValue(r.home, r.isPercent, r.decimals)}
              </span>
              <span className="text-muted">{r.label}</span>
              <span className="font-[family-name:var(--font-display)] font-bold text-accent-2">
                {formatValue(r.away, r.isPercent, r.decimals)}
              </span>
            </div>
            <div className="flex h-1.5 overflow-hidden bg-border">
              <div className="bg-accent" style={{ width: `${homePct}%` }} />
              <div className="bg-accent-2" style={{ width: `${100 - homePct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
