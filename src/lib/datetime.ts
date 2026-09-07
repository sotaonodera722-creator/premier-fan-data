// Every date and time on this site is Japan time. The product is built around
// "Sunday morning in Japan", so a kickoff rendered in any other zone is simply
// wrong — and a kickoff rendered without a weekday is unreadable, because the
// Premier League's Japanese schedule runs Saturday 20:30 through Monday 00:30.
//
// Everything that prints a date goes through this module so the wording stays
// identical across pages.

const JST = "Asia/Tokyo";
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

// Kickoffs at or after midnight and before this hour are colloquially "the
// previous night" in Japanese, so they get an explicit note saying so.
const LATE_NIGHT_UNTIL_HOUR = 5;

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: JST,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type JstParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** 0 = Sunday */
  dow: number;
  /** 日 / 月 / 火 … */
  weekday: string;
};

export function jstParts(input: string | Date): JstParts {
  const date = typeof input === "string" ? new Date(input) : input;
  const found: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type !== "literal") found[part.type] = part.value;
  }
  const dow = WEEKDAY_INDEX[found.weekday] ?? 0;
  return {
    year: Number(found.year),
    month: Number(found.month),
    day: Number(found.day),
    hour: Number(found.hour),
    minute: Number(found.minute),
    dow,
    weekday: WEEKDAYS[dow],
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** "04:00" */
export function jstTime(input: string | Date): string {
  const p = jstParts(input);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** "9/7(日)" */
export function jstShortDate(input: string | Date): string {
  const p = jstParts(input);
  return `${p.month}/${p.day}(${p.weekday})`;
}

/** "9月7日(日)" */
export function jstLongDate(input: string | Date): string {
  const p = jstParts(input);
  return `${p.month}月${p.day}日(${p.weekday})`;
}

/** "2026年9月7日(日)" */
export function jstFullDate(input: string | Date): string {
  const p = jstParts(input);
  return `${p.year}年${p.month}月${p.day}日(${p.weekday})`;
}

/** "2026年9月7日(日) 13:13" */
export function jstFullDateTime(input: string | Date): string {
  return `${jstFullDate(input)} ${jstTime(input)}`;
}

/** "9/7(日) 04:00" */
export function jstDateTime(input: string | Date): string {
  return `${jstShortDate(input)} ${jstTime(input)}`;
}

/** "2026年9月" — used for head-to-head rows where the day adds nothing. */
export function jstYearMonth(input: string | Date): string {
  const p = jstParts(input);
  return `${p.year}年${p.month}月`;
}

/**
 * True for kickoffs between midnight and 05:00 JST. These are the ones a reader
 * misfiles: a match listed as Monday 00:30 is watched on Sunday night.
 */
export function isLateNight(input: string | Date): boolean {
  return jstParts(input).hour < LATE_NIGHT_UNTIL_HOUR;
}

/**
 * "土曜の深夜" for a kickoff at Sunday 04:00 — the evening a reader actually
 * sits down to watch it. Null for kickoffs that need no disambiguation.
 */
export function lateNightNote(input: string | Date): string | null {
  const p = jstParts(input);
  if (p.hour >= LATE_NIGHT_UNTIL_HOUR) return null;
  return `${WEEKDAYS[(p.dow + 6) % 7]}曜の深夜`;
}

/** Compact form of the same note, for tight rows: "土曜深夜". */
export function lateNightTag(input: string | Date): string | null {
  const note = lateNightNote(input);
  return note ? note.replace("の", "") : null;
}

/** "9/7(日) 04:00（土曜の深夜）" — the full, unambiguous form. */
export function jstKickoffLong(input: string | Date): string {
  const note = lateNightNote(input);
  return `${jstDateTime(input)}${note ? `（${note}）` : ""}`;
}

/** Days from `from` to `to`, counted on the Japanese calendar. */
function jstDayDelta(from: string | Date, to: string | Date): number {
  const a = jstParts(from);
  const b = jstParts(to);
  const dayA = Date.UTC(a.year, a.month - 1, a.day);
  const dayB = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((dayB - dayA) / 86_400_000);
}

/**
 * "今夜" / "明日未明" / "昨日" and friends, relative to `now`.
 *
 * Only ever called on the client: the site is statically generated and
 * redeployed every few hours, so a relative label baked in at build time would
 * start lying almost immediately. Server-rendered markup keeps the absolute
 * date, and the relative wording is layered on after hydration.
 */
export function jstRelativeDay(input: string | Date, now: string | Date): string | null {
  const delta = jstDayDelta(now, input);
  const p = jstParts(input);
  const late = p.hour < LATE_NIGHT_UNTIL_HOUR;

  if (delta === 0) {
    if (late) return "今日未明";
    if (p.hour < 11) return "今朝";
    if (p.hour < 17) return "今日";
    return "今夜";
  }
  if (delta === 1) return late ? "明日未明" : p.hour < 17 ? "明日" : "明日の夜";
  if (delta === -1) return late ? "昨日未明" : "昨日";
  return null;
}

/** "今夜 22:00" / "明日未明 00:30", or null when the kickoff is further out. */
export function jstRelativeKickoff(input: string | Date, now: string | Date): string | null {
  const day = jstRelativeDay(input, now);
  return day ? `${day} ${jstTime(input)}` : null;
}
