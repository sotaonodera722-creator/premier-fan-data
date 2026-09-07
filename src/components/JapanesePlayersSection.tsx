import Link from "next/link";
import type { JapanesePlayerSummary, Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// A full match is the reference length for the minutes bar; anyone who played through
// stoppage time simply fills it.
const FULL_MATCH_MINUTES = 90;

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="whitespace-nowrap text-[11px] text-muted">{label}</dt>
      <dd
        className={`font-[family-name:var(--font-display)] text-sm font-bold tabular-nums ${
          value > 0 ? "text-foreground" : "text-muted"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function PlayerChips({
  players,
  label,
  separated,
  teamById,
}: {
  players: JapanesePlayerSummary[];
  label: string;
  separated: boolean;
  teamById: Record<number, Team>;
}) {
  if (players.length === 0) return null;
  return (
    <div className={separated ? "mt-5 border-t border-border pt-5" : ""}>
      <p className="mb-2.5 text-xs text-muted">
        {label}（{players.length}人）
      </p>
      <div className="flex flex-wrap gap-2">
        {players.map(({ player, minutes, appearances }) => {
          const team = teamById[player.teamId];
          return (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className={`flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-3 py-2 transition hover:bg-surface-2 ${FOCUS_RING}`}
            >
              {team && <TeamBadge team={team} size={18} />}
              <span className="whitespace-nowrap text-xs text-foreground">{player.name}</span>
              <span className="whitespace-nowrap text-[11px] text-muted">
                {minutes ? `今季 ${appearances}試合・${minutes}分` : "出場記録なし"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function JapanesePlayersSection({
  summaries,
  matchday,
  teamById,
}: {
  summaries: JapanesePlayerSummary[];
  matchday: number;
  teamById: Record<number, Team>;
}) {
  // "Did not play" and "has not played yet" are different claims, and on a Sunday
  // morning half the round may still be to come — so a player whose club kicks off
  // later must not be filed under "did not feature".
  const thisRound = summaries.filter((s) => s.roundStatus === "played");
  const absent = summaries.filter((s) => s.roundStatus === "absent");
  const pending = summaries.filter((s) => s.roundStatus === "pending");

  return (
    <div>
      {thisRound.length > 0 && (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {thisRound.map(({ player, round, minutes, appearances }) => {
            const team = teamById[player.teamId];
            const roundMinutes = round?.minutes ?? 0;
            const fill = Math.min(100, Math.round((roundMinutes / FULL_MATCH_MINUTES) * 100));
            return (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className={`glass flex flex-col gap-3 rounded-xl p-4 transition hover:-translate-y-0.5 hover:border-accent-2/50 ${FOCUS_RING}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-bold text-muted">
                    {player.position}
                  </span>
                  <span className="whitespace-nowrap text-[10px] text-muted">第{matchday}節</span>
                </div>

                <p className="text-sm font-semibold leading-snug text-foreground">{player.name}</p>

                <div>
                  <p className="flex items-baseline gap-1">
                    <span className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums text-foreground">
                      {roundMinutes}
                    </span>
                    <span className="text-xs text-muted">分出場</span>
                  </p>
                  <div className="mt-1.5 h-1 w-full bg-surface-2" aria-hidden="true">
                    <div className="h-full bg-foreground" style={{ width: `${fill}%` }} />
                  </div>
                </div>

                <dl className="flex flex-col gap-1 border-t border-border pt-2.5">
                  <StatRow label="得点" value={round?.goals ?? 0} />
                  <StatRow label="アシスト" value={round?.assists ?? 0} />
                </dl>

                <p className="whitespace-nowrap text-[11px] text-muted">
                  今季 {appearances}試合・{minutes ?? 0}分
                </p>

                {team && (
                  <div className="mt-auto flex items-center gap-2 border-t border-border pt-2.5">
                    <TeamBadge team={team} size={20} />
                    <span className="whitespace-nowrap text-[11px] text-muted">{team.shortName}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      <PlayerChips
        players={absent}
        label={`第${matchday}節は出場なし`}
        separated={thisRound.length > 0}
        teamById={teamById}
      />
      <PlayerChips
        players={pending}
        label={`第${matchday}節はこれから`}
        separated={thisRound.length > 0 || absent.length > 0}
        teamById={teamById}
      />
    </div>
  );
}
