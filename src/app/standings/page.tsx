import Link from "next/link";
import { getStandings, getCurrentMatchday, getForm, getUpcomingFixtures, getTeamById } from "@/lib/data";
import { getTeamColor } from "@/lib/teamColors";
import TeamBadge from "@/components/TeamBadge";
import FormPills from "@/components/FormPills";
import SectionHeading from "@/components/SectionHeading";

export const metadata = {
  title: "順位表 | Premier Fan Data",
};

export default function StandingsPage() {
  const standings = getStandings();
  const matchday = getCurrentMatchday();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      <SectionHeading eyebrow={`Matchday ${matchday}`} title="順位表" />
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="bg-background-alt text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">チーム</th>
              <th className="px-4 py-3 font-medium text-center">試合</th>
              <th className="px-4 py-3 font-medium text-center">勝</th>
              <th className="px-4 py-3 font-medium text-center">分</th>
              <th className="px-4 py-3 font-medium text-center">敗</th>
              <th className="px-4 py-3 font-medium text-center">得点</th>
              <th className="px-4 py-3 font-medium text-center">失点</th>
              <th className="px-4 py-3 font-medium text-center">得失点差</th>
              <th className="px-4 py-3 font-medium text-center">勝点</th>
              <th className="px-4 py-3 font-medium">フォーム</th>
              <th className="px-4 py-3 font-medium">次戦</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team) => {
              const r = team.record;
              const pos = r?.position ?? 0;
              const isCL = pos > 0 && pos <= 4;
              const isRelegation = pos >= standings.length - 2;
              const nextFixture = getUpcomingFixtures(team.id, 1)[0];
              const nextOpponent = nextFixture
                ? getTeamById(nextFixture.homeTeamId === team.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)
                : undefined;

              return (
                <tr key={team.id} className="relative border-t border-border transition hover:bg-surface-2">
                  <td className="relative px-4 py-3">
                    <span
                      className="absolute inset-y-0 left-0 w-[3px]"
                      style={{ backgroundColor: getTeamColor(team.id) }}
                    />
                    <span className="font-[family-name:var(--font-display)] font-bold text-foreground">
                      {pos || "-"}
                    </span>
                    {isCL && <span className="ml-1.5 text-[9px] font-bold text-success">CL</span>}
                    {isRelegation && <span className="ml-1.5 text-[9px] font-bold text-danger">降格</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/teams/${team.id}`} className="flex items-center gap-3">
                      <TeamBadge team={team} size={30} />
                      <span className="font-medium text-foreground">{team.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center text-muted">{r?.played ?? "-"}</td>
                  <td className="px-4 py-3 text-center text-muted">{r?.wins ?? "-"}</td>
                  <td className="px-4 py-3 text-center text-muted">{r?.draws ?? "-"}</td>
                  <td className="px-4 py-3 text-center text-muted">{r?.losses ?? "-"}</td>
                  <td className="px-4 py-3 text-center text-muted">{r?.goalsFor ?? "-"}</td>
                  <td className="px-4 py-3 text-center text-muted">{r?.goalsAgainst ?? "-"}</td>
                  <td className="px-4 py-3 text-center text-muted">
                    {r ? (r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff) : "-"}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-foreground">{r?.points ?? "-"}</td>
                  <td className="px-4 py-3">
                    <FormPills form={getForm(team.id, 5)} />
                  </td>
                  <td className="px-4 py-3">
                    {nextOpponent ? (
                      <Link href={`/teams/${nextOpponent.id}`} title={nextOpponent.name}>
                        <TeamBadge team={nextOpponent} size={22} />
                      </Link>
                    ) : (
                      <span className="text-xs text-muted">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-5 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success" /> チャンピオンズリーグ圏
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-danger" /> 降格圏
        </span>
        <span className="text-muted">左端の色帯はクラブカラーです</span>
      </div>
    </div>
  );
}
