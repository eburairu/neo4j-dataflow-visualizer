import { useEffect, useState } from 'react';
import { apiClient } from './client';
import {
  DiffRequestParams,
  DiffResponse,
  GraphRequestParams,
  GraphResponse,
} from '../types/graph';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function createInitialState<T>(): QueryState<T> {
  return {
    data: null,
    loading: false,
    error: null,
  };
}

export function useGraphQuery(initialParams?: GraphRequestParams, options?: { enabled?: boolean }) {
  const [state, setState] = useState<QueryState<GraphResponse>>(createInitialState);
  const [params, setParams] = useState<GraphRequestParams | undefined>(initialParams);
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!params || !params.rootId || !enabled) return;

    let ignore = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    apiClient
      .getGraph(params)
      .then((data) => {
        if (!ignore) setState({ data, loading: false, error: null });
      })
      .catch((error: Error) => {
        if (!ignore) setState({ data: null, loading: false, error: error.message });
      });

    return () => {
      ignore = true;
    };
  }, [params, enabled]);

  const run = (nextParams: GraphRequestParams) => setParams(nextParams);

  return { ...state, run, params };
}

export function useDiffQuery(options?: { enabled?: boolean }) {
  const [state, setState] = useState<QueryState<DiffResponse>>(createInitialState);
  const [params, setParams] = useState<DiffRequestParams | undefined>();
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!params || !params.base || !params.target || !enabled) return;

    let ignore = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    apiClient
      .getDiff(params)
      .then((data) => {
        if (!ignore) setState({ data, loading: false, error: null });
      })
      .catch((error: Error) => {
        if (!ignore) setState({ data: null, loading: false, error: error.message });
      });

    return () => {
      ignore = true;
    };
  }, [params, enabled]);

  const run = (nextParams: DiffRequestParams) => setParams(nextParams);

  return { ...state, run, params };
}
