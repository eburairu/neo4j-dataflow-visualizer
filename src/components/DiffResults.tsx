import { DiffResponse } from '../types/graph';
import { Placeholder } from './Layout';

type Props = {
  data: DiffResponse | null;
  loading: boolean;
  error: string | null;
};

export function DiffResults({ data, loading, error }: Props) {
  if (loading) return <Placeholder>差分を計算中...</Placeholder>;
  if (error) return <Placeholder>差分取得エラー: {error}</Placeholder>;
  if (!data) return <Placeholder>スナップショットを選んで差分を確認します。</Placeholder>;

  return (
    <div className="input-grid">
      <div className="field">
        <label>追加ノード ({data.addedNodes.length})</label>
        <div className="placeholder">
          {data.addedNodes.length ? data.addedNodes.map((node) => node.label || node.id).join(', ') : 'なし'}
        </div>
      </div>
      <div className="field">
        <label>削除ノード ({data.removedNodes.length})</label>
        <div className="placeholder">
          {data.removedNodes.length
            ? data.removedNodes.map((node) => node.label || node.id).join(', ')
            : 'なし'}
        </div>
      </div>
      <div className="field">
        <label>変更エッジ ({data.changedEdges.length})</label>
        <div className="placeholder">
          {data.changedEdges.length
            ? data.changedEdges
                .map((edge) => `${edge.source} → ${edge.target}${edge.type ? ` (${edge.type})` : ''}`)
                .join(', ')
            : 'なし'}
        </div>
      </div>
      {data.summary && (
        <div className="field">
          <label>概要</label>
          <div className="placeholder">{data.summary}</div>
        </div>
      )}
    </div>
  );
}
