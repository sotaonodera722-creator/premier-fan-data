import Link from "next/link";
import type { Player, Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import { teamNameShort } from "@/lib/teamNamesJa";
import SectionHeading from "@/components/SectionHeading";
import SectionLink from "@/components/SectionLink";

export type RankingEntry = { player: Player; value: number; rank: number };

export default function PlayerRankingList({
  title,
  entries,
  teamById,
  emptyLabel,
  valueSuffix,
  moreHref,
}: {
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
                <p className="flex items-center gap-1.5 text-sm font-medium leading-snug text-foreground">
                  {p.isJapanese && "🇯🇵"} <span className="line-clamp-2">{p.nameJa ?? p.name}</span>
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
