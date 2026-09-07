import Link from "next/link";
import type { Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import SectionHeading from "@/components/SectionHeading";
import SectionLink from "@/components/SectionLink";
import { getTeamNameJa } from "@/lib/teamNamesJa";

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
            <SectionLink href={`/teams/rankings?tab=${tab}`}>もっと見る →</SectionLink>
          }
        />
        <div className="glass divide-y divide-border rounded-xl">
          {rows.map((row) => (
            <Link
              key={row.team.id}
              href={`/teams/${row.team.id}`}
              className={`flex min-h-[44px] items-center gap-3 px-4 py-3 transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                row.team.id === teamId ? "font-semibold text-foreground" : ""
              }`}
            >
              <span className="w-5 text-sm font-bold text-muted">{row.rank}</span>
              <TeamBadge team={row.team} size={28} />
              <span className="min-w-0 flex-1 text-sm font-medium leading-tight text-foreground">
                {getTeamNameJa(row.team.id)?.short ?? row.team.shortName}
              </span>
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
        <SectionLink href={`/teams/rankings?tab=${tab}`} className="text-xs">もっと見る →</SectionLink>
      </div>
      {/* -my-1.5 keeps the visual rhythm of the list while each row still
          offers a 44px tap target. */}
      <div className="-my-1.5">
        {rows.map((row) => (
          <Link
            key={row.team.id}
            href={`/teams/${row.team.id}`}
            className={`flex min-h-[44px] items-center gap-2.5 rounded-sm text-sm transition hover:text-accent-2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
              row.team.id === teamId ? "font-semibold text-foreground" : ""
            }`}
          >
            <span className="w-3 text-xs font-bold text-muted">{row.rank}</span>
            <TeamBadge team={row.team} size={20} />
            <span className="min-w-0 flex-1 leading-tight text-foreground">{getTeamNameJa(row.team.id)?.short ?? row.team.shortName}</span>
            <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-bold text-foreground">
              {format(row.value)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
