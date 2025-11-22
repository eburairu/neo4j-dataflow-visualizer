# IDMC CDI 処理依存関係可視化アプリケーション 仕様書

## 1. 目的
Informatica IDMC (Intelligent Data Management Cloud) の CDI（Cloud Data Integration）で構築されたデータパイプライン間の依存関係を、Neo4j をバックエンドに用いて可視化する Web アプリケーションの仕様を定義する。開発者、運用担当者、およびデータガバナンス担当が以下を効率的に行えることを目的とする。

- パイプライン実行順序と依存関係の迅速な把握
- 影響範囲（Impact Analysis）の可視化
- コンポーネント変更時の波及確認
- 運用時の障害解析・ボトルネック分析

## 2. 対象範囲と想定ユーザー
- **対象範囲**: IDMC CDI のジョブ（マッピング／タスクフロー／配信ジョブ）、接続先、スケジュール、スクリプト、DB テーブル／ファイルなどの I/O を含む依存関係グラフ。
- **想定ユーザー**: データエンジニア、運用担当、アーキテクト、データガバナンス担当。

## 3. 用語
- **パイプライン**: IDMC のマッピング／タスクフロー／配信ジョブを含むデータ処理単位。
- **ノード**: Neo4j 上で表現するエンティティ（パイプライン、接続、データ資産、スケジュールなど）。
- **リレーション**: ノード間の依存関係（例: `RUNS_ON`, `READS_FROM`, `WRITES_TO`, `TRIGGERS`）。
- **バージョン/スナップショット**: パイプラインの世代管理を行うためのバージョン番号または取得時点。
- **メダリオンアーキテクチャ**: Bronze（未加工/取り込み直後）、Silver（クレンジング・正規化後）、Gold（集計・ビジネスロジック適用、データマート）で構成するレイヤードなデータマネジメント手法。

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
5. **メダリオン層トラッキング**: Bronze→Silver→Gold (データマート) のどの層でデータが生成・集約されたかを色やラベルで可視化。
6. **配信経路の可視化**: Gold 層やデータマートから BI ツールまたは他システムへの配信処理をたどり、再利用箇所を把握。
7. **変更比較**: スナップショット間で追加／削除／変更されたノード・リレーションを差分表示。
8. **タグ付けと注釈**: ノードにオーナー、重要度、SLA、メモを付与。
9. **エクスポート**: 可視化結果を PNG／SVG／CSV (edge list) 形式で出力。

## 6. メダリオンアーキテクチャに沿ったデータフロー
- **フロー全体像**: 「他システムのデータソース → 収集処理（IDMC CDI のマッピング/タスクフロー）→ オブジェクトストレージ → ETL 処理 → データマート（メダリオンの Gold 層を含む）→ BI ツールもしくは他システムへの配信処理」の一連を可視化する。
- **レイヤー定義**: Bronze=未加工着地、Silver=クレンジング・正規化、Gold=ビジネス集計/データマート。配信は Gold 起点で BI/他システムへ。
- **データフロー詳細**:
  1. **外部データソース**: RDB/SaaS/API/File などのソースシステム。
  2. **収集処理**: CDC またはバッチジョブがデータを取得し、オブジェクトストレージに落とす（Bronze 層の Dataset + Storage パスで表現）。
  3. **オブジェクトストレージ**: Parquet/CSV/JSON 等で保存。パス/フォルダ単位で Dataset (layer=Bronze) を登録。
  4. **ETL/ELT**: IDMC マッピング/タスクフローが Bronze を読み、クレンジング・正規化し Silver を生成。必要に応じて同一層内で複数ステップを表現。
  5. **データマート生成**: Silver を集計し Gold を生成。Gold Dataset を DataMart ノードと紐付け、ビジネスプロセスや更新ポリシーを属性で保持。
  6. **配信/消費**: Gold/DataMart を BIApp に直接接続、または Delivery Pipeline で他システムへファイル/API 連携 (`DELIVERS_TO`)。
  7. **メタデータ反映**: 各ステップの Pipeline/Connection/Schedule/Dataset を Neo4j に MERGE し、`layer` と `snapshot_at` で時系列追跡。
