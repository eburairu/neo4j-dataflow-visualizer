export type Direction = 'incoming' | 'outgoing' | 'both';

export interface GraphNode {
  id: string;
  label: string;
  type?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id?: string;
  source: string;
  target: string;
  type?: string;
  metadata?: Record<string, unknown>;
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

export type DiffAction = 'added' | 'removed' | 'updated';

export interface DiffChange<T> {
  action: DiffAction;
  item: T;
}

export interface DiffResponse {
  nodes: DiffChange<GraphNode>[];
  edges: DiffChange<GraphEdge>[];
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
