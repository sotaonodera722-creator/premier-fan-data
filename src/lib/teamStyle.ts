// What a club's numbers say about how it plays.
//
// The feed carries 39 statistical categories per match. Printing 39 bars would
// be a data dump, and a bar only says "more" or "less" — it cannot say whether a
// club is an outlier or sitting in the middle of the pack with everyone else.
// So the categories are folded into a small number of axes, and each axis is
// drawn as the league's own distribution with the club marked on it.
//
// Sample size is the honest limit here and it is stated on screen rather than
// buried: three matches is three matches. One fixture in the season so far is
// missing the 23 extended categories entirely (Newcastle vs Bournemouth,
// matchday 3), so those two clubs are averaged over two matches and say so.
// Averages are taken over the matches that carry the category rather than over
// all matches played, which is why the denominator travels with the figure.

import type { Team } from "@/lib/types";

/** A pair of opposed ends, and the statistic that places a club between them. */
export interface StyleAxis {
  key: string;
  label: string;
  /** What the low end of the scale means, in the reader's terms. */
  low: string;
  high: string;
  /** Groups the axis under one of the three questions below. */
  group: StyleGroupKey;
  format: (value: number) => string;
  /** Categories this axis needs; a club missing any of them has no value here. */
  needs: string[];
  compute: (get: (name: string) => number | null) => number | null;
}

export type StyleGroupKey = "onTheBall" | "attack" | "defence";

export const STYLE_GROUPS: { key: StyleGroupKey; label: string }[] = [
  { key: "onTheBall", label: "ボールをどう扱うか" },
  { key: "attack", label: "どこから、どう撃つか" },
  { key: "defence", label: "どう守るか" },
];

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const num = (v: number) => v.toFixed(1);

export const STYLE_AXES: StyleAxis[] = [
  {
    key: "possession",
    label: "ボール保持率",
    low: "持たない",
    high: "持つ",
    group: "onTheBall",
    format: pct,
    needs: ["Possession"],
    compute: (get) => get("Possession"),
  },
  {
    key: "passes",
    label: "1試合のパス総数",
    low: "少ない",
    high: "多い",
    group: "onTheBall",
    format: (v) => `${Math.round(v)}本`,
    needs: ["Total passes"],
    compute: (get) => get("Total passes"),
  },
  {
    key: "longBall",
    label: "ロングパスの割合",
    low: "つなぐ",
    high: "蹴る",
    group: "onTheBall",
    format: pct,
    needs: ["Long Passes", "Total passes"],
    compute: (get) => {
      const long = get("Long Passes");
      const total = get("Total passes");
      return long != null && total ? long / total : null;
    },
  },
  {
    key: "finalThird",
    label: "ファイナルサードへのパス",
    low: "入れない",
    high: "入れる",
    group: "attack",
    format: (v) => `${num(v)}本`,
    needs: ["Passes Into Final Third"],
    compute: (get) => get("Passes Into Final Third"),
  },
  {
    key: "boxShare",
    label: "ペナルティエリア内シュート率",
    low: "遠くから",
    high: "ゴール前で",
    group: "attack",
    format: pct,
    needs: ["Shots within penalty area", "Shots outside penalty area"],
    compute: (get) => {
      const inside = get("Shots within penalty area");
      const outside = get("Shots outside penalty area");
      const total = (inside ?? 0) + (outside ?? 0);
      return inside != null && total ? inside / total : null;
    },
  },
  {
    key: "xg",
    label: "1試合の期待得点 (xG)",
    low: "作れない",
    high: "作れる",
    group: "attack",
    format: (v) => v.toFixed(2),
    needs: ["Expected Goals"],
    compute: (get) => get("Expected Goals"),
  },
  {
    key: "clearances",
    label: "クリアランス",
    low: "つないで逃げる",
    high: "蹴り出す",
    group: "defence",
    format: (v) => `${num(v)}本`,
    needs: ["Clearances"],
    compute: (get) => get("Clearances"),
  },
  {
    key: "aerials",
    label: "空中戦の勝利数",
    low: "地上で",
    high: "空中で",
    group: "defence",
    format: (v) => `${num(v)}回`,
    needs: ["Successful Aerial Duels"],
    compute: (get) => get("Successful Aerial Duels"),
  },
  {
    key: "tackles",
    label: "タックル＋インターセプト",
    low: "待つ",
    high: "奪いにいく",
    group: "defence",
    format: (v) => `${num(v)}回`,
    needs: ["Tackles", "Interceptions"],
    compute: (get) => {
      const t = get("Tackles");
      const i = get("Interceptions");
      return t != null && i != null ? t + i : null;
    },
  },
];

/** One club on one axis, with the league behind it. */
export interface AxisReading {
  axis: StyleAxis;
  value: number;
  /** 1 is the highest value in the league. */
  rank: number;
  outOf: number;
  /** Every club's value on this axis, ascending — the distribution to draw. */
  distribution: number[];
  median: number;
  /** Matches this club's figure is averaged over. */
  sampleSize: number;
}

