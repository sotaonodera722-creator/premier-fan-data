import type { MatchResultLetter } from "@/lib/types";

// A ladder of ink, not a traffic light. Sixty coloured pills were the heaviest
// thing on the standings page, which meant the last three results outweighed
// the points that actually decide the order. Green and red stay for the two
// places in the table where colour carries meaning a reader has to act on: the
// movement arrow and the zone bands.
//
// The three steps are far enough apart to read at a glance without the letters,
// and the letters are there anyway.
const STYLES: Record<MatchResultLetter, string> = {
  W: "bg-foreground text-background",
  D: "bg-foreground/25 text-foreground",
  L: "bg-foreground/8 text-muted",
};

const RESULT_NAMES: Record<MatchResultLetter, string> = {
  W: "勝ち",
  D: "引き分け",
  L: "負け",
};

export default function FormPills({ form }: { form: MatchResultLetter[] }) {
  if (!form.length) return <span className="text-note text-muted">—</span>;
  return (
    <div
      className="flex gap-hair"
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
          className={`flex h-5 w-5 items-center justify-center text-micro font-strong ${STYLES[r]}`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}
