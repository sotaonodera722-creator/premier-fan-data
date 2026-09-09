@AGENTS.md

# Working style

Before making any code changes, first explain in chat (in Japanese) what you're
about to do — what will change and why. For visual/design changes, propose
whether a mockup or image would help before touching code, and let the user
choose. Wait for the user's go-ahead before starting implementation; don't
jump straight into edits. This applies to every task, not just design work.

# 品質基準

実装が「完了」と言えるのは、以下をすべて満たしたときだけです。スタブ・モック・
「後で直す」を残したまま完了報告をしないこと。

## デザインの質
- 色・タイポグラフィ・余白・階層が一貫した世界観を作っていること
- 情報の優先順位が視覚的に表現されていること（重要な数字が一番目立つ）

## オリジナリティ
- テンプレート的なAIデザインを避けること。均質なカードの羅列、意味のない装飾、
  どこにでもある汎用ダッシュボードは不可
- ただし `src/app/globals.css` のモノクロ方針は意図的な制約であり、破らないこと。
  色はクラブのアイデンティティ（エンブレム、`src/lib/teamColors.ts`）にのみ使う。
  `--success` / `--info` / `--danger` は意味論的用途のみで、装飾には使わない

## クラフト
- スペーシングが規則的であること
- モバイル (375px) で横スクロールが発生しないこと
- ホバー/フォーカス状態があること。タップ領域が十分なこと

## 機能性
- 各機能が実際に動作すること（リンク切れ、動かないタブ、空データ時の破綻がない）
- データが空のときの表示が定義されていること

## 数字の正しさ
このサイトの数字はほぼ全部が導出値です（出場時間は名前照合による再構成、4状態分類は
交代イベントからの推論）。**間違った数字はブラウザ上で完璧に見えます。**
表示が崩れていないことは、値が正しいことの証拠になりません。

## 完了の定義

以下がすべて通って初めて「完了」です。

1. `npm run lint` が通る
2. `npm run build` が通る
3. `npm run audit` が通る（データの不変条件。`scripts/audit/invariants.ts`）
4. `qa-reviewer` が合格（見た目・操作）
5. `data-auditor` が合格（数字）
6. 両者の指摘を `docs/qa-log.md` に追記した

1〜3を通さずに4・5の検査に出さないこと。型エラーで落ちるコードに検査エージェントの
ターンを使うのは浪費です。

## 自己評価の扱い
自分の実装を自分で「良くできている」と判断しないこと。見た目や体験に関わる変更を
実装したら `qa-reviewer` に、数字に関わる変更を実装したら `data-auditor` に、
それぞれ独立して採点させ、その指摘に対応すること。両者は同格で、どちらか一方でも
不合格なら不合格です。

進め方の全体像は [docs/workflow.md](docs/workflow.md) にあります。
