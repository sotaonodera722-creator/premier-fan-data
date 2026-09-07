import type { JapanesePlayerSummary, JapaneseRoundStatus } from "@/lib/types";

// One mark per Japanese player in the league — nine of them, which is few enough
// to draw individually. The count above the row says how many played; this says
// which nine those are out of, and what happened to the rest, in the width of a
// tile. Solid fill down to an empty outline reads as "most involved" to "least"
// without needing a key.
const MARK: Record<JapaneseRoundStatus, string> = {
  played: "bg-foreground",
  benched: "bg-foreground/40",
  absent: "border border-border bg-surface-2",
  unknown: "border border-dashed border-border",
  pending: "border border-dashed border-accent-2/60",
};

const STATUS_LABEL: Record<JapaneseRoundStatus, string> = {
  played: "出場",
  benched: "ベンチ入り・出番なし",
  absent: "メンバー外",
  unknown: "出場状況が未取得",
  pending: "所属クラブはこれから",
};

export default function JapaneseSquadDots({ summaries }: { summaries: JapanesePlayerSummary[] }) {
  if (summaries.length === 0) return null;
  return (
    <span className="mt-2 flex flex-wrap gap-1" aria-hidden="true">
      {summaries.map((s) => (
        <span
          key={s.player.id}
          title={`${s.player.nameJa ?? s.player.name} — ${STATUS_LABEL[s.roundStatus]}`}
          className={`h-2 w-2 rounded-[1px] ${MARK[s.roundStatus]}`}
        />
      ))}
    </span>
  );
}
