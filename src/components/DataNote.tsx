// A one-line caveat set in the margin voice: sample size, or the fact that a
// number was derived rather than published. Deliberately not a card — these
// notes sit under the thing they qualify and must never compete with it.
export default function DataNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 border-l-2 border-border pl-3 text-[11px] leading-relaxed text-muted">
      {children}
    </p>
  );
}
