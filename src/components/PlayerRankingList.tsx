import Link from "next/link";
import type { Player, Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import SectionHeading from "@/components/SectionHeading";

export default function PlayerRankingList({
  eyebrow,
  title,
  players,
  teamById,
  statKey,
  statLabel,
}: {
  eyebrow: string;
  title: string;
  players: Player[];
  teamById: Record<number, Team>;
  statKey: "goals" | "assists";
  statLabel: string;
}) {
  return (
    <div>
      <SectionHeading eyebrow={eyebrow} title={title} />
      <div className="glass divide-y divide-border rounded-xl">
        {players.map((p, i) => {
          const team = teamById[p.teamId];
          return (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface/60"
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
                {p[statKey]}
              </span>
            </Link>
          );
        })}
        {players.length === 0 && (
          <p className="p-4 text-sm text-muted">{statLabel}のデータがまだありません。</p>
        )}
      </div>
    </div>
  );
}
