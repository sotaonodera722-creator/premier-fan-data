/**
 * The words this site uses that a reader cannot look up.
 *
 * Chosen by searching the site for what it actually prints, not from a list of
 * football jargon. Three of the terms the plan named — xA, clean sheet, H2H —
 * appear nowhere here, and explaining a word the site does not use only invites
 * someone to start using it. What the plan missed is the vocabulary this site
 * invented: 不動 / ローテーション / 出番待ち are thresholds defined in
 * `data.ts` and nowhere else in the world, and they carry the answer S09 exists
 * to give.
 *
 * Explanations are two sentences at most. A reader who stopped at a word wants
 * to start reading again, not to read something longer.
 */
import { EVERY_PRESENT_SHARE, ROTATION_SHARE } from "@/lib/data";

export interface GlossaryEntry {
  /** The word as it is printed on the page. */
  term: string;
  body: string;
}

export const GLOSSARY = {
  xg: {
    term: "xG（期待得点）",
    body:
      "シュートの位置や状況から、平均的にどれだけ得点が見込めたかを推定した値です。" +
      "実際の得点より高ければ「決めきれなかった」、低ければ「少ないチャンスをものにした」と読めます。",
  },
  usageRole: {
    term: "不動・ローテーション・出番待ち",
    body:
      "そのクラブが戦った時間のうち、その選手がピッチにいた割合で分けています。" +
      `${EVERY_PRESENT_SHARE * 10}割以上が「不動」、${ROTATION_SHARE * 10}割以上が「ローテーション」、それ未満が「出番待ち」です（このサイト独自の区分）。`,
  },
  bigChance: {
    term: "ビッグチャンス創出",
    body:
      "得点になる可能性が高い決定機を、味方に作り出した回数です。" +
      "アシストと違い、シュートが決まらなくても記録されます。",
  },
  formation: {
    term: "フォーメーション表記",
    body:
      "GKを除く10人の並びを、後ろから順に数えた表記です。" +
      "4-2-3-1 なら、DF4人・中盤の底2人・その前3人・FW1人という意味になります。",
  },
  goalDiff: {
    term: "得失点差",
    body:
      "総得点から総失点を引いた数です。" +
      "勝点が並んだクラブの順位は、まずこの数字で決まります。",
  },
  gamesInHand: {
    term: "未消化",
    body:
      "他のクラブより試合数が少ない状態です。" +
      "勝点だけを比べると不利に見えますが、勝てば順位が動く余地がそのぶん残っています。",
  },
  finalThird: {
    term: "ファイナルサード",
    body:
      "ピッチを縦に3等分したうち、相手ゴールに最も近い3分の1のことです。" +
      "ここへのパスが多いほど、相手陣内まで運べているという目安になります。",
  },
  possession: {
    term: "ボール保持率",
    body:
      "試合時間のうち、そのクラブがボールを持っていた割合です。" +
      "高いほど良いとは限らず、保持を相手に譲って速い攻撃を狙うクラブもあります。",
  },
} satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof GLOSSARY;
