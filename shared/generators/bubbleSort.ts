import type { Trace, Step, Node, Variable } from '../vep.js';
import { assertValidTrace, type TraceGenerator } from './types.js';

// ---------------------------------------------------------------------------
// Canonical Python source code (1-based line indexing)
// ---------------------------------------------------------------------------

export const BUBBLE_SORT_CODE = `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr`;

// ---------------------------------------------------------------------------
// Layout constants — consistent with Linear Search generator
// ---------------------------------------------------------------------------

const CELL_X_ORIGIN = 100;
const CELL_X_GAP = 150;
const CELL_Y = 200;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildNodes(
  arr: number[],
  comparingIndices: [number, number] | null,
  swappedIndices: [number, number] | null,
  sortedSuffixStart: number,
  allSorted: boolean
): Node[] {
  return arr.map((value, idx) => {
    let highlight: Node['highlight'] = 'idle';

    if (allSorted) {
      highlight = 'success';
    } else if (swappedIndices && (idx === swappedIndices[0] || idx === swappedIndices[1])) {
      highlight = 'swapped';
    } else if (comparingIndices && (idx === comparingIndices[0] || idx === comparingIndices[1])) {
      highlight = 'comparing';
    } else if (idx >= sortedSuffixStart) {
      highlight = 'visited';
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

function buildVariables(i: number, j: number | null, swapped: boolean): Variable[] {
  return [
    { name: 'i', value: i, type: 'integer' },
    { name: 'j', value: j, type: 'integer' },
    { name: 'swapped', value: swapped, type: 'boolean' },
  ];
}

// ---------------------------------------------------------------------------
// Generator implementation
// ---------------------------------------------------------------------------

export function generateBubbleSortTrace(input: number[]): Trace {
  if (!Array.isArray(input)) {
    throw new Error('Input must be an array of numbers');
  }

  for (let i = 0; i < input.length; i++) {
    const val = input[i];
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      throw new Error(`Invalid element at index ${i}: elements must be finite numbers`);
    }
  }

  const arr = [...input];
  const n = arr.length;
  const steps: Step[] = [];

  // Edge case 1: empty array
  if (n === 0) {
    steps.push({
      step: 0,
      nodes: [],
      edges: [],
      variables: buildVariables(0, null, false),
      explanation: 'Array is empty. No sorting required.',
      conceptTag: 'sorting',
      sourceLine: 11,
    });
  }
  // Edge case 2: single-element array
  else if (n === 1) {
    steps.push({
      step: 0,
      nodes: buildNodes(arr, null, null, 0, true),
      edges: [],
      variables: buildVariables(0, null, false),
      explanation: 'Array has only one element and is already sorted.',
      conceptTag: 'sorting',
      sourceLine: 11,
    });
  }
  // Normal array with 2 or more elements
  else {
    // Initial step: array loaded before loops start
    steps.push({
      step: steps.length,
      nodes: buildNodes(arr, null, null, n, false),
      edges: [],
      variables: buildVariables(0, null, false),
      explanation: `Initialize Bubble Sort on array [${arr.join(', ')}].`,
      conceptTag: 'sorting',
      sourceLine: 2,
    });

    let sortedSuffixStart = n;

    for (let i = 0; i < n; i++) {
      let swapped = false;

      for (let j = 0; j < n - i - 1; j++) {
        const shouldSwap = arr[j] > arr[j + 1];

        // 1. Comparison step
        steps.push({
          step: steps.length,
          nodes: buildNodes(arr, [j, j + 1], null, sortedSuffixStart, false),
          edges: [],
          variables: buildVariables(i, j, swapped),
          explanation: shouldSwap
            ? `Compare arr[${j}] = ${arr[j]} and arr[${j + 1}] = ${arr[j + 1]}. Since ${arr[j]} > ${arr[j + 1]}, a swap is needed.`
            : `Compare arr[${j}] = ${arr[j]} and arr[${j + 1}] = ${arr[j + 1]}. Since ${arr[j]} <= ${arr[j + 1]}, elements are in order.`,
          conceptTag: 'sorting',
          sourceLine: 6,
        });

        // 2. Swap step (if out of order)
        if (shouldSwap) {
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
          swapped = true;

          steps.push({
            step: steps.length,
            nodes: buildNodes(arr, null, [j, j + 1], sortedSuffixStart, false),
            edges: [],
            variables: buildVariables(i, j, true),
            explanation: `Swapped ${temp} and ${arr[j]}. Array is now [${arr.join(', ')}].`,
            conceptTag: 'sorting',
            sourceLine: 7,
          });
        }
      }

      // After pass i completes, the element at index (n - 1 - i) is in its final position
      sortedSuffixStart = n - 1 - i;

      // Check break condition: if not swapped
      if (!swapped) {
        break;
      }
    }

    // Final completion step: all elements sorted
    steps.push({
      step: steps.length,
      nodes: buildNodes(arr, null, null, 0, true),
      edges: [],
      variables: buildVariables(Math.max(0, n - 1), null, false),
      explanation: 'Bubble Sort complete! The array is fully sorted in ascending order.',
      conceptTag: 'sorting',
      sourceLine: 11,
    });
  }

  const raw: Trace = {
    id: 'bubble-sort',
    title: 'Bubble Sort',
    description: 'Sort an array by repeatedly swapping adjacent out-of-order elements',
    language: 'python',
    track: 'dsa',
    algorithm: 'bubble-sort',
    code: BUBBLE_SORT_CODE,
    input: [...input],
    totalSteps: steps.length,
    steps,
  };

  assertValidTrace(raw);
  return raw;
}

// ---------------------------------------------------------------------------
// TraceGenerator instance
// ---------------------------------------------------------------------------

export const bubbleSortGenerator: TraceGenerator<number[]> & { conceptTag: string } = {
  id: 'bubble-sort',
  title: 'Bubble Sort',
  description: 'Sort an array by repeatedly swapping adjacent out-of-order elements',
  language: 'python',
  track: 'dsa',
  defaultInput: [5, 2, 9, 1, 3],
  conceptTag: 'sorting',
  generate: generateBubbleSortTrace,
};
