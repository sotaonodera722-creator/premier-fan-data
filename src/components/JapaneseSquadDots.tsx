import type { JapanesePlayerSummary, JapaneseRoundStatus } from "@/lib/types";

// One mark per Japanese player in the league — nine of them, which is few enough
// to draw individually. The count above says how many played; this says which
// nine those are out of, and what happened to the rest, in the width of a tile.
//
// The marks cannot carry that on their own: a shade of grey means nothing until
// something names it, and a title attribute never appears under a thumb. So the
// key below is always visible, and it is the key — not a tooltip — that makes
// the row readable. It doubles as the breakdown, so it earns its line.
const MARK: Record<JapaneseRoundStatus, string> = {
  played: "bg-foreground",
  benched: "bg-foreground/40",
  absent: "border border-border bg-surface-2",
  unknown: "border border-dashed border-border",
  pending: "border border-dashed border-accent-2/60",
};

const STATUS_LABEL: Record<JapaneseRoundStatus, string> = {
  played: "出場",
  benched: "ベンチ",
  absent: "メンバー外",
  unknown: "未取得",
  pending: "これから",
};

// Best news first, so the row and its key read in the same direction.
const ORDER: JapaneseRoundStatus[] = ["played", "benched", "absent", "unknown", "pending"];

export default function JapaneseSquadDots({ summaries }: { summaries: JapanesePlayerSummary[] }) {
  if (summaries.length === 0) return null;

  const present = ORDER.map((status) => ({
    status,
    count: summaries.filter((s) => s.roundStatus === status).length,
  })).filter((g) => g.count > 0);

  return (
    <span className="mt-inline block">
      <span
        role="img"
        aria-label={`日本人選手${summaries.length}人の内訳: ${present
          .map((g) => `${STATUS_LABEL[g.status]}${g.count}人`)
          .join("、")}`}
        className="flex flex-wrap gap-hair"
      >
        {summaries.map((s) => (
          <span
            key={s.player.id}
            aria-hidden="true"
            className={`h-2 w-2 rounded-[1px] ${MARK[s.roundStatus]}`}
          />
        ))}
      </span>
      <span className="mt-hair flex flex-wrap gap-x-inline gap-y-hair text-micro leading-tight text-muted">
        {present.map((g) => (
          <span key={g.status} className="flex items-center gap-hair">
            <span className={`h-2 w-2 shrink-0 rounded-[1px] ${MARK[g.status]}`} aria-hidden="true" />
            {STATUS_LABEL[g.status]}
            <span className="tabular-nums text-foreground">{g.count}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
