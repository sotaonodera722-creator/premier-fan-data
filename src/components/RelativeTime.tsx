"use client";

import { useSyncExternalStore } from "react";
import { jstRelativeKickoff } from "@/lib/datetime";

// Relative wording ("今夜", "3時間前") can only be computed against the reader's
// actual clock. The site is statically generated and redeployed every few hours,
// so anything relative baked in at build time starts lying almost immediately.
// These components therefore render nothing on the server and fill in after
// hydration, alongside — never instead of — an absolute date in the markup.
const MINUTE_MS = 60_000;

function subscribeToMinuteTicks(onTick: () => void) {
  const id = setInterval(onTick, MINUTE_MS);
  return () => clearInterval(id);
}

// Snapshots are the current minute, not the current millisecond, so the value is
// stable between ticks — a millisecond snapshot would re-render on every read.
// The server snapshot is null, which is what keeps these components empty until
// hydration rather than shipping a stale label in the HTML.
function useNow(): Date | null {
  const minute = useSyncExternalStore(
    subscribeToMinuteTicks,
    () => Math.floor(Date.now() / MINUTE_MS),
    () => null
  );
  return minute === null ? null : new Date(minute * MINUTE_MS);
}

function timeAgo(iso: string, now: Date): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  if (diffMs < 0) return "まもなく";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

/** "3時間前". Renders nothing until the client knows what time it is. */
export function TimeAgo({
  iso,
  className,
  parenthesized = false,
}: {
  iso: string;
  className?: string;
  parenthesized?: boolean;
}) {
  const now = useNow();
  if (!now) return null;
  const label = timeAgo(iso, now);
  return <span className={className}>{parenthesized ? `（${label}）` : label}</span>;
}

/**
 * "今夜 22:00" / "明日未明 00:30". Renders nothing for kickoffs more than a day
 * out, where the absolute date beside it already reads clearly.
 */
export function RelativeKickoff({ iso, className }: { iso: string; className?: string }) {
  const now = useNow();
  if (!now) return null;
  const label = jstRelativeKickoff(iso, now);
  if (!label) return null;
  return <span className={className}>{label}</span>;
}