- **可視化要件**:
  - 層ごとに色/バッジ/凡例を用意（Bronze=茶、Silver=銀、Gold=金、配信=青）。
  - Gold から BI/ExternalSystem へ扇状に展開し、再利用箇所・重複配信を検知。
  - 層フィルタで特定レイヤーのみを強調表示（Bronze→Silver→Gold の流れをたどるモードを提供）。

## 7. 機能要件
- **グラフ表示**: ノード／リレーションを対話的に表示（拡大縮小、ドラッグ、フォーカス）。
- **検索・フィルタ**: ノード属性・タグでの検索、フィルタリング、ハイライト。層別フィルタ (Bronze/Silver/Gold/配信) を提供。
- **経路探索**: 最短経路表示、影響範囲（上流・下流方向の再帰探索、深さ制限付き）。
- **タイムスライダー**: スナップショット／バージョンを指定し、同一 UI で切り替え。
- **差分表示**: 指定した 2 つのスナップショット間で差分を色分け表示（追加=緑、削除=赤、変更=黄）。
- **ノード詳細パネル**: 選択ノードのメタ情報（作成者、接続、スケジュール、SLA、最終更新、バージョン、実行履歴リンクなど）表示。
- **セキュリティ**: ロールベースアクセス制御（閲覧/編集）。API への認証・認可（OIDC/JWT）。
- **監査ログ**: 検索条件やエクスポート操作を監査ログに記録。
- **運用メトリクス表示 (任意)**: パフォーマンスメトリクス（実行時間、レコード数、エラー件数、quality_score）をノードのツールチップで表示。

## 8. 非機能要件
- **パフォーマンス**: 中規模（ノード 50k、リレーション 200k）程度で快適に操作可能な応答性。
- **可用性**: フロント/バックエンドはコンテナ化し、Kubernetes 等で冗長化可能な構成。
- **セキュリティ**: HTTPS、JWT 検証、CORS 制御。Neo4j への接続情報は KMS/Secrets 管理。
- **運用監視**: API ログ、エラー率、レスポンス時間、Neo4j クエリ統計を APM/監視基盤に送信。

## 9. データモデル（Neo4j）
### 9.1 ノードラベル例
- `Pipeline` (属性: `id`, `name`, `type` [Ingestion/Mapping/Taskflow/Delivery], `domain`, `owner`, `sla`, `frequency`, `version`, `snapshot_at`, `tool`)
- `Dataset` (属性: `id`, `name`, `system`, `schema`, `type` [Table/File/API/ObjectStorage], `layer` [Bronze/Silver/Gold], `sensitivity`, `quality_score`, `version`, `snapshot_at`)
- `DataMart` (属性: `id`, `name`, `domain`, `business_process`, `layer` = `Gold`, `refresh_policy`, `version`, `snapshot_at`)
- `ExternalSystem` (属性: `id`, `name`, `type` [RDB/SaaS/API/File], `owner`)
- `Storage` (属性: `id`, `name`, `provider`, `path`, `format`, `retention_policy`)
- `Connection` (属性: `id`, `name`, `system`, `connector`, `env`)
- `Schedule` (属性: `id`, `name`, `cron`, `timezone`, `enabled`)
- `Script` (属性: `id`, `name`, `language`, `path`)
- `BIApp` (属性: `id`, `name`, `type` [Tableau/PowerBI/Looker/Custom])
- `Tag` (属性: `name`, `description`)

### 9.2 リレーション例
- `RUNS_ON` (`Pipeline` → `Schedule`)
- `READS_FROM` (`Pipeline` → `Dataset`)
- `WRITES_TO` (`Pipeline` → `Dataset`)
- `USES_CONNECTION` (`Pipeline` → `Connection`)
- `CALLS` (`Pipeline` → `Pipeline`)
- `TRIGGERS` (`Schedule` → `Pipeline`)
- `TAGGED_WITH` (任意ノード → `Tag`)
- `INGESTS_FROM` (`Pipeline` → `ExternalSystem`)
- `LANDS_IN` (`Dataset` → `Storage`) — Bronze 着地のバケット/パスを表現。
- `PRODUCES_LAYER` (`Pipeline` → `Dataset`) — `layer` 属性で Bronze/Silver/Gold を特定。
- `SERVES_MART` (`Dataset|Pipeline` → `DataMart`)
- `DELIVERS_TO` (`DataMart|Dataset|Pipeline` → `BIApp` または 他システム `ExternalSystem`)

