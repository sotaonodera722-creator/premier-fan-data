import type { MatchResultLetter } from "@/lib/types";

const STYLES: Record<MatchResultLetter, string> = {
  W: "bg-success text-white",
  D: "bg-surface-2 text-muted",
  L: "bg-danger text-white",
};

export default function FormPills({ form }: { form: MatchResultLetter[] }) {
  if (!form.length) return <span className="text-xs text-muted">—</span>;
  return (
    <div className="flex gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          className={`flex h-5 w-5 items-center justify-center text-[10px] font-bold ${STYLES[r]}`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}
