import type { Trace } from '../types/vep';
import { validateTrace } from '../types/vep';
import { assertValidTrace, type TraceGenerator } from './types';
import {
  generateLinearSearchTrace,
  type LinearSearchInput,
} from './linearSearchTrace';
import { bubbleSortGenerator } from './bubbleSort';
import { binarySearchGenerator } from './binarySearch';
import linkedListTraversal from '../fixtures/linked-list-traversal.json';

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
// Linear Search generator instance (uses canonical default input)
// ---------------------------------------------------------------------------

export const linearSearchGenerator: TraceGenerator<LinearSearchInput> = {
  id: 'linear-search',
  title: 'Linear Search',
  description: 'Search an array by checking elements sequentially from left to right',
  language: 'javascript',
  track: 'dsa',
  defaultInput: { array: [5, 2, 9, 1], target: 9 },
  generate: generateLinearSearchTrace,
};

// ---------------------------------------------------------------------------
// Trace Registry Definition
// ---------------------------------------------------------------------------

export const traceRegistry: Record<string, TraceEntry> = {
  'linear-search': {
    id: 'linear-search',
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
      (e) => e.id === id || (e.id === 'linear-search' && id === 'array-linear-search')
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
  // If the generator or fixture uses a different ID, preserve the actual ID and report the mismatch.
  if (trace.id !== id && trace.id !== entry.id) {
    console.warn(
      `Trace ID mismatch: registry requested "${id}", but loaded trace has ID "${trace.id}". Preserving actual trace ID "${trace.id}".`
    );
  } else if (trace.id !== entry.id) {
    console.warn(
      `Trace ID mismatch: registry entry "${entry.id}" loaded trace with ID "${trace.id}". Preserving actual trace ID "${trace.id}".`
    );
  }

  return trace;
}
