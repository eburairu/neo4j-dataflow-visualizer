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
        <span>Root node</span>
        <input
          type="text"
          placeholder="Enter pipeline ID"
          value={rootId}
          onChange={(e) => setRootId(e.target.value)}
        />
      </label>

      <label className="form__field">
        <span>Depth</span>
        <input type="number" min={1} max={10} value={depth} onChange={(e) => setDepth(Number(e.target.value))} />
      </label>

      <label className="form__field">
        <span>Direction</span>
        <select value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
          <option value="both">Both directions</option>
          <option value="incoming">Incoming only</option>
          <option value="outgoing">Outgoing only</option>
        </select>
      </label>

      <button type="submit">Fetch graph</button>
    </form>
  );
}
