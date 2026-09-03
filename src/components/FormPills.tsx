import type { MatchResultLetter } from "@/lib/types";

const STYLES: Record<MatchResultLetter, string> = {
  W: "bg-accent/15 text-accent border-accent/40",
  D: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
  L: "bg-danger/15 text-danger border-danger/40",
};

export default function FormPills({ form }: { form: MatchResultLetter[] }) {
  if (!form.length) return <span className="text-xs text-muted">—</span>;
  return (
    <div className="flex gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          className={`flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold ${STYLES[r]}`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}
