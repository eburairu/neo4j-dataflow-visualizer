import { GraphEdge, GraphNode, GraphResponse } from '../types/graph';
import { Placeholder } from './Layout';

type Props = {
  data: GraphResponse | null;
  loading: boolean;
  error: string | null;
};

function NodeList({ nodes }: { nodes: GraphNode[] }) {
  if (!nodes.length) return <Placeholder>ノードがまだ読み込まれていません。</Placeholder>;

  return (
    <div>
      <div className="status-row">
        <strong>ノード ({nodes.length})</strong>
        <div className="tag-stack">
          <span className="badge">サマリ</span>
          <span className="badge">ID + ラベル</span>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>ラベル</th>
            <th>タイプ</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr key={node.id}>
              <td>{node.id}</td>
              <td>{node.label}</td>
              <td>{node.type ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EdgeList({ edges }: { edges: GraphEdge[] }) {
  if (!edges.length) return <Placeholder>エッジ情報はまだありません。</Placeholder>;

  return (
    <div>
      <div className="status-row">
        <strong>エッジ ({edges.length})</strong>
        <span className="badge">source → target</span>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {edges.map((edge, index) => (
            <tr key={edge.id ?? `${edge.source}-${edge.target}-${index}`}>
              <td>{edge.source}</td>
              <td>{edge.target}</td>
              <td>{edge.type ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GraphList({ data, loading, error }: Props) {
  if (loading) return <Placeholder>グラフを読み込み中...</Placeholder>;
  if (error) return <Placeholder>読み込みエラー: {error}</Placeholder>;
  if (!data) return <Placeholder>検索してグラフを読み込みます。</Placeholder>;

  return (
    <div className="input-grid">
      <NodeList nodes={data.nodes} />
      <EdgeList edges={data.edges} />
    </div>
  );
}
