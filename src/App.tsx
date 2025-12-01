import { useState } from 'react';
import { DiffQueryParams, GraphQueryParams } from './types/graph';
import { useDiffQuery, useGraphQuery } from './api/hooks';
import { Page, Panel } from './components/Layout';
import { SearchForm } from './components/SearchForm';
import { GraphList } from './components/GraphList';
import { DiffPlaceholder } from './components/DiffPlaceholder';
import './styles.css';

function App() {
  const [graphParams, setGraphParams] = useState<GraphQueryParams>({});
  const { data: graph, loading: graphLoading, error: graphError } = useGraphQuery(graphParams);

  const [baseSnapshot, setBaseSnapshot] = useState('');
  const [targetSnapshot, setTargetSnapshot] = useState('');
  const [diffParams, setDiffParams] = useState<DiffQueryParams | null>(null);

  const { data: diff, loading: diffLoading, error: diffError } = useDiffQuery(diffParams);

  return (
    <Page>
      <div className="grid">
        <Panel title="Search graph">
          <SearchForm onSubmit={(params) => setGraphParams(params)} />
        </Panel>

        <Panel title="Graph overview">
          <GraphList
            nodes={graph?.nodes ?? []}
            edges={graph?.edges ?? []}
            loading={graphLoading}
            error={graphError}
          />
        </Panel>
      </div>

      <Panel title="Diff explorer">
        <form className="form diff-form" onSubmit={(e) => e.preventDefault()}>
          <label className="form__field">
            <span>Base snapshot</span>
            <input
              type="text"
              placeholder="e.g. snapshot-2024-01"
              value={baseSnapshot}
              onChange={(e) => setBaseSnapshot(e.target.value)}
            />
          </label>

          <label className="form__field">
            <span>Target snapshot</span>
            <input
              type="text"
              placeholder="e.g. snapshot-2024-02"
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
            Compare snapshots
          </button>
        </form>

        <DiffPlaceholder diff={diff} loading={diffLoading} error={diffError} />
      </Panel>
    </Page>
  );
}

export default App;
