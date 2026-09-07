import Link from "next/link";
import type { JapanesePlayerSummary, JapaneseRoundStatus, Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import { RelativeDay } from "@/components/RelativeTime";
import { getTeamNameJa } from "@/lib/teamNamesJa";
import { jstShortDate, jstTime, lateNightTag } from "@/lib/datetime";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// A full match is the reference length for the minutes bar; anyone who played
// through stoppage time simply fills it.
const FULL_MATCH_MINUTES = 90;

// "出場なし" is three different pieces of news, and collapsing them tells a
// reader following one player something that isn't true. The wording here keeps
// them apart, and the order runs from best to worst so the list reads downhill.
const GROUPS: { status: JapaneseRoundStatus; heading: string; note: string }[] = [
  {
    status: "benched",
    heading: "ベンチ入り・出番なし",
    note: "メンバーには入ったが、ピッチには立たなかった選手",
  },
  {
    status: "absent",
    heading: "メンバー外",
    note: "この試合の18人に入らなかった選手（負傷・出場停止かどうかはデータがないため不明）",
  },
  {
    status: "unknown",
    heading: "出場状況が未取得",
    note: "この試合のラインナップをまだ取得できていません",
  },
  {
    status: "pending",
    heading: "所属クラブはこれから",
    note: "この節の試合がまだキックオフしていない選手",
  },
];

function clubLabel(team: Team): string {
  return getTeamNameJa(team.id)?.short ?? team.shortName;
}

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

/** The full card, for players who were actually on the pitch this round. */
function PlayedCard({
  summary,
  matchday,
  teamById,
}: {
  summary: JapanesePlayerSummary;
  matchday: number;
  teamById: Record<number, Team>;
}) {
  const { player, round, minutes, appearances } = summary;
  const team = teamById[player.teamId];
  const roundMinutes = round?.minutes ?? 0;
  const fill = Math.min(100, Math.round((roundMinutes / FULL_MATCH_MINUTES) * 100));

  return (
    <Link
      href={`/players/${player.id}`}
      className={`glass flex flex-col gap-3 rounded-xl p-4 transition hover:-translate-y-0.5 hover:border-accent-2/50 ${FOCUS_RING}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-bold text-muted">
          {player.position}
        </span>
        <span className="whitespace-nowrap text-[10px] text-muted">第{matchday}節</span>
      </div>

      <p className="text-sm font-semibold leading-snug text-foreground">{player.nameJa ?? player.name}</p>

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
          <span className="whitespace-nowrap text-[11px] text-muted">{clubLabel(team)}</span>
        </div>
      )}
    </Link>
  );
}

/** One row per player for everyone who did not take the pitch. */
function StatusGroup({
  heading,
  note,
  players,
  teamById,
  showKickoff,
}: {
  heading: string;
  note: string;
  players: JapanesePlayerSummary[];
  teamById: Record<number, Team>;
  /** Their club has not kicked off yet, so the row says when it does. */
  showKickoff?: boolean;
}) {
  if (players.length === 0) return null;
  return (
    <div className="mt-6">
      <h3 className="text-xs font-semibold text-foreground">
        {heading}
        <span className="ml-1.5 font-normal tabular-nums text-muted">{players.length}人</span>
      </h3>
      <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{note}</p>
      <ul className="glass mt-2.5 divide-y divide-border overflow-hidden rounded-xl">
        {players.map(({ player, minutes, appearances, roundMatch }) => {
          const team = teamById[player.teamId];
          return (
            <li key={player.id}>
              <Link
                href={`/players/${player.id}`}
                className={`flex min-h-[44px] items-center gap-2.5 px-3 py-2.5 transition hover:bg-surface-2 ${FOCUS_RING}`}
              >
                {team && <TeamBadge team={team} size={20} />}
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] leading-tight text-foreground">
                    {player.nameJa ?? player.name}
                  </span>
                  <span className="block text-[10px] leading-tight text-muted">
                    {team ? clubLabel(team) : ""}
                  </span>
                </span>
                {showKickoff && roundMatch ? (
                  <span className="shrink-0 text-right text-[11px] leading-tight text-muted">
                    <RelativeDay iso={roundMatch.utcDate} className="mr-1 text-accent-2" />
                    <span className="tabular-nums">{jstShortDate(roundMatch.utcDate)}</span>{" "}
                    <span className="tabular-nums text-foreground">{jstTime(roundMatch.utcDate)}</span>
                    {lateNightTag(roundMatch.utcDate) && (
                      <span className="block text-[10px]">{lateNightTag(roundMatch.utcDate)}</span>
                    )}
                  </span>
                ) : (
                  <span className="shrink-0 whitespace-nowrap text-[11px] tabular-nums text-muted">
                    {minutes ? `今季 ${appearances}試合・${minutes}分` : "今季の出場記録なし"}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
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
  const played = summaries.filter((s) => s.roundStatus === "played");

  if (summaries.length === 0) {
    return (
      <p className="glass rounded-xl p-5 text-sm text-muted">
        プレミアリーグに在籍する日本人選手のデータが見つかりませんでした。
      </p>
    );
  }

  return (
    <div>
      {played.length > 0 ? (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {played.map((summary) => (
            <PlayedCard
              key={summary.player.id}
              summary={summary}
              matchday={matchday}
              teamById={teamById}
            />
          ))}
        </div>
      ) : (
        <p className="glass rounded-xl p-4 text-sm text-muted">
          第{matchday}節でピッチに立った日本人選手はまだいません。
        </p>
      )}

      {GROUPS.map((group) => (
        <StatusGroup
          key={group.status}
          heading={group.heading}
          note={group.note}
          players={summaries.filter((s) => s.roundStatus === group.status)}
          teamById={teamById}
          showKickoff={group.status === "pending"}
        />
      ))}
    </div>
  );
}
