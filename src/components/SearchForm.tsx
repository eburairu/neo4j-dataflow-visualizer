import { FormEvent, useState } from 'react';
import { Direction, GraphRequestParams } from '../types/graph';

type Props = {
  defaultValues?: Partial<GraphRequestParams>;
  onSearch: (params: GraphRequestParams) => void;
};

const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: 'both', label: '双方向' },
  { value: 'outbound', label: '下流のみ' },
  { value: 'inbound', label: '上流のみ' },
];

export function SearchForm({ defaultValues, onSearch }: Props) {
  const [rootId, setRootId] = useState(defaultValues?.rootId ?? '');
  const [depth, setDepth] = useState(defaultValues?.depth ?? 3);
  const [direction, setDirection] = useState<Direction>(defaultValues?.direction ?? 'both');
  const [snapshot, setSnapshot] = useState(defaultValues?.snapshot ?? '');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!rootId.trim()) return;
    onSearch({ rootId: rootId.trim(), depth, direction, snapshot: snapshot || undefined });
  };

  return (
    <form className="input-grid" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="rootId">ルート ID</label>
        <input
          id="rootId"
          name="rootId"
          placeholder="例: pipeline-123"
          value={rootId}
          onChange={(e) => setRootId(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="depth">探索深さ</label>
        <input
          id="depth"
          name="depth"
          type="number"
          min={1}
          max={20}
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value) || 1)}
        />
      </div>

      <div className="field">
        <label htmlFor="direction">方向</label>
        <select
          id="direction"
          name="direction"
          value={direction}
          onChange={(e) => setDirection(e.target.value as Direction)}
        >
          {DIRECTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="snapshot">スナップショット (任意)</label>
        <input
          id="snapshot"
          name="snapshot"
          placeholder="2024-01-15"
          value={snapshot}
          onChange={(e) => setSnapshot(e.target.value)}
        />
      </div>

      <button type="submit">グラフを取得</button>
    </form>
  );
}
