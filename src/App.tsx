import { useState } from 'react';
import { DiffRequestParams, GraphRequestParams } from './types/graph';
import { useDiffQuery, useGraphQuery } from './api/hooks';
import { Panel } from './components/Layout';
import { SearchForm } from './components/SearchForm';
import { GraphList } from './components/GraphList';
import { DiffResults } from './components/DiffResults';

export default function App() {
  const [searchParams, setSearchParams] = useState<GraphRequestParams | null>(null);
  const [diffParams, setDiffParams] = useState<DiffRequestParams | null>(null);

  const graphQuery = useGraphQuery(undefined, { enabled: false });
  const diffQuery = useDiffQuery({ enabled: false });

  const handleSearch = (params: GraphRequestParams) => {
    setSearchParams(params);
    graphQuery.run(params);
  };

  const handleDiff = (params: DiffRequestParams) => {
    setDiffParams(params);
    diffQuery.run(params);
  };

  return (
    <>
      <header>
        <p className="badge">Neo4j + Informatica</p>
        <h1>Dataflow Visualizer</h1>
        <p className="lead">依存グラフの検索とスナップショット差分をブラウザから確認できます。</p>
      </header>

      <main>
        <Panel title="検索とフィルター">
          <SearchForm defaultValues={searchParams ?? undefined} onSearch={handleSearch} />
          <section>
            <h3 style={{ margin: '8px 0' }}>スナップショット差分</h3>
            <DiffForm defaultValues={diffParams ?? undefined} onRun={handleDiff} />
          </section>
        </Panel>

        <Panel title="グラフ一覧">
          <GraphList data={graphQuery.data} loading={graphQuery.loading} error={graphQuery.error} />
        </Panel>

        <Panel title="差分結果">
          <DiffResults data={diffQuery.data} loading={diffQuery.loading} error={diffQuery.error} />
        </Panel>
      </main>
    </>
  );
}

function DiffForm({
  defaultValues,
  onRun,
}: {
  defaultValues?: Partial<DiffRequestParams>;
  onRun: (params: DiffRequestParams) => void;
}) {
  const [base, setBase] = useState(defaultValues?.base ?? '');
  const [target, setTarget] = useState(defaultValues?.target ?? '');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!base.trim() || !target.trim()) return;
    onRun({ base: base.trim(), target: target.trim() });
  };

  return (
    <form className="input-grid" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="base">ベーススナップショット</label>
        <input
          id="base"
          name="base"
          placeholder="2024-01-01"
          value={base}
          onChange={(e) => setBase(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="target">比較スナップショット</label>
        <input
          id="target"
          name="target"
          placeholder="2024-02-01"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
      </div>
      <button type="submit" className="secondary">
        差分を取得
      </button>
    </form>
  );
}
