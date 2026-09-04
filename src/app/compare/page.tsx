import Link from "next/link";
import { getStandings, getTeamById, getHeadToHead } from "@/lib/data";
import TeamBadge from "@/components/TeamBadge";
import SectionHeading from "@/components/SectionHeading";
import StatTile from "@/components/StatTile";

export const metadata = {
  title: "チーム対戦成績比較 | Premier Fan Data",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  const teams = getStandings();

  const teamA = a ? getTeamById(Number(a)) : undefined;
  const teamB = b ? getTeamById(Number(b)) : undefined;
  const sameTeam = Boolean(teamA && teamB && teamA.id === teamB.id);
  const h2h = teamA && teamB && !sameTeam ? getHeadToHead(teamA.id, teamB.id) : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6">
      <SectionHeading eyebrow="Head to Head" title="チーム対戦成績比較" />

      <form className="glass flex flex-wrap items-end gap-3 rounded-xl p-4" action="/compare">
        <TeamSelect name="a" label="チームA" teams={teams} selected={teamA?.id} />
        <span className="pb-2.5 text-sm text-muted">vs</span>
        <TeamSelect name="b" label="チームB" teams={teams} selected={teamB?.id} />
        <button
          type="submit"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-110"
        >
          比較する
        </button>
      </form>

      {sameTeam && (
        <p className="mt-8 text-center text-sm text-muted">同じチームは比較できません。異なる2チームを選んでください。</p>
      )}

      {teamA && teamB && !sameTeam && (
        <>
          <section className="mt-10 grid grid-cols-2 items-center gap-4 sm:gap-8">
            <TeamSummary team={teamA} />
            <TeamSummary team={teamB} align="right" />
          </section>

          <section className="mt-10">
            <SectionHeading eyebrow="History" title="過去の対戦成績" />
            {!h2h || h2h.numberOfMatches === 0 ? (
              <p className="glass rounded-xl p-5 text-sm text-muted">
                過去の対戦データが見つかりませんでした(プレミアリーグでの直接対戦がまだ無い可能性があります)。
              </p>
            ) : (
              <>
                <div className="glass grid grid-cols-3 divide-x divide-border rounded-xl text-center">
                  <div className="p-4">
                    <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-accent">
                      {h2h.teamAWins}
                    </p>
                    <p className="mt-1 text-xs text-muted">{teamA.shortName} 勝利</p>
                  </div>
                  <div className="p-4">
                    <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">
                      {h2h.draws}
                    </p>
                    <p className="mt-1 text-xs text-muted">引き分け</p>
                  </div>
                  <div className="p-4">
                    <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-accent-2">
                      {h2h.teamBWins}
                    </p>
                    <p className="mt-1 text-xs text-muted">{teamB.shortName} 勝利</p>
                  </div>
                </div>

                <div className="glass mt-4 divide-y divide-border rounded-xl">
                  {h2h.matches.map((m, i) => {
                    const home = getTeamById(m.homeTeamId);
                    const away = getTeamById(m.awayTeamId);
                    return (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
                        <span className="w-20 shrink-0 text-xs text-muted">
                          {new Date(m.utcDate).toLocaleDateString("ja-JP", { year: "numeric", month: "short" })}
                        </span>
                        <span className="flex-1 truncate text-right text-foreground">{home?.shortName}</span>
                        <span className="font-[family-name:var(--font-display)] font-bold text-foreground">
                          {m.homeGoals} - {m.awayGoals}
                        </span>
                        <span className="flex-1 truncate text-foreground">{away?.shortName}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function TeamSelect({
  name,
  label,
  teams,
  selected,
}: {
  name: string;
  label: string;
  teams: ReturnType<typeof getStandings>;
  selected?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-muted">
      {label}
      <select
        name={name}
        defaultValue={selected ?? ""}
        className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground"
      >
        <option value="" disabled>
          チームを選択
        </option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function TeamSummary({ team, align = "left" }: { team: ReturnType<typeof getTeamById>; align?: "left" | "right" }) {
  if (!team) return null;
  const r = team.record;
  return (
    <div className={`flex flex-col items-center gap-3 ${align === "right" ? "sm:items-end" : "sm:items-start"}`}>
      <Link href={`/teams/${team.id}`} className="flex items-center gap-3">
        <TeamBadge team={team} size={40} />
        <span className="text-lg font-bold text-foreground">{team.name}</span>
      </Link>
      {r && (
        <div className="grid w-full grid-cols-3 gap-2 sm:max-w-xs">
          <StatTile label="順位" value={r.position} />
          <StatTile label="勝点" value={r.points} />
          <StatTile label="得失点差" value={r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff} />
        </div>
      )}
    </div>
  );
}
