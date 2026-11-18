import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTraceById } from './traces';
import type { Trace } from '../types/vep';

export interface UseTraceResult {
  trace: Trace | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * React hook to fetch and validate an individual algorithm trace by ID.
 * Cancels pending in-flight requests when ID changes or component unmounts.
 */
export function useTrace(id: string | null | undefined): UseTraceResult {
  const [trace, setTrace] = useState<Trace | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadTrace = useCallback(async (targetId: string, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchTraceById(targetId, signal);
      setTrace(data);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request cancelled on unmount or id change, ignore state update
        return;
      }
      const message =
        err instanceof Error
          ? err.message
          : `Unknown error loading trace "${targetId}"`;
      setError(message);
      setTrace(null);
    } finally {
      // Avoid clearing loading if aborted
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!id) {
      setTrace(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    loadTrace(id, controller.signal);

    return () => {
      controller.abort();
    };
  }, [id, loadTrace]);

  const refetch = useCallback(async () => {
    if (!id) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    await loadTrace(id, controller.signal);
  }, [id, loadTrace]);

  return { trace, loading, error, refetch };
}
