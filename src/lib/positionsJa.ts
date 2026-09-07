import type { Position } from "@/lib/types";

// GK / DF / MF / FW stay as-is in tight badges — they're compact and near-universal
// — but anywhere there's room for words, use these instead. Badges that can only
// fit the abbreviation carry the Japanese as a `title` so it's still reachable.
export const POSITION_NAMES_JA: Record<Position, string> = {
  GK: "ゴールキーパー",
  DF: "ディフェンダー",
  MF: "ミッドフィルダー",
  FW: "フォワード",
};

export function getPositionJa(position: Position): string {
  return POSITION_NAMES_JA[position];
}
