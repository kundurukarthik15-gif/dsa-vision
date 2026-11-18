import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTraces, type TraceMetadata } from './traces';

export interface UseTracesResult {
  traces: TraceMetadata[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * React hook to fetch and manage the list of registered algorithm traces.
 * Automatically handles loading, error states, and unmount cancellation.
 */
export function useTraces(): UseTracesResult {
  const [traces, setTraces] = useState<TraceMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadTraces = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchTraces(signal);
      setTraces(data);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request cancelled on unmount or refetch, ignore state update
        return;
      }
      const message =
        err instanceof Error ? err.message : 'Unknown error loading traces';
      setError(message);
    } finally {
      // Avoid clearing loading if aborted
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    loadTraces(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadTraces]);

  const refetch = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    await loadTraces(controller.signal);
  }, [loadTraces]);

  return { traces, loading, error, refetch };
}
