import Link from "next/link";
import type { Player, Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import SectionHeading from "@/components/SectionHeading";

export type RankingEntry = { player: Player; value: number };

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
            <Link href={moreHref} className="text-sm font-medium text-accent-2 hover:underline">
              もっと見る →
            </Link>
          )
        }
      />
      <div className="glass divide-y divide-border rounded-xl">
        {entries.map(({ player: p, value }, i) => {
          const team = teamById[p.teamId];
          return (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2"
            >
              <span className="w-5 text-sm font-bold text-muted">{i + 1}</span>
              {team && <TeamBadge team={team} size={28} />}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                  {p.isJapanese && "🇯🇵"} {p.name}
                </p>
                <p className="truncate text-xs text-muted">{team?.name}</p>
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