export interface StyleGroup {
  key: StyleGroupKey;
  label: string;
  readings: AxisReading[];
}

export interface TeamStyle {
  team: Team;
  groups: StyleGroup[];
  /** Matches behind the basic categories, and behind the extended ones. */
  sampleSize: number;
  extendedSampleSize: number;
  /** Axes where this club is 1st or 20th — what makes it unusual. */
  extremes: AxisReading[];
}

/** Where a value sits in a sorted list, as a 0..1 position for drawing. */
export function positionIn(distribution: number[], value: number): number {
  const min = distribution[0];
  const max = distribution[distribution.length - 1];
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

// ---------------------------------------------------------------------------
// Saying it in words
//
// Rule-based, so nobody has to write twenty of these every week and so the
// sentence cannot drift away from the numbers under it. Only the ends of the
// league produce a claim: being 9th on an axis is not a characteristic, and a
// sentence built out of mid-table figures would be saying nothing at length.
// ---------------------------------------------------------------------------

/** How a club at one end of an axis is described. */
const EXTREME_PHRASES: Record<string, { top: string; bottom: string }> = {
  possession: { top: "ボールを持ち続ける", bottom: "ボールを持たない" },
  passes: { top: "パスを重ねる", bottom: "パスをつながない" },
  longBall: { top: "前へ蹴る", bottom: "地上でつなぐ" },
  finalThird: { top: "敵陣の深くまで運ぶ", bottom: "敵陣まで運べない" },
  boxShare: { top: "ゴール前まで持ち込んで撃つ", bottom: "遠くから撃つ" },
  xg: { top: "決定機を作る", bottom: "決定機を作れない" },
  clearances: { top: "蹴り出して守る", bottom: "自陣でもつなぐ" },
  aerials: { top: "空中で競り勝つ", bottom: "空中戦を避ける" },
  tackles: { top: "奪いにいく", bottom: "構えて待つ" },
};

export interface StyleVerdict {
  /**
   * One clause per question, kept apart rather than joined into a sentence.
   * Japanese wraps at any character, so a joined headline broke mid-word
   * (「敵陣ま／で運べない」); a clause to a line cannot.
   */
  clauses: string[];
  /** The figures the headline rests on, so it can be checked. */
  support: string;
}

function rankLabel(reading: AxisReading): string {
  return `${reading.axis.label} ${reading.rank}位`;
}

export function getStyleVerdict(style: TeamStyle): StyleVerdict {
  // At most one clause per question. Hull City are last in the league for passes
  // into the final third, for shots inside the box and for expected goals, and
  // taking the first three extremes produced "敵陣まで運べない。遠くから撃つ。
  // 決定機を作れない。" — one fact stated three times. A club is described by
  // where it sits on each of the three questions, not by whichever question it
  // happens to be most lopsided on.
  const phrases: string[] = [];
  const support: string[] = [];

  for (const group of STYLE_GROUPS) {
    const reading = style.extremes.find((r) => r.axis.group === group.key);
    if (!reading) continue;
    const phrase = EXTREME_PHRASES[reading.axis.key];
    if (!phrase) continue;
    phrases.push(reading.rank === 1 ? phrase.top : phrase.bottom);
  }

  // The supporting line lists every extreme, not only the ones that earned a
  // clause, so the sentence can be checked against all of what it was drawn from.
  for (const reading of style.extremes) {
    support.push(`${rankLabel(reading)}（${reading.axis.format(reading.value)}）`);
  }

  if (phrases.length > 0) {
    return {
      clauses: phrases.map((p) => `${p}。`),
      support: `20クラブの端にいるのは ${support.join("、")}。`,
    };
  }

  // No extremes: say so rather than inventing a character. The axis furthest
  // from the median is still the most useful thing to point at.
  const all = style.groups.flatMap((g) => g.readings);
  const furthest = [...all].sort(
    (a, b) =>
      Math.abs(b.rank - (b.outOf + 1) / 2) - Math.abs(a.rank - (a.outOf + 1) / 2)
  )[0];

  return {
    clauses: ["どの軸でもリーグの内側にいる。"],
    support: furthest
      ? `最も平均から離れているのは ${rankLabel(furthest)}（${furthest.axis.format(furthest.value)}）。`
      : "",
  };
}

/** One line per group, naming that group's most extreme axis. */
export function getGroupLine(group: StyleGroup): string | null {
  const sorted = [...group.readings].sort(
    (a, b) =>
      Math.abs(b.rank - (b.outOf + 1) / 2) - Math.abs(a.rank - (a.outOf + 1) / 2)
  );
  const top = sorted[0];
  if (!top) return null;
  const half = (top.outOf + 1) / 2;
  // Within three places of the middle is not a tendency worth a sentence.
  if (Math.abs(top.rank - half) < 3) return "この点ではリーグの平均に近い。";
  const end = top.rank <= half ? top.axis.high : top.axis.low;
  return `${top.axis.label}は${top.outOf}クラブ中${top.rank}位。この面では「${end}」側のクラブ。`;
}
