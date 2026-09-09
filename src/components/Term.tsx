"use client";

import { useId, useState } from "react";
import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";

/**
 * A word that explains itself where it stands.
 *
 * A glossary page would send the reader somewhere else, and they do not come
 * back — "置いていかない" means not breaking the line they are reading, so the
 * explanation opens underneath the word and the URL never changes.
 *
 * The affordance is a dotted underline and a small mark, not a colour: colour on
 * this site belongs to clubs, and `--info` is reserved for meaning rather than
 * decoration. The mark is part of the button so the tap target covers the word
 * and the mark together rather than the mark alone.
 */
export default function Term({
  name,
  label,
  className = "",
}: {
  name: GlossaryKey;
  /**
   * Overrides the printed word where a heading says it differently, or `null`
   * to print only the mark — for a heading that already says the word and would
   * otherwise say it twice.
   */
  label?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const entry = GLOSSARY[name];

  return (
    <span className={`inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className={`inline-flex items-baseline gap-1 text-left ${label === null ? "" : "border-b border-dotted border-muted"} transition hover:border-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
      >
        {label === null ? null : (label ?? entry.term)}
        <span
          aria-hidden="true"
          className="translate-y-[-0.1em] rounded-full border border-current px-[0.32em] text-[0.72em] leading-tight opacity-70"
        >
          ?
        </span>
        <span className="sr-only">
          {label === null ? entry.term : ""}
          {open ? "の説明を閉じる" : "の説明を開く"}
        </span>
      </button>
      <span
        id={id}
        hidden={!open}
        className="mt-1.5 block rounded-md border border-border bg-surface-2 px-2.5 py-2 text-[11px] font-normal leading-relaxed text-muted"
      >
        {entry.body}
      </span>
    </span>
  );
}
