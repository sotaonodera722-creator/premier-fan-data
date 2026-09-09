import Link from "next/link";
import type { Player, Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import { teamNameShort } from "@/lib/teamNamesJa";
import SectionHeading from "@/components/SectionHeading";
import SectionLink from "@/components/SectionLink";

export type RankingEntry = { player: Player; value: number; rank: number };

export default function PlayerRankingList({
  eyebrow,
  title,
  entries,
  teamById,
  emptyLabel,
  valueSuffix,
  moreHref,
}: {
  eyebrow: string;
  title: string;
  entries: RankingEntry[];
  teamById: Record<number, Team>;
  emptyLabel: string;
  valueSuffix?: string;
  moreHref?: string;
}) {
  return (
    <div>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        action={
          moreHref && (
            <SectionLink href={moreHref}>もっと見る →</SectionLink>
          )
        }
      />
      <div className="glass divide-y divide-border rounded-xl">
        {entries.map(({ player: p, value, rank }) => {
          const team = teamById[p.teamId];
          return (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2"
            >
              <span className="w-5 text-sm font-bold tabular-nums text-muted">{rank}</span>
              {team && <TeamBadge team={team} size={28} />}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                  {p.isJapanese && "🇯🇵"} {p.nameJa ?? p.name}
                </p>
                <p className="truncate text-xs text-muted">{team && teamNameShort(team)}</p>
              </div>
              <span className="font-[family-name:var(--font-display)] text-xl font-bold text-accent">
                {value}
                {valueSuffix && <span className="ml-0.5 text-xs font-medium text-muted">{valueSuffix}</span>}
              </span>
            </Link>
          );
        })}
        {entries.length === 0 && <p className="p-4 text-sm text-muted">{emptyLabel}のデータがまだありません。</p>}
      </div>
    </div>
  );
}
