import { DiffQueryParams, DiffResponse, GraphQueryParams, GraphResponse } from '@/types/graph';

const BASE_URL = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchGraph(params: GraphQueryParams): Promise<GraphResponse> {
  const query = new URLSearchParams();
  if (params.rootId) query.set('rootId', params.rootId);
  if (params.depth) query.set('depth', params.depth.toString());
  if (params.direction) query.set('direction', params.direction);
  if (params.snapshot) query.set('snapshot', params.snapshot);

  const queryString = query.toString();

  if (!params.rootId) {
    return handleResponse<GraphResponse>(
      fetch(`${BASE_URL}/graph/all${queryString ? `?${queryString}` : ''}`),
    );
  }

  return handleResponse<GraphResponse>(
    fetch(`${BASE_URL}/graph${queryString ? `?${queryString}` : ''}`),
  );
}

export async function fetchDiff(params: DiffQueryParams): Promise<DiffResponse> {
  const query = new URLSearchParams({ base: params.base, target: params.target });
  if (params.includeEdges !== undefined) {
    query.set('includeEdges', String(params.includeEdges));
  }

  return handleResponse<DiffResponse>(fetch(`${BASE_URL}/diff?${query.toString()}`));
}
