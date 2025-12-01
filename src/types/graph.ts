export type Direction = 'inbound' | 'outbound' | 'both';

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
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  snapshot?: string;
}

export interface GraphRequestParams {
  rootId: string;
  depth?: number;
  direction?: Direction;
  snapshot?: string;
}

export interface DiffChange {
  id: string;
  type: 'added' | 'removed' | 'modified';
  label?: string;
  details?: string;
}

export interface DiffResponse {
  addedNodes: GraphNode[];
  removedNodes: GraphNode[];
  changedEdges: GraphEdge[];
  changes?: DiffChange[];
  summary?: string;
}

export interface DiffRequestParams {
  base: string;
  target: string;
}
