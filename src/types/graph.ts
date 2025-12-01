export type Direction = 'up' | 'down' | 'both';

export interface GraphNode {
  id: string;
  label: string;
  type?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id?: string;
  source?: string;
  target?: string;
  type?: string;
  metadata?: Record<string, unknown>;
  from?: string;
  to?: string;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  snapshot?: string;
  stats?: {
    nodeCount?: number;
    edgeCount?: number;
  };
}

export interface DiffDelta<T> {
  added: T[];
  removed: T[];
}

export interface DiffResponse {
  nodes: DiffDelta<GraphNode>;
  edges: DiffDelta<GraphEdge>;
}

export interface GraphQueryParams {
  rootId?: string;
  depth?: number;
  direction?: Direction;
  snapshot?: string;
}

export interface DiffQueryParams {
  base: string;
  target: string;
  includeEdges?: boolean;
}
