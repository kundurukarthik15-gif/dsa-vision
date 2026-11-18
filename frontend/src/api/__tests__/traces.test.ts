import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchTraces, fetchTraceById, generateCustomLinearSearchTrace } from '../traces.js';
import { generateBubbleSortTrace } from '../../generators/bubbleSort.js';
import { generateLinearSearchTrace } from '../../generators/linearSearchTrace.js';

describe('Frontend API Client (traces.ts)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('fetchTraces', () => {
    it('successfully fetches and returns metadata for all algorithms', async () => {
      const mockTraces = [
        { id: 'array-linear-search', label: 'Linear Search', group: 'dsa' },
        { id: 'bubble-sort', label: 'Bubble Sort', group: 'dsa' },
        { id: 'binary-search', label: 'Binary Search', group: 'dsa' },
        { id: 'linked-list-traversal', label: 'Linked List Traversal', group: 'dsa' },
      ];

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ traces: mockTraces }),
      });

      const result = await fetchTraces();
      expect(result).toEqual(mockTraces);
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/traces', { signal: undefined });
    });

    it('handles HTTP error status with JSON message from server', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Internal Server Error', message: 'Database connection failed' }),
      });

      await expect(fetchTraces()).rejects.toThrow(
        /Failed to fetch traces: Database connection failed/
      );
    });

    it('handles HTTP error status when response has no JSON body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: async () => {
          throw new Error('Not JSON');
        },
      });

      await expect(fetchTraces()).rejects.toThrow(
        /Failed to fetch traces: HTTP 502 Bad Gateway/
      );
    });

    it('handles network failure when backend is unavailable', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(fetchTraces()).rejects.toThrow(
        /Failed to connect to backend server: Failed to fetch\. Ensure backend is running\./
      );
    });

    it('throws when server returns malformed data (not an array)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ traces: 'invalid-not-array' }),
      });

      await expect(fetchTraces()).rejects.toThrow(
        /Invalid response from \/api\/traces: expected { traces: Array }/
      );
    });

    it('throws when trace metadata item is missing id or label', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          traces: [{ id: 'algo-1' /* missing label */ }],
        }),
      });

      await expect(fetchTraces()).rejects.toThrow(
        /Invalid trace metadata at index 0: expected id and label strings/
      );
    });

    it('supports request cancellation via AbortSignal', async () => {
      const controller = new AbortController();
      controller.abort();

      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      await expect(fetchTraces(controller.signal)).rejects.toThrow('The operation was aborted');
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/traces', { signal: controller.signal });
    });
  });

  describe('fetchTraceById', () => {
    it('successfully fetches and validates a canonical trace', async () => {
      const validTrace = generateBubbleSortTrace([3, 1, 2]);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ trace: validTrace }),
      });

      const result = await fetchTraceById('bubble-sort');
      expect(result).toBeDefined();
      expect(result.id).toBe('bubble-sort');
      expect(result.steps.length).toBeGreaterThan(0);
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/traces/bubble-sort', { signal: undefined });
    });

    it('rejects with error when ID is empty or invalid', async () => {
      await expect(fetchTraceById('')).rejects.toThrow('Trace ID must be a non-empty string');
      await expect(fetchTraceById('   ')).rejects.toThrow('Trace ID must be a non-empty string');
    });

    it('handles HTTP 404 for unknown algorithm ID', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: 'Not Found',
          message: 'Algorithm trace with id "unknown-algo" was not found.',
        }),
      });

      await expect(fetchTraceById('unknown-algo')).rejects.toThrow(
        /Failed to fetch trace "unknown-algo": Algorithm trace with id "unknown-algo" was not found\./
      );
    });

    it('throws validation error when backend returns invalid trace schema', async () => {
      const invalidTrace = {
        id: 'bad-trace',
        title: 'Bad Trace',
        // Missing required fields: language, track, algorithm, totalSteps, steps
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ trace: invalidTrace }),
      });

      await expect(fetchTraceById('bad-trace')).rejects.toThrow(
        /Trace validation failed for "bad-trace":/
      );
    });

    it('handles network failure when fetching a trace', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('NetworkError when attempting to fetch resource.'));

      await expect(fetchTraceById('bubble-sort')).rejects.toThrow(
        /Failed to connect to backend server: NetworkError/
      );
    });

    it('supports request cancellation via AbortSignal', async () => {
      const controller = new AbortController();
      controller.abort();

      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      await expect(fetchTraceById('bubble-sort', controller.signal)).rejects.toThrow('The operation was aborted');
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/traces/bubble-sort', { signal: controller.signal });
    });
  });

  describe('generateCustomLinearSearchTrace', () => {
    it('successfully posts custom values and returns validated trace', async () => {
      const customTrace = generateLinearSearchTrace({
        array: [10, 20, 30],
        target: 20,
      });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ trace: customTrace }),
      });

      const result = await generateCustomLinearSearchTrace({
        values: [10, 20, 30],
        target: 20,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('array-linear-search');
      expect(result.steps.length).toBeGreaterThan(0);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/traces/array-linear-search/generate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: [10, 20, 30], target: 20 }),
        })
      );
    });

    it('handles HTTP 400 validation error from backend', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: 'Bad Request',
          message: 'Invalid input: values must be an array of integers.',
        }),
      });

      await expect(
        generateCustomLinearSearchTrace({ values: [1.5], target: 2 })
      ).rejects.toThrow(
        /Failed to generate custom trace: Invalid input: values must be an array of integers\./
      );
    });

    it('handles network failure when backend is down', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(
        generateCustomLinearSearchTrace({ values: [1, 2], target: 2 })
      ).rejects.toThrow(
        /Failed to connect to backend server: Failed to fetch\. Ensure backend is running\./
      );
    });

    it('handles invalid response schema from generate endpoint', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ trace: { id: 'bad-schema' } }),
      });

      await expect(
        generateCustomLinearSearchTrace({ values: [1, 2], target: 2 })
      ).rejects.toThrow(/Custom trace validation failed:/);
    });

    it('supports request cancellation via AbortSignal', async () => {
      const controller = new AbortController();
      controller.abort();

      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      await expect(
        generateCustomLinearSearchTrace({ values: [1, 2], target: 2 }, controller.signal)
      ).rejects.toThrow('The operation was aborted');
    });
  });
});
