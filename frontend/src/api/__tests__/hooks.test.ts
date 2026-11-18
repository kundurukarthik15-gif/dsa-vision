import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { useTraces } from '../useTraces.js';
import { useTrace } from '../useTrace.js';
import { generateBubbleSortTrace } from '../../generators/bubbleSort.js';
import { renderHook } from './testUtils.js';

describe('Frontend API Hooks', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('useTraces', () => {
    it('handles initial loading, success state, and updates traces', async () => {
      const mockList = [
        { id: 'array-linear-search', label: 'Linear Search', group: 'dsa' },
        { id: 'bubble-sort', label: 'Bubble Sort', group: 'dsa' },
      ];

      let resolveFetch!: (val: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      globalThis.fetch = vi.fn().mockReturnValue(fetchPromise);

      const hook = await renderHook(() => useTraces());

      // While fetch is pending
      expect(hook.current.loading).toBe(true);
      expect(hook.current.traces).toEqual([]);
      expect(hook.current.error).toBeNull();

      // Resolve the fetch
      await act(async () => {
        resolveFetch({
          ok: true,
          status: 200,
          json: async () => ({ traces: mockList }),
        });
      });

      expect(hook.current.loading).toBe(false);
      expect(hook.current.traces).toEqual(mockList);
      expect(hook.current.error).toBeNull();

      await hook.unmount();
    });

    it('handles fetch error and sets error state', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server down' }),
      });

      const hook = await renderHook(() => useTraces());

      expect(hook.current.loading).toBe(false);
      expect(hook.current.traces).toEqual([]);
      expect(hook.current.error).toContain('Server down');

      await hook.unmount();
    });

    it('refetch triggers a new fetch and updates state', async () => {
      const initialList = [{ id: 'algo-1', label: 'Algo 1', group: 'dsa' }];
      const updatedList = [
        { id: 'algo-1', label: 'Algo 1', group: 'dsa' },
        { id: 'algo-2', label: 'Algo 2', group: 'dsa' },
      ];

      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return {
          ok: true,
          status: 200,
          json: async () => ({ traces: callCount === 1 ? initialList : updatedList }),
        };
      });

      const hook = await renderHook(() => useTraces());
      expect(hook.current.traces).toEqual(initialList);

      await act(async () => {
        await hook.current.refetch();
      });

      expect(hook.current.traces).toEqual(updatedList);
      expect(callCount).toBe(2);

      await hook.unmount();
    });

    it('aborts fetch on unmount without throwing unhandled rejection', async () => {
      let aborted = false;

      globalThis.fetch = vi.fn().mockImplementation((_url, opts) => {
        opts.signal.addEventListener('abort', () => {
          aborted = true;
        });
        return new Promise(() => {}); // never resolves
      });

      const hook = await renderHook(() => useTraces());
      expect(aborted).toBe(false);

      await hook.unmount();
      expect(aborted).toBe(true);
    });
  });

  describe('useTrace', () => {
    it('remains idle with loading=false when id is null or undefined', async () => {
      globalThis.fetch = vi.fn();

      const hook = await renderHook(() => useTrace(null));

      expect(hook.current.loading).toBe(false);
      expect(hook.current.trace).toBeNull();
      expect(hook.current.error).toBeNull();
      expect(globalThis.fetch).not.toHaveBeenCalled();

      await hook.unmount();
    });

    it('fetches and updates trace for valid ID', async () => {
      const validTrace = generateBubbleSortTrace([5, 1]);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ trace: validTrace }),
      });

      const hook = await renderHook(() => useTrace('bubble-sort'));

      expect(hook.current.loading).toBe(false);
      expect(hook.current.trace).toBeDefined();
      expect(hook.current.trace?.id).toBe('bubble-sort');
      expect(hook.current.error).toBeNull();

      await hook.unmount();
    });

    it('sets error state when trace fetch fails', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Trace not found' }),
      });

      const hook = await renderHook(() => useTrace('non-existent'));

      expect(hook.current.loading).toBe(false);
      expect(hook.current.trace).toBeNull();
      expect(hook.current.error).toContain('Trace not found');

      await hook.unmount();
    });

    it('aborts previous request when id changes', async () => {
      const abortedSignals: boolean[] = [];

      globalThis.fetch = vi.fn().mockImplementation((url, opts) => {
        opts.signal.addEventListener('abort', () => {
          abortedSignals.push(true);
        });
        return new Promise(() => {}); // never resolves
      });

      const hook = await renderHook(({ id }: { id: string }) => useTrace(id), {
        id: 'trace-1',
      });

      expect(abortedSignals).toHaveLength(0);

      // Change id prop
      await hook.rerender({ id: 'trace-2' });

      // First request should be aborted
      expect(abortedSignals.length).toBeGreaterThanOrEqual(1);

      await hook.unmount();
    });

    it('refetch triggers a fresh fetch', async () => {
      const validTrace = generateBubbleSortTrace([4, 2]);

      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return {
          ok: true,
          status: 200,
          json: async () => ({ trace: validTrace }),
        };
      });

      const hook = await renderHook(() => useTrace('bubble-sort'));
      expect(callCount).toBe(1);

      await act(async () => {
        await hook.current.refetch();
      });

      expect(callCount).toBe(2);
      expect(hook.current.trace?.id).toBe('bubble-sort');

      await hook.unmount();
    });
  });
});
