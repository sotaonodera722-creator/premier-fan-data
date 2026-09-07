import type { MatchResultLetter } from "@/lib/types";

const STYLES: Record<MatchResultLetter, string> = {
  W: "bg-success text-white",
  // A draw is the only outcome with no colour of its own, so it needs an edge to
  // read as a result rather than as an empty slot.
  D: "border border-border bg-surface-2 text-foreground",
  L: "bg-danger text-white",
};

const RESULT_NAMES: Record<MatchResultLetter, string> = {
  W: "勝ち",
  D: "引き分け",
  L: "負け",
};

export default function FormPills({ form }: { form: MatchResultLetter[] }) {
  if (!form.length) return <span className="text-xs text-muted">—</span>;
  return (
    <div
      className="flex gap-1"
      // W/D/L means nothing to a reader who does not already follow the league,
      // and the left-to-right order is not self-evident either.
      title={`直近${form.length}試合（左が古い）: ${form.map((r) => RESULT_NAMES[r]).join("・")}`}
      role="img"
      aria-label={`直近${form.length}試合、古い順に ${form.map((r) => RESULT_NAMES[r]).join("、")}`}
    >
      {form.map((r, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`flex h-5 w-5 items-center justify-center text-[10px] font-bold ${STYLES[r]}`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}
