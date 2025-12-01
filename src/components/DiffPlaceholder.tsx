import { DiffResponse } from '@/types/graph';

interface DiffPlaceholderProps {
  diff: DiffResponse | null;
  loading: boolean;
  error: string | null;
}

export function DiffPlaceholder({ diff, loading, error }: DiffPlaceholderProps) {
  if (loading) return <p className="muted">差分を計算しています…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!diff) return <p className="muted">スナップショットを選択すると差分が表示されます。</p>;

  const addedNodes = diff.nodes.added.length;
  const removedNodes = diff.nodes.removed.length;
  const addedEdges = diff.edges.added.length;
  const removedEdges = diff.edges.removed.length;

  return (
    <div className="diff">
      <div className="pill-row">
        <span className="pill positive">ノード追加 {addedNodes} 件</span>
        <span className="pill warning">ノード削除 {removedNodes} 件</span>
        <span className="pill neutral">エッジ追加 {addedEdges} 件 / 削除 {removedEdges} 件</span>
      </div>
      <div className="diff__grid">
        <div>
          <h3>ノードの変化</h3>
          <ul>
            {diff.nodes.added.map((node) => (
              <li key={`added-${node.id}`} className="diff__item diff__item--positive">
                <strong>{node.label}</strong>
                <span className="muted">追加</span>
              </li>
            ))}
            {diff.nodes.removed.map((node) => (
              <li key={`removed-${node.id}`} className="diff__item diff__item--negative">
                <strong>{node.label}</strong>
                <span className="muted">削除</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>エッジの変化</h3>
          <ul>
            {diff.edges.added.map((edge) => (
              <li key={`added-${edge.source ?? edge.from}-${edge.target ?? edge.to}`} className="diff__item diff__item--positive">
                <strong>{edge.source ?? edge.from} → {edge.target ?? edge.to}</strong>
                <span className="muted">追加</span>
              </li>
            ))}
            {diff.edges.removed.map((edge) => (
              <li key={`removed-${edge.source ?? edge.from}-${edge.target ?? edge.to}`} className="diff__item diff__item--negative">
                <strong>{edge.source ?? edge.from} → {edge.target ?? edge.to}</strong>
                <span className="muted">削除</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
