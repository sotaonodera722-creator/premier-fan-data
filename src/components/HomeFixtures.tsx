"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Match, Team } from "@/lib/types";
import TeamBadge from "@/components/TeamBadge";
import { useUrlParams } from "@/lib/useUrlParams";

// Below this many pixels of horizontal movement, a left-button press-and-move is
// still treated as a click (so tapping a round pill keeps switching rounds).
const DRAG_THRESHOLD_PX = 5;

function shortDate(utcDate: string): string {
  return new Date(utcDate).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" });
}

function kickoffTime(utcDate: string): string {
  return new Date(utcDate).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" });
}

export default function HomeFixtures({
  matches,
  teams,
  currentMatchday,
  initialRound,
  clickableMatchIds,
}: {
  matches: Match[];
  teams: Team[];
  currentMatchday: number;
  initialRound?: string;
  clickableMatchIds: Set<number>;
}) {
  const parsedInitialRound = Number(initialRound);
  const [matchday, setMatchdayState] = useState(
    Number.isInteger(parsedInitialRound) && parsedInitialRound >= 1 ? parsedInitialRound : currentMatchday
  );
  const pillTrackRef = useRef<HTMLDivElement>(null);
  const pillDragRef = useRef({ pressing: false, dragging: false, startX: 0, startScrollLeft: 0 });
  const suppressPillClickRef = useRef(false);
  const updateUrl = useUrlParams();

  function setMatchday(next: number) {
    setMatchdayState(next);
    updateUrl({ round: String(next) });
  }

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const maxMatchday = useMemo(() => matches.reduce((m, x) => Math.max(m, x.matchday), 1), [matches]);
  const rounds = useMemo(() => Array.from({ length: maxMatchday }, (_, i) => i + 1), [maxMatchday]);
  const roundMatches = useMemo(() => matches.filter((m) => m.matchday === matchday), [matches, matchday]);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMatchday(Math.max(1, matchday - 1))}
          disabled={matchday <= 1}
          aria-label="前の節"
          className="shrink-0 rounded-full border border-border p-1.5 text-muted transition hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="w-14 shrink-0 text-center text-sm font-semibold text-foreground">第{matchday}節</span>
        <button
          type="button"
          onClick={() => setMatchday(Math.min(maxMatchday, matchday + 1))}
          disabled={matchday >= maxMatchday}
          aria-label="次の節"
          className="shrink-0 rounded-full border border-border p-1.5 text-muted transition hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div
        ref={pillTrackRef}
        className="no-scrollbar mb-3 flex cursor-grab gap-1.5 overflow-x-auto select-none active:cursor-grabbing"
        onClickCapture={(e) => {
          if (!suppressPillClickRef.current) return;
          suppressPillClickRef.current = false;
          e.preventDefault();
          e.stopPropagation();
        }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          pillDragRef.current.pressing = true;
          pillDragRef.current.startX = e.clientX;
          pillDragRef.current.startScrollLeft = pillTrackRef.current?.scrollLeft ?? 0;
        }}
        onPointerMove={(e) => {
          const state = pillDragRef.current;
          if (!state.pressing) return;
          const delta = e.clientX - state.startX;
          if (!state.dragging) {
            if (Math.abs(delta) < DRAG_THRESHOLD_PX) return;
            state.dragging = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }
          if (pillTrackRef.current) pillTrackRef.current.scrollLeft = state.startScrollLeft - delta;
        }}
        onPointerUp={(e) => {
          const state = pillDragRef.current;
          if (state.dragging) {
            suppressPillClickRef.current = true;
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
          state.pressing = false;
          state.dragging = false;
        }}
        onPointerCancel={() => {
          pillDragRef.current.pressing = false;
          pillDragRef.current.dragging = false;
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        {rounds.map((r) => (
          <button
            key={r}
            onClick={() => setMatchday(r)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              r === matchday
                ? "bg-accent font-semibold text-background"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            第{r}節
          </button>
        ))}
      </div>

      <div className="glass divide-y divide-border overflow-hidden rounded-xl">
        {roundMatches.length === 0 && <p className="p-4 text-sm text-muted">この節の試合データがありません。</p>}
        {roundMatches.map((m) => {
          const home = teamById.get(m.homeTeamId);
          const away = teamById.get(m.awayTeamId);
          if (!home || !away) return null;
          const content = (
            <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm">
              <span className="w-16 shrink-0 text-[11px] text-muted">{shortDate(m.utcDate)}</span>
              <span className="flex flex-1 items-center justify-end gap-1.5 truncate">
                <span className="truncate text-foreground">{home.shortName}</span>
                <TeamBadge team={home} size={20} />
              </span>
              <span className="w-10 shrink-0 text-center font-[family-name:var(--font-display)] text-xs font-bold text-muted">
                {m.played ? `${m.homeGoals}-${m.awayGoals}` : kickoffTime(m.utcDate)}
              </span>
              <span className="flex flex-1 items-center gap-1.5 truncate">
                <TeamBadge team={away} size={20} />
                <span className="truncate text-foreground">{away.shortName}</span>
              </span>
            </div>
          );
          if (!clickableMatchIds.has(m.id)) return <div key={m.id}>{content}</div>;
          return (
            <Link key={m.id} href={`/matches/${m.id}`} className="block transition hover:bg-surface-2">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
