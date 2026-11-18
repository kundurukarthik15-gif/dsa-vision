import type { Trace } from '../vep.js';
import { validateTrace } from '../vep.js';
import { assertValidTrace } from './types.js';
import {
  linearSearchGenerator,
} from './linearSearch.js';
import { bubbleSortGenerator } from './bubbleSort.js';
import { binarySearchGenerator } from './binarySearch.js';
import linkedListTraversal from './fixtures/linked-list-traversal.json' with { type: 'json' };

// ---------------------------------------------------------------------------
// Registry Interface
// ---------------------------------------------------------------------------

export interface TraceEntry {
  id: string;
  label: string;
  group: 'dsa' | 'python' | 'java' | 'backend';
  load: () => Trace;
}

// ---------------------------------------------------------------------------
// Trace Registry Definition
// ---------------------------------------------------------------------------

export const traceRegistry: Record<string, TraceEntry> = {
  'array-linear-search': {
    id: 'array-linear-search',
    label: 'Linear Search',
    group: 'dsa',
    load: () => linearSearchGenerator.generate(linearSearchGenerator.defaultInput),
  },
  'bubble-sort': {
    id: 'bubble-sort',
    label: 'Bubble Sort',
    group: 'dsa',
    load: () => bubbleSortGenerator.generate(bubbleSortGenerator.defaultInput),
  },
  'binary-search': {
    id: 'binary-search',
    label: 'Binary Search',
    group: 'dsa',
    load: () => binarySearchGenerator.generate(binarySearchGenerator.defaultInput),
  },
  'linked-list-traversal': {
    id: 'linked-list-traversal',
    label: 'Linked List Traversal',
    group: 'dsa',
    load: () => validateTrace(linkedListTraversal),
  },
};

// Backward-compatible alias for frontend algorithm ID 'linear-search'
Object.defineProperty(traceRegistry, 'linear-search', {
  get() {
    return traceRegistry['array-linear-search'];
  },
  enumerable: false,
  configurable: true,
});

// List of registry entries for the UI algorithm picker
export const registryEntries: TraceEntry[] = Object.values(traceRegistry);

export const getTraceEntries = (): TraceEntry[] => Object.values(traceRegistry);

// ---------------------------------------------------------------------------
// Lookup & Validation Function
// ---------------------------------------------------------------------------

export function getTrace(id: string): Trace {
  let entry = traceRegistry[id];

  // Fallback lookup if referenced by legacy or underlying trace ID
  if (!entry) {
    const fallback = Object.values(traceRegistry).find(
      (e) =>
        e.id === id ||
        (e.id === 'array-linear-search' && id === 'linear-search') ||
        (e.id === 'linear-search' && id === 'array-linear-search')
    );
    if (fallback) {
      entry = fallback;
    }
  }

  if (!entry) {
    throw new Error(
      `Unknown algorithm ID "${id}". Registered IDs: ${Object.keys(traceRegistry).join(', ')}`
    );
  }

  // 1. Call load() to produce or retrieve the trace
  const trace = entry.load();

  // 2. Validate the returned trace before returning it
  assertValidTrace(trace);

  // 3. Ensure the returned trace ID matches the requested registry ID.
  // When an accepted alias (such as 'linear-search') is requested, allow the underlying trace ID.
  const isAcceptedAlias =
    id === 'linear-search' && (entry.id === 'array-linear-search' || trace.id === 'array-linear-search');

  if (!isAcceptedAlias && trace.id !== id && trace.id !== entry.id) {
    console.warn(
      `Trace ID mismatch: registry requested "${id}", but loaded trace has ID "${trace.id}". Preserving actual trace ID "${trace.id}".`
    );
  } else if (!isAcceptedAlias && trace.id !== entry.id) {
    console.warn(
      `Trace ID mismatch: registry entry "${entry.id}" loaded trace with ID "${trace.id}". Preserving actual trace ID "${trace.id}".`
    );
  }

  return trace;
}
