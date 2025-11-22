# IDMC CDI 処理依存関係可視化アプリケーション 仕様書

## 1. 目的
Informatica IDMC (Intelligent Data Management Cloud) の CDI（Cloud Data Integration）で構築されたデータパイプライン間の依存関係を、Neo4j をバックエンドに用いて可視化する Web アプリケーションの仕様を定義する。開発者、運用担当者、およびデータガバナンス担当が、以下を効率的に行えることを目的とする。

- パイプライン実行順序と依存関係の迅速な把握
- 影響範囲（Impact Analysis）の可視化
- コンポーネント変更時の波及確認
- 運用時の障害解析・ボトルネック分析

## 2. 対象範囲と想定ユーザー
- **対象範囲**: IDMC CDI のジョブ（マッピング／タスクフロー）、接続先、スケジュール、スクリプト、DB テーブル／ファイルなどの I/O を含む依存関係グラフ。
- **想定ユーザー**: データエンジニア、運用担当、アーキテクト、データガバナンス担当。

## 3. 用語
- **パイプライン**: IDMC のマッピング／タスクフローを含むデータ処理単位。
- **ノード**: Neo4j 上で表現するエンティティ（パイプライン、接続、データ資産、スケジュールなど）。
- **リレーション**: ノード間の依存関係（例: `RUNS_ON`, `READS_FROM`, `WRITES_TO`, `TRIGGERS`）。
- **バージョン/スナップショット**: パイプラインの世代管理を行うためのバージョン番号または取得時点。

## 4. 前提・制約
- バックエンド DB は Neo4j (5.x 以上) を使用。
- Neo4j には Bolt プロトコル経由で接続し、グラフクエリは Cypher を使用。
- IDMC メタデータの取得は、公式 REST API またはエクスポートファイルを前処理して投入する ETL を前提とする（このアプリは投入済みデータの可視化に主眼）。
- Web UI はシングルページアプリケーション（SPA）を想定。フロントは TypeScript + React、グラフ描画に D3.js もしくは vis-network を推奨。
- バックエンド API は Node.js (Express/Fastify) または Python (FastAPI) のいずれかを想定。ここでは Node.js + Express を例示。

## 5. ユースケース
1. **依存関係グラフの閲覧**: ジョブ／データ資産を起点に上下流の依存ノードを探索し、グラフで表示。
2. **影響範囲分析**: あるテーブルやファイルに変更が入る場合、その下流パイプラインを列挙。
3. **実行経路の確認**: タスクフロー（スケジュール含む）の実行順序を時系列で表示。
4. **属性検索／フィルタ**: システム名、ドメイン、更新頻度などでノードを検索し、該当ノードを強調。
5. **変更比較**: スナップショット間で追加／削除／変更されたノード・リレーションを差分表示。
6. **タグ付けと注釈**: ノードにオーナー、重要度、SLA、メモを付与。
7. **エクスポート**: 可視化結果を PNG／SVG／CSV (edge list) 形式で出力。

## 6. 機能要件
- **グラフ表示**: ノード／リレーションを対話的に表示（拡大縮小、ドラッグ、フォーカス）。
- **検索・フィルタ**: ノード属性・タグでの検索、フィルタリング、ハイライト。
- **経路探索**: 最短経路表示、影響範囲（上流・下流方向の再帰探索、深さ制限付き）。
- **タイムスライダー**: スナップショット／バージョンを指定し、同一 UI で切り替え。
- **差分表示**: 指定した 2 つのスナップショット間で差分を色分け表示（追加=緑、削除=赤、変更=黄）。
- **ノード詳細パネル**: 選択ノードのメタ情報（作成者、接続、スケジュール、SLA、最終更新、バージョン、実行履歴リンクなど）表示。
- **セキュリティ**: ロールベースアクセス制御（閲覧/編集）。API への認証・認可（OIDC/JWT）。
- **監査ログ**: 検索条件やエクスポート操作を監査ログに記録。
- **運用メトリクス表示 (任意)**: パフォーマンスメトリクス（実行時間、レコード数、エラー件数）をノードのツールチップで表示。

## 7. 非機能要件
- **パフォーマンス**: 中規模（ノード 50k、リレーション 200k）程度で快適に操作可能な応答性。
- **可用性**: フロント/バックエンドはコンテナ化し、Kubernetes 等で冗長化可能な構成。
- **セキュリティ**: HTTPS、JWT 検証、CORS 制御。Neo4j への接続情報は KMS/Secrets 管理。
- **運用監視**: API ログ、エラー率、レスポンス時間、Neo4j クエリ統計を APM/監視基盤に送信。

## 8. データモデル（Neo4j）
### 8.1 ノードラベル例
- `Pipeline` (属性: `id`, `name`, `type` [Mapping/Taskflow], `domain`, `owner`, `sla`, `frequency`, `version`, `snapshot_at`)
- `Dataset` (DB テーブル/ファイル、属性: `id`, `name`, `system`, `schema`, `type` [Table/File/API], `sensitivity`, `version`, `snapshot_at`)
- `Connection` (属性: `id`, `name`, `system`, `connector`, `env`)
- `Schedule` (属性: `id`, `name`, `cron`, `timezone`, `enabled`)
- `Script` (属性: `id`, `name`, `language`, `path`)
- `Tag` (属性: `name`, `description`)

### 8.2 リレーション例
- `RUNS_ON` (`Pipeline` → `Schedule`)
- `READS_FROM` (`Pipeline` → `Dataset`)
- `WRITES_TO` (`Pipeline` → `Dataset`)
- `USES_CONNECTION` (`Pipeline` → `Connection`)
- `CALLS` (`Pipeline` → `Pipeline`)
- `TRIGGERS` (`Schedule` → `Pipeline`)
- `TAGGED_WITH` (任意ノード → `Tag`)