### 9.3 バージョン管理
- ノード/リレーションとも `version` と `snapshot_at` を保持。
- 最新版は `version = current` もしくは `active=true` で表現し、過去版は履歴として保持。
- 差分計算は `snapshot_at` または `version` の範囲でフィルタし、追加/削除/変更を判定。

## 10. API 仕様 (例: REST + GraphQL)
### 10.1 認証
- OIDC でトークン取得後、API には Bearer JWT を付与。

### 10.2 REST エンドポイント（例）
- `GET /api/nodes?label=Pipeline&query=...` ノード検索（属性/タグ/全文）
- `GET /api/graph?rootId=...&depth=...&direction=up|down|both&snapshot=...` 依存グラフ取得
- `GET /api/paths?src=...&dst=...&snapshot=...` 最短経路/全経路探索
- `GET /api/diff?base=2024-01-01T00:00:00Z&target=2024-02-01T00:00:00Z` 差分取得
- `GET /api/lineage/layer?layer=Gold&rootMartId=...` メダリオン層 (Gold/データマート) 起点の上下流取得
- `GET /api/distribution?martId=...` BI/配信経路の一覧
- `POST /api/tags` タグの登録・更新
- `GET /api/audit` 操作履歴の取得

### 10.3 GraphQL (任意)
- `type Query { graph(rootId: ID!, depth: Int, direction: Direction, snapshot: String): GraphResult }`
- `type GraphResult { nodes: [Node!]!, edges: [Edge!]! }`
- `type Node { id: ID!, labels: [String!]!, properties: JSON }`
- `type Edge { id: ID!, from: ID!, to: ID!, type: String!, properties: JSON }`

### 10.4 フロントエンド連携
- フロントは REST または GraphQL クライアントでデータ取得。
- グラフ描画は JSON 形式のノード/エッジデータを入力として利用。

## 11. UI 要件
- **グラフビュー**: ノード形状/色で種類を区別（Pipeline=青、Dataset=緑、Schedule=紫、Bronze/Silver/Gold はグラデーション）。
- **パネル構成**: 左に検索・フィルタ、中央にグラフ、右に詳細パネル。
- **インタラクション**: クリックで詳細、ダブルクリックで上下流展開、ホイールでズーム、ドラッグでパン。
- **バージョン切替**: タイムスライダーでスナップショットを変更。
- **層別表示**: Bronze/Silver/Gold のフィルタ・凡例、Gold 起点で配信ノード (BI/ExternalSystem) を扇状に展開するレイヤー表示。
- **差分表示**: 2 つのスナップショットを選択し、追加/削除/変更の色分け表示。
- **レスポンシブ**: 1080p で 3 カラム、タブレット/モバイルでは折りたたみ。

## 12. インポート／更新フロー（外部）
- 外部 ETL もしくはバッチで IDMC API からメタデータを取得。
- 前処理でノード・リレーションを構成する JSON/CSV を生成。
- Bolt/HTTP API で Neo4j に投入（MERGE を中心に使用）。
- バージョン/スナップショットを更新し、UI で参照可能にする。

### 12.1 メダリオン層別の取り込みガイド
- Bronze: 収集処理のログ/着地点 (Storage, Dataset: layer=Bronze) を優先登録。
- Silver: クレンジング/統合パイプライン (Pipeline: type=Mapping, layer=Silver) と出力 Dataset を連動登録。
- Gold/DataMart: 集計・ビジネスロジック適用パイプラインと DataMart ノードを紐付け、BI/配信先を `DELIVERS_TO` で接続。
- 配信: 配信専用 Pipeline (type=Delivery) と接続先 ExternalSystem/BIApp を登録。

