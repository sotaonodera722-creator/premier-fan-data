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

`.env.local` に football-data.org のAPIトークンを設定してください(`.env.local.example` 参照)。

```bash
node scripts/ingest-football-data.mjs
```

無料プランは10リクエスト/分の制限があるため、スクリプトはレスポンスヘッダー(`x-requests-available-minute`)を見ながら自動で待機します。取得したデータは `src/data/*.json` に書き出され、アプリはそのJSONを読み込みます(API呼び出しはビルド時ではなくこのスクリプト実行時のみ)。

## 構成

- `src/app` — ページ(ホーム / チーム一覧・詳細 / 選手名鑑・詳細 / 順位表)
- `src/components` — UIコンポーネント
- `src/lib` — 型定義とデータアクセス関数
- `src/data` — 取得済みの実データ(`teams.json` / `players.json` / `matches.json`)
- `scripts/ingest-football-data.mjs` — football-data.org からデータを取得するスクリプト

## データ利用について

- 選手の得点・アシストは、football-data.org の得点ランキングAPI(上位100名)から取得しています。ランキング外の選手はこれらの値が未取得(`null`)です
- フッターに football-data.org の帰属表示を掲載しています(利用規約で必須)
- クラブエンブレムは football-data.org が提供する画像URLをそのまま表示しています
- 本サイトはプレミアリーグ・各クラブとは無関係の非公式ファンサイトです

## 今後の拡張候補

- スタメン・フォーメーション表示(API-Football等の追加データソースが必要)
- 日本人選手の特集記事・週間ハイライト
- チーム同士の対戦成績(head-to-head)比較ビュー
