"use client";

import { useEffect, useRef } from "react";

// Below this many pixels of horizontal movement, a left-button press-and-move is
// still treated as a click (so tapping a round pill keeps switching rounds).
const DRAG_THRESHOLD_PX = 5;

/**
 * The round selector. Thirty-eight pills never fit on a phone, so the strip
 * scrolls — which used to leave the selected round off-screen whenever the
 * reader arrived on a late round or paged through with the arrows. It now
 * centres itself on the selection instead, and the selection is scrolled into
 * view without moving the page.
 */
export default function MatchdayPills({
  rounds,
  matchday,
  onChange,
}: {
  rounds: number[];
  matchday: number;
  onChange: (matchday: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef({ pressing: false, dragging: false, startX: 0, startScrollLeft: 0 });
  const suppressClickRef = useRef(false);
  // The first alignment jumps; later ones follow the reader's own action and
  // should animate so the strip visibly moves rather than teleporting.
  const alignedOnceRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    const selected = selectedRef.current;
    if (!track || !selected) return;
    // scrollIntoView would scroll every ancestor, including the page. Only this
    // track should move, so the offset is applied to it directly.
    const target =
      selected.offsetLeft - track.clientWidth / 2 + selected.offsetWidth / 2;
    const max = track.scrollWidth - track.clientWidth;
    track.scrollTo({
      left: Math.max(0, Math.min(target, max)),
      behavior: alignedOnceRef.current ? "smooth" : "auto",
    });
    alignedOnceRef.current = true;
  }, [matchday]);

  return (
    <div
      ref={trackRef}
      className="no-scrollbar flex cursor-grab select-none gap-1.5 overflow-x-auto active:cursor-grabbing"
      role="group"
      aria-label="節を選ぶ"
      onClickCapture={(e) => {
        if (!suppressClickRef.current) return;
        suppressClickRef.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        dragRef.current.pressing = true;
        dragRef.current.startX = e.clientX;
        dragRef.current.startScrollLeft = trackRef.current?.scrollLeft ?? 0;
      }}
      onPointerMove={(e) => {
        const state = dragRef.current;
        if (!state.pressing) return;
        const delta = e.clientX - state.startX;
        if (!state.dragging) {
          if (Math.abs(delta) < DRAG_THRESHOLD_PX) return;
          state.dragging = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        if (trackRef.current) trackRef.current.scrollLeft = state.startScrollLeft - delta;
      }}
      onPointerUp={(e) => {
        const state = dragRef.current;
        if (state.dragging) {
          suppressClickRef.current = true;
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        state.pressing = false;
        state.dragging = false;
      }}
      onPointerCancel={() => {
        dragRef.current.pressing = false;
        dragRef.current.dragging = false;
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      {rounds.map((r) => (
        <button
          key={r}
          ref={r === matchday ? selectedRef : undefined}
          type="button"
          onClick={() => onChange(r)}
          aria-current={r === matchday ? "true" : undefined}
          className={`inline-flex min-h-[44px] shrink-0 items-center rounded-full px-3.5 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
            r === matchday
              ? "bg-accent font-semibold text-background"
              : "border border-border text-muted hover:text-foreground"
          }`}
        >
          第{r}節
        </button>
      ))}
    </div>
  );
}
