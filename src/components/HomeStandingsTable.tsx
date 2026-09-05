import Link from "next/link";
import type { Team } from "@/lib/types";
import { getForm } from "@/lib/data";
import { getTeamColor } from "@/lib/teamColors";
import TeamBadge from "@/components/TeamBadge";
import FormPills from "@/components/FormPills";

export default function HomeStandingsTable({ standings }: { standings: Team[] }) {
  return (
    <div className="glass overflow-hidden rounded-xl">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-background-alt text-left uppercase tracking-wide text-muted">
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">チーム</th>
            <th className="px-3 py-2 text-center font-medium">差</th>
            <th className="px-3 py-2 text-center font-medium">勝点</th>
            <th className="px-3 py-2 font-medium">フォーム</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team) => {
            const r = team.record;
            const pos = r?.position ?? 0;
            const isCL = pos > 0 && pos <= 4;
            const isRelegation = pos >= standings.length - 2;
            return (
              <tr key={team.id} className="relative border-t border-border transition hover:bg-surface-2">
                <td className="relative px-3 py-2">
                  <span
                    className="absolute inset-y-0 left-0 w-[3px]"
                    style={{ backgroundColor: getTeamColor(team.id) }}
                  />
                  <span className="font-[family-name:var(--font-display)] font-bold text-foreground">
                    {pos || "-"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/teams/${team.id}`} className="flex items-center gap-2">
                    <TeamBadge team={team} size={20} />
                    <span className="truncate font-medium text-foreground">{team.shortName}</span>
                    {isCL && <span className="shrink-0 text-[9px] font-bold text-success">CL</span>}
                    {isRelegation && <span className="shrink-0 text-[9px] font-bold text-danger">降格</span>}
                  </Link>
                </td>
                <td className="px-3 py-2 text-center text-muted">
                  {r ? (r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff) : "-"}
                </td>
                <td className="px-3 py-2 text-center font-bold text-foreground">{r?.points ?? "-"}</td>
                <td className="px-3 py-2">
                  <FormPills form={getForm(team.id, 5)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
