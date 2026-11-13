import type { Trace, Node, Variable } from '../types/vep';
import { validateTrace } from '../types/vep';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface LinearSearchInput {
  array: number[];
  target: number;
}

// ---------------------------------------------------------------------------
// Layout constants â€” match the reference fixture exactly
// ---------------------------------------------------------------------------

const CELL_X_ORIGIN = 100;
const CELL_X_GAP = 150;
const CELL_Y = 200;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a full snapshot of the array nodes for a given step. */
function buildNodes(
  array: number[],
  currentIndex: number | null,
  foundAt: number | null,
  done: boolean
): Node[] {
  return array.map((value, idx) => {
    let highlight: Node['highlight'] = 'idle';

    if (done && foundAt !== null) {
      // Final state: found â€” keep success/visited permanent.
      // foundAt is already narrowed to number by the !== null guard above.
      if (idx === foundAt) {
        highlight = 'success';
      } else if (idx < foundAt) {
        highlight = 'visited';
      }
    } else if (done && foundAt === null) {
      // Final state: not found â€” everything visited
      highlight = 'visited';
    } else if (currentIndex !== null) {
      if (idx === currentIndex) {
        highlight = 'comparing';
      } else if (idx < currentIndex) {
        highlight = 'visited';
      }
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

/** Core variables present in every step. */
function baseVars(i: number, target: number, found: boolean): Variable[] {
  return [
    { name: 'i', value: i, type: 'integer' },
    { name: 'target', value: target, type: 'integer' },
    { name: 'found', value: found, type: 'boolean' },
  ];
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export function generateLinearSearchTrace(input: LinearSearchInput): Trace {
  const { array, target } = input;

  // -------------------------------------------------------------------------
  // Build steps
  // -------------------------------------------------------------------------

  type StepInput = {
    step: number;
    nodes: Node[];
    variables: Variable[];
    explanation: string;
    conceptTag?: string;
  };

  const steps: StepInput[] = [];

  // --- Step 0: Initialization ----------------------------------------------
  steps.push({
    step: 0,
    nodes: buildNodes(array, null, null, false),
    variables: [
      { name: 'i', value: 0, type: 'integer' },
      { name: 'target', value: target, type: 'integer' },
      { name: 'found', value: false, type: 'boolean' },
    ],
    explanation:
      array.length === 0
        ? 'Array is empty. Nothing to search.'
        : `Initialize the array and target. Begin searching from index 0.`,
    conceptTag: 'initialization',
  });

  if (array.length === 0) {
    // No comparison steps â€” jump straight to completion
    steps.push({
      step: 1,
      nodes: [],
      variables: [
        { name: 'i', value: 0, type: 'integer' },
        { name: 'target', value: target, type: 'integer' },
        { name: 'found', value: false, type: 'boolean' },
        { name: 'resultIndex', value: -1, type: 'integer' },
      ],
      explanation: 'Array is empty. Linear search completed with no result.',
      conceptTag: 'completed',
    });
  } else {
    let foundAt: number | null = null;

    // --- Per-index comparison steps ----------------------------------------
    for (let i = 0; i < array.length; i++) {
      const isMatch = array[i] === target;

      // Comparison step: highlight current cell as "comparing"
      steps.push({
        step: steps.length,
        nodes: buildNodes(array, i, null, false),
        variables: baseVars(i, target, false),
        explanation: isMatch
          ? `Compare array[${i}] = ${array[i]} with target ${target}. They are equal â€” a match will be recorded.`
          : `Compare array[${i}] = ${array[i]} with target ${target}. They are not equal.`,
        conceptTag: 'comparison',
      });

      if (isMatch) {
        foundAt = i;

        // "Found" step: switch cell to "success", set found=true
        steps.push({
          step: steps.length,
          nodes: buildNodes(array, null, foundAt, true),
          variables: [
            { name: 'i', value: i, type: 'integer' },
            { name: 'target', value: target, type: 'integer' },
            { name: 'found', value: true, type: 'boolean' },
          ],
          explanation: `Target matches array[${i}]. Mark element as found and set found to true.`,
          conceptTag: 'target-found',
        });

        // "Completed" step: add resultIndex
        steps.push({
          step: steps.length,
          nodes: buildNodes(array, null, foundAt, true),
          variables: [
            { name: 'i', value: i, type: 'integer' },
            { name: 'target', value: target, type: 'integer' },
            { name: 'found', value: true, type: 'boolean' },
            { name: 'resultIndex', value: i, type: 'integer' },
          ],
          explanation: `Linear search completed successfully. Target ${target} was found at index ${i}.`,
          conceptTag: 'completed',
        });

        break; // stop at first match
      }
    }

    // --- Not-found completion step -----------------------------------------
    if (foundAt === null) {
      steps.push({
        step: steps.length,
        nodes: buildNodes(array, null, null, true),
        variables: [
          // After a for-loop over all indices, `i` last held `array.length - 1`
          // (the final index checked). Using array.length would imply an index
          // that never existed as a node; array.length - 1 matches actual loop
          // termination semantics for a Python `for i in range(n)` model.
          { name: 'i', value: array.length - 1, type: 'integer' },
          { name: 'target', value: target, type: 'integer' },
          { name: 'found', value: false, type: 'boolean' },
          { name: 'resultIndex', value: -1, type: 'integer' },
        ],
        explanation: `Linear search completed. Target ${target} was not found in the array.`,
        conceptTag: 'completed',
      });
    }
  }

  // -------------------------------------------------------------------------
  // Assemble and validate the trace
  // -------------------------------------------------------------------------

  const raw = {
    id: 'array-linear-search',
    title: `Linear Search: find ${target} in [${array.join(', ')}]`,
    description:
      'Visualizes how linear search checks each array element until the target is found.',
    language: 'python' as const,
    track: 'dsa' as const,
    algorithm: 'linear-search',
    input: { array, target },
    totalSteps: steps.length,
    steps: steps.map((s) => ({
      ...s,
      // edges default [] â€” omitting keeps Zod default; include explicitly for clarity
      edges: [],
    })),
  };

  return validateTrace(raw);
}
