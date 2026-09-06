"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Match, Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";

const DURATION_MS = 32000;
const HOVER_PLAYBACK_RATE = 0.5;
// Below this many pixels of horizontal movement, a left-button press-and-move is
// still treated as a click (so tapping a ticket keeps navigating to its match).
const DRAG_THRESHOLD_PX = 5;

// Keeps a drag offset within (-half, 0] by wrapping rather than clamping — since
// the ticket list is exactly duplicated for the seamless auto-scroll loop, wrapping
// by one half-width lands on a visually identical frame, so dragging past either
// edge loops around instead of hitting a hard stop.
function wrapOffset(value: number, half: number): number {
  if (half <= 0) return 0;
  const m = value % half;
  return m > 0 ? m - half : m;
}

function kickoffTime(utcDate: string): string {
  return new Date(utcDate).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

function Ticket({
  match,
  teamById,
  clickable,
}: {
  match: Match;
  teamById: Record<number, Team>;
  clickable: boolean;
}) {
  const home = teamById[match.homeTeamId];
  const away = teamById[match.awayTeamId];
  if (!home || !away) return null;

  const content = (
    <div className="marquee-ticket flex shrink-0 select-none items-center gap-2.5 border border-border bg-surface px-3.5 py-2.5 transition">
      <TeamBadge team={home} size={22} />
      <span
        className={`font-[family-name:var(--font-display)] text-sm font-bold ${
          match.played ? "text-foreground" : "text-muted"
        }`}
      >
        {match.played ? `${match.homeGoals} - ${match.awayGoals}` : kickoffTime(match.utcDate)}
      </span>
      <TeamBadge team={away} size={22} />
    </div>
  );

  if (!clickable) return content;
  return (
    <Link href={`/matches/${match.id}`} className="shrink-0">
      {content}
    </Link>
  );
}

export default function LatestResultsMarquee({
  matches,
  teamById,
  matchday,
  clickableMatchIds,
}: {
  matches: Match[];
  teamById: Record<number, Team>;
  matchday: number;
  clickableMatchIds: Set<number>;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeTicketRef = useRef<HTMLElement | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const pressingRef = useRef(false);
  const draggingRef = useRef(false);
  const suppressNextClickRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const reducedMotionRef = useRef(false);

  function startAnimation(startTimeMs: number) {
    const row = rowRef.current;
    if (!row || reducedMotionRef.current) return;
    const animation = row.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }],
      { duration: DURATION_MS, iterations: Infinity, easing: "linear" }
    );
    animation.currentTime = startTimeMs;
    animationRef.current = animation;
  }

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    startAnimation(0);
    return () => animationRef.current?.cancel();
  }, []);

  // The ticket cards keep sliding under a stationary cursor, but the browser only
  // re-evaluates CSS :hover on real pointer movement — not on an element moving
  // out from under it — so a plain :hover highlight would stick to whichever
  // ticket happened to be under the cursor when it first entered. Track the
  // pointer position ourselves and re-check what's actually underneath it every
  // frame instead.
  function trackActiveTicket() {
    const pointer = pointerRef.current;
    const el = pointer ? document.elementFromPoint(pointer.x, pointer.y) : null;
    const ticket = el ? (el.closest(".marquee-ticket") as HTMLElement | null) : null;
    if (ticket !== activeTicketRef.current) {
      activeTicketRef.current?.classList.remove("is-active");
      ticket?.classList.add("is-active");
      activeTicketRef.current = ticket;
    }
    rafRef.current = requestAnimationFrame(trackActiveTicket);
  }

  function stopTrackingActiveTicket() {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    activeTicketRef.current?.classList.remove("is-active");
    activeTicketRef.current = null;
  }

  useEffect(() => stopTrackingActiveTicket, []);

  // Called once an in-progress left-button press has moved past the drag
  // threshold: freezes the auto-scroll where it stood so dragging can take over.
  // Re-baselines the drag origin to this exact pointer position (rather than the
  // original mousedown point) so the few pixels of "dead zone" travel used up
  // getting past the threshold aren't double-counted as drag distance.
  function beginDrag(clientX: number) {
    const row = rowRef.current;
    if (!row) return;
    const computed = getComputedStyle(row).transform;
    const currentOffset = computed && computed !== "none" ? new DOMMatrixReadOnly(computed).m41 : 0;
    animationRef.current?.cancel();
    animationRef.current = null;
    draggingRef.current = true;
    dragStartXRef.current = clientX;
    dragStartOffsetRef.current = currentOffset;
    currentOffsetRef.current = currentOffset;
    row.style.transform = `translateX(${currentOffset}px)`;
    // Only capture the pointer once a real drag is confirmed — capturing on every
    // mousedown (even a plain click) makes some browsers stop routing the
    // resulting click to the actual link underneath, breaking navigation.
    if (pointerIdRef.current != null) wrapperRef.current?.setPointerCapture(pointerIdRef.current);
  }

  function endPress() {
    pressingRef.current = false;
    if (!draggingRef.current) return;
    draggingRef.current = false;
    suppressNextClickRef.current = true;
    const row = rowRef.current;
    if (!row) return;
    row.style.transform = "";
    const halfWidth = row.scrollWidth / 2 || 1;
    const progress = Math.abs(currentOffsetRef.current) / halfWidth;
    startAnimation(progress * DURATION_MS);
    // The pointer is still resting on the strip right after a drag, so keep it
    // at the slowed-down "hovering" rate rather than snapping back to full speed.
    if (animationRef.current) animationRef.current.playbackRate = HOVER_PLAYBACK_RATE;
  }

  if (matches.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted">第{matchday}節</p>
      <div
        ref={wrapperRef}
        className="-mx-4 overflow-hidden px-4 sm:mx-0 sm:px-0"
        onClickCapture={(e) => {
          if (!suppressNextClickRef.current) return;
          suppressNextClickRef.current = false;
          e.preventDefault();
          e.stopPropagation();
        }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          pressingRef.current = true;
          dragStartXRef.current = e.clientX;
          pointerIdRef.current = e.pointerId;
        }}
        onPointerMove={(e) => {
          pointerRef.current = { x: e.clientX, y: e.clientY };
          if (animationRef.current) animationRef.current.playbackRate = HOVER_PLAYBACK_RATE;
          if (rafRef.current == null) trackActiveTicket();

          if (!pressingRef.current) return;
          if (!draggingRef.current) {
            if (Math.abs(e.clientX - dragStartXRef.current) < DRAG_THRESHOLD_PX) return;
            beginDrag(e.clientX);
          }
          const row = rowRef.current;
          if (!row) return;
          const halfWidth = row.scrollWidth / 2;
          const delta = e.clientX - dragStartXRef.current;
          const next = wrapOffset(dragStartOffsetRef.current + delta, halfWidth);
          currentOffsetRef.current = next;
          row.style.transform = `translateX(${next}px)`;
        }}
        onPointerUp={endPress}
        onPointerCancel={endPress}
        onPointerLeave={() => {
          if (draggingRef.current) return;
          if (animationRef.current) animationRef.current.playbackRate = 1;
          pointerRef.current = null;
          stopTrackingActiveTicket();
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        <div ref={rowRef} className="flex w-max gap-2">
          {[...matches, ...matches].map((m, i) => (
            <Ticket key={`${m.id}-${i}`} match={m} teamById={teamById} clickable={clickableMatchIds.has(m.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
