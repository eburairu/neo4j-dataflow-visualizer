import { GraphEdge, GraphNode } from '@/types/graph';

interface GraphListProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  loading: boolean;
  error: string | null;
}

export function GraphList({ nodes, edges, loading, error }: GraphListProps) {
  if (loading) return <p className="muted">グラフを読み込み中…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!nodes.length) return <p className="muted">サンプルデータを表示しています。条件を入力して絞り込んでください。</p>;

  return (
    <div className="list">
      <div className="list__meta">
        <span>ノード数: {nodes.length}</span>
        <span>エッジ数: {edges.length}</span>
      </div>
      <div className="table">
        <div className="table__header">
          <span>ラベル</span>
          <span>タイプ</span>
          <span>ID</span>
        </div>
        <div className="table__body">
          {nodes.map((node) => (
            <div key={node.id} className="table__row">
              <span>{node.label}</span>
              <span className="muted">{node.type ?? '不明'}</span>
              <span className="muted code">{node.id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
