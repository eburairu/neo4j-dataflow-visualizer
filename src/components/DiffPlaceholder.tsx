import { DiffResponse } from '@/types/graph';

interface DiffPlaceholderProps {
  diff: DiffResponse | null;
  loading: boolean;
  error: string | null;
}

export function DiffPlaceholder({ diff, loading, error }: DiffPlaceholderProps) {
  if (loading) return <p className="muted">Computing diff…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!diff) return <p className="muted">Select snapshots to view differences.</p>;

  return (
    <div className="diff">
      <div className="pill-row">
        <span className="pill positive">{diff.nodes.filter((c) => c.action === 'added').length} nodes added</span>
        <span className="pill warning">
          {diff.nodes.filter((c) => c.action === 'removed').length} nodes removed
        </span>
        <span className="pill neutral">{diff.edges.length} edge updates</span>
      </div>
      <div className="diff__grid">
        <div>
          <h3>Node changes</h3>
          <ul>
            {diff.nodes.map((change, index) => (
              <li key={`${change.item.id}-${index}`}
                className={`diff__item diff__item--${change.action === 'removed' ? 'negative' : change.action === 'added' ? 'positive' : 'neutral'}`}>
                <strong>{change.item.label}</strong>
                <span className="muted">{change.action}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Edge changes</h3>
          <ul>
            {diff.edges.map((change, index) => (
              <li key={`${change.item.source}-${change.item.target}-${index}`}
                className={`diff__item diff__item--${change.action === 'removed' ? 'negative' : change.action === 'added' ? 'positive' : 'neutral'}`}>
                <strong>{change.item.source} → {change.item.target}</strong>
                <span className="muted">{change.action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