## 13. アーキテクチャ（例）
- **フロントエンド**: React + TypeScript + Vite、グラフ描画コンポーネント（D3.js/vis-network/Recharts）。
- **バックエンド**: Node.js (Express) + neo4j-driver。認証に Passport.js (OIDC)、設定に dotenv。
- **データベース**: Neo4j 5.x (Aura でも可)。
- **監視/ログ**: OpenTelemetry でトレーシング、Grafana で可視化。
- **CI/CD**: GitHub Actions で lint/test/build、Docker ビルド、デプロイ。

### 13.1 データフロー別コンポーネント
- **収集層 (Bronze)**: CDC/バッチ連携ジョブ (Pipeline:type=Ingestion) + Connection + Storage (オブジェクトストレージ)。
- **処理層 (Silver)**: IDMC マッピング (Pipeline:type=Mapping) が Bronze Dataset を読み取り、正規化/クレンジングを実施。
- **マート層 (Gold)**: タスクフロー (Pipeline:type=Taskflow) が Silver Dataset を集計し DataMart/Gold Dataset を生成。
- **配信層**: Delivery Pipeline が Gold/DataMart を BIApp または ExternalSystem に `DELIVERS_TO`。
- **メタデータ連携**: インポートバッチが各層で生成したノード/リレーションを Neo4j に MERGE。スナップショット属性で時系列管理。
- **オブザーバビリティ**: ETL 実行結果・品質指標を quality_score として Dataset に格納し、UI のツールチップ/詳細パネルで表示。

## 14. セキュリティ要件
- JWT の署名検証と期限確認。
- RBAC: 閲覧専用ロール、編集ロール（タグ付け・メモ）、管理者ロール（メタデータ再取り込み）。
- リクエスト/レスポンスのレートリミット、CORS 制御。
- パスワード・シークレットは環境変数/Secret Manager で管理。

## 15. パフォーマンス・スケーラビリティ
- グラフ取得 API はページング/深さ制限を必須とする。
- 重複ノード／リレーションを減らすため、アプリ側でキャッシュ（ブラウザキャッシュや CDN）。
- Neo4j 側で適切なインデックスを設定（`Pipeline(id)`, `Dataset(id)`, `Connection(id)`, `Schedule(id)` など）。
- 大規模グラフ向けに WebGL ベースの描画ライブラリ利用を検討。

## 16. エラーハンドリング
- API は一貫したエラーレスポンスフォーマット `{code, message, details}` を返却。
- フロントではエラー通知（トースト/ダイアログ）を行い、再試行や問い合わせ先を提示。

## 17. ロードマップ（例）
1. **MVP**: グラフ閲覧、検索、深さ制限付き上下流探索、ノード詳細表示。メダリオン層の色分けと凡例を提供。
2. **拡張**: 差分表示、タグ付け、エクスポート、認証/RBAC。Gold 起点の配信経路ビューを追加。
3. **運用強化**: メトリクス表示、監査ログ、パフォーマンスチューニング、可用性向上。quality_score を用いた品質アラートを追加。

## 18. 品質保証・テスト
- バックエンド: Unit テスト (Jest) + API テスト (supertest)、Neo4j のテストコンテナを使用。
- フロントエンド: Unit/Component テスト (Vitest/React Testing Library)、E2E テスト (Playwright/Cypress)。
- パフォーマンステスト: JMeter/K6 で API 応答時間を検証。
- セキュリティテスト: JWT 検証、認可、CORS、レートリミットの確認。

## 19. 依存ツール・ライブラリ案
- `neo4j-driver`, `cypher-query-builder`, `express`, `passport`, `dotenv`
- `react`, `typescript`, `vite`, `vis-network` または `d3`
- `jest`, `supertest`, `vitest`, `playwright`

## 20. 成果物
- この仕様書（本ファイル）
- アプリケーション実装（今後）
- Neo4j モデル定義・サンプルデータ（今後）
- 操作手順書／運用設計書（今後）
