import Link from "next/link";
import { getStandings, getTeamById, getHeadToHead } from "@/lib/data";
import { jstYearMonth } from "@/lib/datetime";
import { getTeamNameJa, teamNameShort } from "@/lib/teamNamesJa";
null
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
          className="inline-flex min-h-[44px] items-center rounded-lg bg-accent px-5 text-sm font-semibold text-background transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          比較する
        </button>
      </form>

      {sameTeam && (
        <p className="mt-8 text-center text-sm text-muted">同じチームは比較できません。異なる2チームを選んでください。</p>
      )}

      {teamA && teamB && !sameTeam && (
        <>
          {/* Two clubs side by side does not survive 375px. Halving the width
              left 111px for a club name and squeezed the stat labels into a
              15px column, where 「得失点差」 came out one character per line.
              They stack until there is room; TeamSummary already centres itself
              below sm, so the stacked form needs nothing else. */}
          <section className="mt-10 grid grid-cols-1 items-center gap-6 sm:grid-cols-2 sm:gap-8">
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
                {/* Same width squeeze as the match page: a third of 375px leaves about
                    80px inside p-4, which fits Brentford but breaks ブレントフォード. */}
                <div className="glass grid grid-cols-3 divide-x divide-border rounded-xl text-center">
                  <div className="px-2 py-4">
                    <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-accent">
                      {h2h.teamAWins}
                    </p>
                    <p className="mt-1 text-[11px] leading-tight text-muted">
                      <span className="block">{teamNameShort(teamA)}</span>
                      勝利
                    </p>
                  </div>
                  <div className="px-2 py-4">
                    <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">
                      {h2h.draws}
                    </p>
                    <p className="mt-1 text-[11px] leading-tight text-muted">
                      <span className="block">両者</span>
                      引き分け
                    </p>
                  </div>
                  <div className="px-2 py-4">
                    <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-accent-2">
                      {h2h.teamBWins}
                    </p>
                    <p className="mt-1 text-[11px] leading-tight text-muted">
                      <span className="block">{teamNameShort(teamB)}</span>
                      勝利
                    </p>
                  </div>
                </div>

                <div className="glass mt-4 divide-y divide-border rounded-xl">
                  {h2h.matches.map((m, i) => {
                    const home = getTeamById(m.homeTeamId);
                    const away = getTeamById(m.awayTeamId);
                    return (
                      // The date sat beside the fixture and left the clubs 84px each,
                      // which fits Brentford but not ブレントフォード. Same fix as the
                      // head-to-head block on the match page.
                      <div key={i} className="px-4 py-2.5">
                        <p className="text-[11px] leading-tight text-muted">{jstYearMonth(m.utcDate)}</p>
                        <div className="mt-1 flex items-center gap-3 text-sm">
                          <span className="flex-1 truncate text-right text-foreground">{home && teamNameShort(home)}</span>
                          <span className="font-[family-name:var(--font-display)] font-bold text-foreground">
                            {m.homeGoals} - {m.awayGoals}
                          </span>
                          <span className="flex-1 truncate text-foreground">{away && teamNameShort(away)}</span>
                        </div>
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
        className="min-h-[44px] rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        <option value="" disabled>
          チームを選択
        </option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {getTeamNameJa(t.id)?.full ?? t.name}
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
      <Link href={`/teams/${team.id}`} className="group flex items-center gap-3">
        <TeamBadge team={team} size={40} />
        <span className="text-lg font-bold leading-tight text-foreground transition group-hover:text-accent-2">
          {getTeamNameJa(team.id)?.full ?? team.name}
        </span>
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
