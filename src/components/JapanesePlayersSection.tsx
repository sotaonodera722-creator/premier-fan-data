import Link from "next/link";
import type { Player, Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";

export default function JapanesePlayersSection({
  players,
  teamById,
}: {
  players: Player[];
  teamById: Record<number, Team>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
      {players.map((p) => {
        const team = teamById[p.teamId];
        return (
          <Link
            key={p.id}
            href={`/players/${p.id}`}
            className="glass flex flex-col gap-3 rounded-xl p-4 transition hover:-translate-y-0.5 hover:border-accent-2/50"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-bold text-muted">
                {p.position}
              </span>
              <span>🇯🇵</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{p.name}</p>
            {team && (
              <div className="mt-auto flex items-center gap-2 border-t border-border pt-2.5">
                <TeamBadge team={team} size={22} />
                <span className="truncate text-xs text-muted">{team.name}</span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
