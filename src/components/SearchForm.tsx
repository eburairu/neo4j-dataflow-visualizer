import { FormEvent, useState } from 'react';
import { Direction, GraphQueryParams } from '@/types/graph';

interface SearchFormProps {
  onSubmit: (params: GraphQueryParams) => void;
}

export function SearchForm({ onSubmit }: SearchFormProps) {
  const [rootId, setRootId] = useState('');
  const [depth, setDepth] = useState(3);
  const [direction, setDirection] = useState<Direction>('both');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!rootId.trim()) return;
    onSubmit({ rootId: rootId.trim(), depth, direction });
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <span>起点ノード</span>
        <input
          type="text"
          placeholder="例: ingest-oppty"
          value={rootId}
          onChange={(e) => setRootId(e.target.value)}
        />
      </label>

      <label className="form__field">
        <span>深さ</span>
        <input type="number" min={1} max={10} value={depth} onChange={(e) => setDepth(Number(e.target.value))} />
      </label>

      <label className="form__field">
        <span>方向</span>
        <select value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
          <option value="both">両方向</option>
          <option value="up">上流のみ</option>
          <option value="down">下流のみ</option>
        </select>
      </label>

      <button type="submit">グラフを取得</button>
    </form>
  );
}
