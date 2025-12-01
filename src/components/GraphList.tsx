import { GraphEdge, GraphNode } from '@/types/graph';

interface GraphListProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  loading: boolean;
  error: string | null;
}

export function GraphList({ nodes, edges, loading, error }: GraphListProps) {
  if (loading) return <p className="muted">Loading graph…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!nodes.length) return <p className="muted">No graph data yet. Search for a root node to begin.</p>;

  return (
    <div className="list">
      <div className="list__meta">
        <span>{nodes.length} nodes</span>
        <span>{edges.length} edges</span>
      </div>
      <div className="table">
        <div className="table__header">
          <span>Label</span>
          <span>Type</span>
          <span>ID</span>
        </div>
        <div className="table__body">
          {nodes.map((node) => (
            <div key={node.id} className="table__row">
              <span>{node.label}</span>
              <span className="muted">{node.type ?? 'unknown'}</span>
              <span className="muted code">{node.id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
