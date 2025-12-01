import { useEffect, useMemo, useState } from 'react';
import { fetchDiff, fetchGraph } from './client';
import { DiffQueryParams, DiffResponse, GraphQueryParams, GraphResponse } from '@/types/graph';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useGraphQuery(params: GraphQueryParams): QueryState<GraphResponse> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<GraphResponse>>({ data: null, loading: false, error: null });
  const requestKey = useMemo(() => JSON.stringify(params), [params]);

  useEffect(() => {
    if (!params.rootId) {
      setState((current) => ({ ...current, data: null, error: null, loading: false }));
      return;
    }

    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));

    fetchGraph(params)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const refetch = () => {
    setState((current) => ({ ...current, loading: true }));
    fetchGraph(params)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: Error) => setState({ data: null, loading: false, error: err.message }));
  };

  return { ...state, refetch };
}

export function useDiffQuery(params: DiffQueryParams | null): QueryState<DiffResponse> {
  const [state, setState] = useState<QueryState<DiffResponse>>({ data: null, loading: false, error: null });
  const requestKey = useMemo(() => (params ? JSON.stringify(params) : ''), [params]);

  useEffect(() => {
    if (!params) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));

    fetchDiff(params)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  return state;
}