### 8.3 バージョン管理
- ノード/リレーションとも `version` と `snapshot_at` を保持。
- 最新版は `version = current` もしくは `active=true` で表現し、過去版は履歴として保持。
- 差分計算は `snapshot_at` または `version` の範囲でフィルタし、追加/削除/変更を判定。

## 9. API 仕様 (例: REST + GraphQL)
### 9.1 認証
- OIDC でトークン取得後、API には Bearer JWT を付与。

### 9.2 REST エンドポイント（例）
- `GET /api/nodes?label=Pipeline&query=...` ノード検索（属性/タグ/全文）
- `GET /api/graph?rootId=...&depth=...&direction=up|down|both&snapshot=...` 依存グラフ取得
- `GET /api/paths?src=...&dst=...&snapshot=...` 最短経路/全経路探索
- `GET /api/diff?base=2024-01-01T00:00:00Z&target=2024-02-01T00:00:00Z` 差分取得
- `POST /api/tags` タグの登録・更新
- `GET /api/audit` 操作履歴の取得

### 9.3 GraphQL (任意)
- `type Query { graph(rootId: ID!, depth: Int, direction: Direction, snapshot: String): GraphResult }`
- `type GraphResult { nodes: [Node!]!, edges: [Edge!]! }`
- `type Node { id: ID!, labels: [String!]!, properties: JSON }
- `type Edge { id: ID!, from: ID!, to: ID!, type: String!, properties: JSON }

### 9.4 フロントエンド連携
- フロントは REST または GraphQL クライアントでデータ取得。
- グラフ描画は JSON 形式のノード/エッジデータを入力として利用。

## 10. UI 要件
- **グラフビュー**: ノード形状/色で種類を区別（Pipeline=青、Dataset=緑、Schedule=紫など）。
- **パネル構成**: 左に検索・フィルタ、中央にグラフ、右に詳細パネル。
- **インタラクション**: クリックで詳細、ダブルクリックで上下流展開、ホイールでズーム、ドラッグでパン。
- **バージョン切替**: タイムスライダーでスナップショットを変更。
- **差分表示**: 2 つのスナップショットを選択し、追加/削除/変更の色分け表示。
- **レスポンシブ**: 1080p で 3 カラム、タブレット/モバイルでは折りたたみ。

## 11. インポート／更新フロー（外部）
- 外部 ETL もしくはバッチで IDMC API からメタデータを取得。
- 前処理でノード・リレーションを構成する JSON/CSV を生成。
- Bolt/HTTP API で Neo4j に投入（MERGE を中心に使用）。
- バージョン/スナップショットを更新し、UI で参照可能にする。

## 12. アーキテクチャ（例）
- **フロントエンド**: React + TypeScript + Vite、グラフ描画コンポーネント（D3.js/vis-network/Recharts）。
- **バックエンド**: Node.js (Express) + neo4j-driver。認証に Passport.js (OIDC)、設定に dotenv。
- **データベース**: Neo4j 5.x (Aura でも可)。
- **監視/ログ**: OpenTelemetry でトレーシング、Grafana で可視化。
- **CI/CD**: GitHub Actions で lint/test/build、Docker ビルド、デプロイ。

## 13. セキュリティ要件
- JWT の署名検証と期限確認。
- RBAC: 閲覧専用ロール、編集ロール（タグ付け・メモ）、管理者ロール（メタデータ再取り込み）。
- リクエスト/レスポンスのレートリミット、CORS 制御。
- パスワード・シークレットは環境変数/Secret Manager で管理。

## 14. パフォーマンス・スケーラビリティ
- グラフ取得 API はページング/深さ制限を必須とする。
- 重複ノード／リレーションを減らすため、アプリ側でキャッシュ（ブラウザキャッシュや CDN）。
- Neo4j 側で適切なインデックスを設定（`Pipeline(id)`, `Dataset(id)`, `Connection(id)`, `Schedule(id)` など）。
- 大規模グラフ向けに WebGL ベースの描画ライブラリ利用を検討。

## 15. エラーハンドリング
- API は一貫したエラーレスポンスフォーマット `{code, message, details}` を返却。
- フロントではエラー通知（トースト/ダイアログ）を行い、再試行や問い合わせ先を提示。

## 16. ロードマップ（例）
1. **MVP**: グラフ閲覧、検索、深さ制限付き上下流探索、ノード詳細表示。
2. **拡張**: 差分表示、タグ付け、エクスポート、認証/RBAC。
3. **運用強化**: メトリクス表示、監査ログ、パフォーマンスチューニング、可用性向上。

## 17. 品質保証・テスト
- バックエンド: Unit テスト (Jest) + API テスト (supertest)、Neo4j のテストコンテナを使用。
- フロントエンド: Unit/Component テスト (Vitest/React Testing Library)、E2E テスト (Playwright/Cypress)。
- パフォーマンステスト: JMeter/K6 で API 応答時間を検証。
- セキュリティテスト: JWT 検証、認可、CORS、レートリミットの確認。

## 18. 依存ツール・ライブラリ案
- `neo4j-driver`, `cypher-query-builder`, `express`, `passport`, `dotenv`
- `react`, `typescript`, `vite`, `vis-network` または `d3`
- `jest`, `supertest`, `vitest`, `playwright`

## 19. 成果物
- この仕様書（本ファイル）
- アプリケーション実装（今後）
- Neo4j モデル定義・サンプルデータ（今後）
- 操作手順書／運用設計書（今後）

