# プレミアコンパス

プレミアリーグの順位表・チーム情報・選手データを日本語でまとめたファン向けデータベース。プレミアリーグで戦う日本人選手の一覧・活躍も確認できます。

データは [football-data.org](https://www.football-data.org/) の無料APIから取得した実データです。

## 開発

```bash
npm install
npm run dev
```

http://localhost:3000 を開きます。

## データの取得・更新

`.env.local` に football-data.org と Highlightly のAPIトークンを設定してください(`.env.local.example` 参照)。

```bash
node scripts/ingest-football-data.mjs
node scripts/ingest-lineups.mjs
node scripts/ingest-h2h.mjs
```

football-data.org の無料プランは10リクエスト/分の制限があるため、スクリプトはレスポンスヘッダー(`x-requests-available-minute`)を見ながら自動で待機します。取得したデータは `src/data/*.json` に書き出され、アプリはそのJSONを読み込みます(API呼び出しはビルド時ではなくこのスクリプト実行時のみ)。

`ingest-lineups.mjs` は Highlightly (`soccer.highlightly.net`) からスタメン・フォーメーションを取得し `src/data/lineups.json` に書き出します。まだラインナップを持っていない「消化済みの試合」だけを差分取得するので、`ingest-football-data.mjs` を先に実行して最新の試合結果を取り込んでおく必要があります。Highlightlyの無料(BASIC)プランは100リクエスト/日までのため、シーズン開始直後などまとめて取得したい場合は数日に分けて実行してください。選手の「出場記録」(先発/ベンチ入り)はこのラインナップデータから選手名でマッチングして作成しているため、ラインナップを取得していない試合分は表示されません。

`ingest-h2h.mjs` は football-data.org から今シーズン対戦する全チームペア(20チーム総当たり、190ペア)の過去の対戦成績を取得し `src/data/h2h.json` に書き出します。まだ取得していないペアだけを差分取得します。初回は190リクエストかかるため数分〜十数分ほどお待ちください。

## 構成

- `src/app` — ページ(ホーム / チーム一覧・詳細 / 選手名鑑・詳細 / 順位表 / 試合詳細・スタメン / 対戦成績比較)
- `src/components` — UIコンポーネント
- `src/lib` — 型定義とデータアクセス関数
- `src/data` — 取得済みの実データ(`teams.json` / `players.json` / `matches.json` / `lineups.json` / `h2h.json`)
- `scripts/ingest-football-data.mjs` — football-data.org からチーム・選手・試合データを取得するスクリプト
- `scripts/ingest-lineups.mjs` — Highlightly からスタメン・フォーメーションを取得するスクリプト
- `scripts/ingest-h2h.mjs` — football-data.org からチーム同士の過去の対戦成績を取得するスクリプト

## データ利用について

- 選手の得点・アシストは、football-data.org の得点ランキングAPI(上位100名)から取得しています。ランキング外の選手はこれらの値が未取得(`null`)です
- スタメン・フォーメーションは Highlightly のAPIから取得しています(試合終了後、または先発発表後に取得可能)
- フッターに football-data.org / Highlightly の帰属表示を掲載しています
- クラブエンブレムは football-data.org が提供する画像URLをそのまま表示しています
- 本サイトはプレミアリーグ・各クラブとは無関係の非公式ファンサイトです

## 今後の拡張候補

- 日本人選手の特集記事・週間ハイライト
- ラインナップ・対戦成績取得の定期実行(現状は手動実行)
