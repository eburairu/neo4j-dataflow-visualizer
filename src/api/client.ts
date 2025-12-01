import { DiffRequestParams, DiffResponse, GraphRequestParams, GraphResponse } from '../types/graph';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(path: string, method: HttpMethod = 'GET', init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request to ${path} failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export const apiClient = {
  getGraph: (params: GraphRequestParams) => {
    const query = new URLSearchParams({
      rootId: params.rootId,
      depth: String(params.depth ?? 10),
      direction: params.direction ?? 'both',
      ...(params.snapshot ? { snapshot: params.snapshot } : {}),
    });

    return request<GraphResponse>(`/graph?${query.toString()}`);
  },
  getDiff: (params: DiffRequestParams) => {
    const query = new URLSearchParams({ base: params.base, target: params.target });
    return request<DiffResponse>(`/diff?${query.toString()}`);
  },
};
