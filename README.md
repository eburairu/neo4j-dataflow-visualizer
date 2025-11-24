# neo4j-dataflow-visualizer

Neo4j をバックエンドに IDMC CDI パイプラインの依存関係を可視化するアプリケーションの最初の実装です。`SPEC.md` に沿って、Express ベースの API とサンプルデータを提供します。

## セットアップ
1. 依存パッケージをインストールします。
   ```bash
   npm install
   ```
2. 環境変数を設定します。Neo4j を使う場合は `.env` を作成して接続情報を設定してください（雛形は `.env.example`）。
   ```bash
   cp .env.example .env
   # 必要に応じて NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD を変更
   ```

## 実行
```bash
npm start
```

起動後は `http://localhost:4000/api/health` でヘルスチェックができます。Neo4j 接続が未設定の場合はサンプルスナップショット（メダリオン Bronze/Silver/Gold の例）で応答します。

## 提供 API（MVP）
- `GET /api/graph?rootId=<id>&depth=2&direction=both&snapshot=2024-02-01T00:00:00Z`
  - 指定ルートから上下流のノードとエッジを取得。Neo4j が無い場合はサンプルデータを返します。
- `GET /api/diff?base=<snapshot>&target=<snapshot>`
  - 2 つのスナップショット間の追加・削除ノード差分を返します（サンプルデータ対応済み）。
- `GET /api/snapshots`
  - 使用可能なサンプルスナップショット一覧を返します。
- `GET /api/health`
  - サービスの稼働確認。

## デプロイ方法と必要な Secrets

`main` ブランチへの push をトリガーに、GitHub Actions から Vercel へ自動デプロイされます。

1. GitHub リポジトリの Settings > Secrets and variables > Actions で以下を追加します。
   - `VERCEL_TOKEN`: Vercel のデプロイトークン。
   - `VERCEL_ORG_ID`: 対象チーム/組織の ID。
   - `VERCEL_PROJECT_ID`: Vercel プロジェクト ID。
2. `main` ブランチに push すると `.github/workflows/deploy.yml` が発火し、`npm ci` → `npm test` → `npm run build` → `vercel build` → `vercel deploy` を実行します。
3. `vercel.json` で `src/server.js` を Node Functions としてデプロイし、すべてのリクエストを API にルーティングします。

手動でデプロイしたい場合は、ローカルに Vercel CLI をインストールし、上記 Secrets と同じ値を環境変数に設定してから `npx vercel deploy --prod` を実行してください。

## 今後の拡張候補
- `SPEC.md` に記載の差分ハイライト、タグ付け、検索/フィルタ UI などのフロントエンド実装
- Neo4j からのリレーション差分取得やパフォーマンス最適化
