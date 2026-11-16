import type { Trace, Step, Node, Variable } from '../types/vep';
import { assertValidTrace, type TraceGenerator } from './types';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface BinarySearchInput {
  array: number[];
  target: number;
}

// ---------------------------------------------------------------------------
// Canonical Python source code (1-based line indexing)
// ---------------------------------------------------------------------------

export const BINARY_SEARCH_CODE = `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1

    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1

    return -1`;

// ---------------------------------------------------------------------------
// Layout constants — consistent with Linear Search & Bubble Sort generators
// ---------------------------------------------------------------------------

const CELL_X_ORIGIN = 100;
const CELL_X_GAP = 150;
const CELL_Y = 200;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildNodes(
  arr: number[],
  low: number,
  high: number,
  mid: number | null,
  foundIndex: number | null
): Node[] {
  return arr.map((value, idx) => {
    let highlight: Node['highlight'] = 'idle';

    if (foundIndex !== null && idx === foundIndex) {
      highlight = 'success';
    } else if (mid !== null && idx === mid) {
      highlight = 'comparing';
    } else if (idx < low || idx > high) {
      highlight = 'visited';
    } else {
      highlight = 'idle';
    }

    return {
      id: String(idx),
      kind: 'array-cell' as const,
      label: `Index ${idx}`,
      value,
      position: { x: CELL_X_ORIGIN + idx * CELL_X_GAP, y: CELL_Y },
      highlight,
    };
  });
}

function buildVariables(
  low: number,
  high: number,
  mid: number | null,
  target: number
): Variable[] {
  return [
    { name: 'low', value: low, type: 'integer' },
    { name: 'high', value: high, type: 'integer' },
    { name: 'mid', value: mid, type: 'integer' },
    { name: 'target', value: target, type: 'integer' },
  ];
}

// ---------------------------------------------------------------------------
// Generator implementation
// ---------------------------------------------------------------------------

export function generateBinarySearchTrace(input: BinarySearchInput): Trace {
  // 1. Validate structure
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Input must be an object with "array" and "target" properties');
  }

  const { array, target } = input;

  if (typeof target !== 'number' || !Number.isFinite(target)) {
    throw new Error('Target must be a finite number');
  }

  if (!Array.isArray(array)) {
    throw new Error('Array must be an array of numbers');
  }

  for (let i = 0; i < array.length; i++) {
    const val = array[i];
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      throw new Error(`Invalid array element at index ${i}: elements must be finite numbers`);
    }
  }

  // 2. Require array to be sorted in ascending order
  for (let i = 1; i < array.length; i++) {
    if (array[i] < array[i - 1]) {
      throw new Error(
        `Input array must be sorted in ascending order (found ${array[i - 1]} before ${array[i]} at index ${i})`
      );
    }
  }

  const arr = [...array];
  const n = arr.length;
  const steps: Step[] = [];

  // Edge case 1: empty array
  if (n === 0) {
    steps.push({
      step: 0,
      nodes: [],
      edges: [],
      variables: buildVariables(0, -1, null, target),
      explanation: `Array is empty. Target ${target} was not found.`,
      conceptTag: 'searching',
      sourceLine: 14,
    });
  } else {
    let low = 0;
    let high = n - 1;
    let foundIndex: number | null = null;

    // Step 0: Initial step
    steps.push({
      step: steps.length,
      nodes: buildNodes(arr, low, high, null, null),
      edges: [],
      variables: buildVariables(low, high, null, target),
      explanation: `Initialize Binary Search for target ${target} in array of ${n} elements. Set low = ${low}, high = ${high}.`,
      conceptTag: 'searching',
      sourceLine: 2,
    });

    // Binary search loop
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midVal = arr[mid];

      if (midVal === target) {
        foundIndex = mid;

        // Step: mid comparison
        steps.push({
          step: steps.length,
          nodes: buildNodes(arr, low, high, mid, null),
          edges: [],
          variables: buildVariables(low, high, mid, target),
          explanation: `Checking midpoint index ${mid} (value ${midVal}). Found target ${target}!`,
          conceptTag: 'searching',
          sourceLine: 7,
        });

        // Completion step: target found
        steps.push({
          step: steps.length,
          nodes: buildNodes(arr, low, high, null, foundIndex),
          edges: [],
          variables: buildVariables(low, high, mid, target),
          explanation: `Target ${target} found at index ${mid}. Binary search complete.`,
          conceptTag: 'searching',
          sourceLine: 8,
        });

        break;
      } else if (midVal < target) {
        // Step: mid comparison (target is in right half)
        steps.push({
          step: steps.length,
          nodes: buildNodes(arr, low, high, mid, null),
          edges: [],
          variables: buildVariables(low, high, mid, target),
          explanation: `Checking midpoint index ${mid} (value ${midVal}). Since ${midVal} < ${target}, target is in right half. Updating low = ${mid + 1}.`,
          conceptTag: 'searching',
          sourceLine: 7,
        });

        low = mid + 1;
      } else {
        // Step: mid comparison (target is in left half)
        steps.push({
          step: steps.length,
          nodes: buildNodes(arr, low, high, mid, null),
          edges: [],
          variables: buildVariables(low, high, mid, target),
          explanation: `Checking midpoint index ${mid} (value ${midVal}). Since ${midVal} > ${target}, target is in left half. Updating high = ${mid - 1}.`,
          conceptTag: 'searching',
          sourceLine: 7,
        });

        high = mid - 1;
      }
    }

    // Completion step for absent target
    if (foundIndex === null) {
      steps.push({
        step: steps.length,
        nodes: buildNodes(arr, low, high, null, null),
        edges: [],
        variables: buildVariables(low, high, null, target),
        explanation: `Search range exhausted (low = ${low} > high = ${high}). Target ${target} was not found in the array.`,
        conceptTag: 'searching',
        sourceLine: 14,
      });
    }
  }

  const raw: Trace = {
    id: 'binary-search',
    title: 'Binary Search',
    description: 'Find a target in a sorted array by repeatedly halving the search range',
    language: 'python',
    track: 'dsa',
    algorithm: 'binary-search',
    code: BINARY_SEARCH_CODE,
    input: { array: [...array], target },
    totalSteps: steps.length,
    steps,
  };

  assertValidTrace(raw);
  return raw;
}

// ---------------------------------------------------------------------------
// TraceGenerator instance
// ---------------------------------------------------------------------------

export const binarySearchGenerator: TraceGenerator<BinarySearchInput> & {
  conceptTag: string;
} = {
  id: 'binary-search',
  title: 'Binary Search',
  description: 'Find a target in a sorted array by repeatedly halving the search range',
  language: 'python',
  track: 'dsa',
  defaultInput: { array: [1, 3, 5, 7, 9, 11, 13], target: 9 },
  conceptTag: 'searching',
  generate: generateBinarySearchTrace,
};
