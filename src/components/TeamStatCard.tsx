import Link from "next/link";
import type { Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import SectionHeading from "@/components/SectionHeading";

export type TeamStatRow = { team: Team; value: number; rank: number };

export default function TeamStatCard({
  title,
  eyebrow,
  rows,
  format,
  tab,
  teamId,
  size = "sm",
}: {
  title: string;
  eyebrow?: string;
  rows: TeamStatRow[];
  format: (v: number) => string;
  tab: string;
  teamId?: number;
  size?: "sm" | "lg";
}) {
  if (rows.length === 0) return null;

  if (size === "lg") {
    return (
      <div>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          action={
            <Link href={`/teams/rankings?tab=${tab}`} className="text-sm font-medium text-accent-2 hover:underline">
              もっと見る →
            </Link>
          }
        />
        <div className="glass divide-y divide-border rounded-xl">
          {rows.map((row) => (
            <Link
              key={row.team.id}
              href={`/teams/${row.team.id}`}
              className={`flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2 ${
                row.team.id === teamId ? "font-semibold text-foreground" : ""
              }`}
            >
              <span className="w-5 text-sm font-bold text-muted">{row.rank}</span>
              <TeamBadge team={row.team} size={28} />
              <span className="flex-1 truncate text-sm font-medium text-foreground">{row.team.shortName}</span>
              <span className="font-[family-name:var(--font-display)] text-xl font-bold text-accent">
                {format(row.value)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <Link href={`/teams/rankings?tab=${tab}`} className="text-xs font-medium text-accent-2 hover:underline">
          もっと見る →
        </Link>
      </div>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <Link
            key={row.team.id}
            href={`/teams/${row.team.id}`}
            className={`flex items-center gap-2.5 text-sm transition hover:text-accent-2 ${
              row.team.id === teamId ? "font-semibold text-foreground" : ""
            }`}
          >
            <span className="w-3 text-xs font-bold text-muted">{row.rank}</span>
            <TeamBadge team={row.team} size={20} />
            <span className="flex-1 truncate text-foreground">{row.team.shortName}</span>
            <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-bold text-foreground">
              {format(row.value)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
