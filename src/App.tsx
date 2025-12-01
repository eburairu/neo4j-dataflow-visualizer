import { useState } from 'react';
import { DiffQueryParams, GraphQueryParams } from './types/graph';
import { useDiffQuery, useGraphQuery } from './api/hooks';
import { Page, Panel } from './components/Layout';
import { SearchForm } from './components/SearchForm';
import { GraphList } from './components/GraphList';
import { DiffPlaceholder } from './components/DiffPlaceholder';
import './styles.css';

function App() {
  const defaultSnapshot = '2024-02-01T00:00:00Z';
  const [graphParams, setGraphParams] = useState<GraphQueryParams>({ snapshot: defaultSnapshot });
  const { data: graph, loading: graphLoading, error: graphError } = useGraphQuery(graphParams);

  const [baseSnapshot, setBaseSnapshot] = useState(defaultSnapshot);
  const [targetSnapshot, setTargetSnapshot] = useState('2024-03-01T00:00:00Z');
  const [diffParams, setDiffParams] = useState<DiffQueryParams | null>({
    base: defaultSnapshot,
    target: '2024-03-01T00:00:00Z',
    includeEdges: true,
  });

  const { data: diff, loading: diffLoading, error: diffError } = useDiffQuery(diffParams);

  return (
    <Page>
      <div className="grid">
        <Panel title="グラフ検索">
          <SearchForm
            onSubmit={(params) =>
              setGraphParams({ ...params, snapshot: graphParams.snapshot ?? defaultSnapshot })
            }
          />
        </Panel>

        <Panel title="グラフ概要">
          <GraphList
            nodes={graph?.nodes ?? []}
            edges={graph?.edges ?? []}
            loading={graphLoading}
            error={graphError}
          />
        </Panel>
      </div>

      <Panel title="差分ビュー">
        <form className="form diff-form" onSubmit={(e) => e.preventDefault()}>
          <label className="form__field">
            <span>基準スナップショット</span>
            <input
              type="text"
              placeholder="例: 2024-02-01T00:00:00Z"
              value={baseSnapshot}
              onChange={(e) => setBaseSnapshot(e.target.value)}
            />
          </label>

          <label className="form__field">
            <span>比較先スナップショット</span>
            <input
              type="text"
              placeholder="例: 2024-03-01T00:00:00Z"
              value={targetSnapshot}
              onChange={(e) => setTargetSnapshot(e.target.value)}
            />
          </label>

          <button
            type="button"
            onClick={() =>
              setDiffParams(
                baseSnapshot && targetSnapshot
                  ? { base: baseSnapshot, target: targetSnapshot, includeEdges: true }
                  : null,
              )
            }
            disabled={!baseSnapshot || !targetSnapshot}
          >
            スナップショットを比較
          </button>
        </form>

        <DiffPlaceholder diff={diff} loading={diffLoading} error={diffError} />
      </Panel>
    </Page>
  );
}

export default App;
