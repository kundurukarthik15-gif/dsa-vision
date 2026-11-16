import { describe, it, expect } from 'vitest';
import {
  generateBubbleSortTrace,
  bubbleSortGenerator,
  BUBBLE_SORT_CODE,
} from '../bubbleSort.js';
import { validateTrace, isValidTrace } from '../../types/vep.js';

describe('Bubble Sort Trace Generator', () => {
  const defaultInput = [5, 2, 9, 1, 3];

  // ── 1. Generated trace passes validateTrace ──────────────────────────────
  it('passes VEP schema validation with Python metadata', () => {
    const trace = generateBubbleSortTrace(defaultInput);

    expect(isValidTrace(trace)).toBe(true);
    const validated = validateTrace(trace);

    expect(validated.id).toBe('bubble-sort');
    expect(validated.title).toBe('Bubble Sort');
    expect(validated.language).toBe('python');
    expect(validated.track).toBe('dsa');
    expect(validated.algorithm).toBe('bubble-sort');
    expect(validated.code).toBe(BUBBLE_SORT_CODE);
    expect(validated.totalSteps).toBe(validated.steps.length);
    expect(validated.steps.length).toBeGreaterThan(0);
  });

  // ── 2. Final array is sorted in ascending order ──────────────────────────
  it('sorts the final array in ascending order', () => {
    const trace = generateBubbleSortTrace(defaultInput);
    const finalStep = trace.steps[trace.steps.length - 1];

    const finalValues = finalStep.nodes.map((n) => n.value);
    expect(finalValues).toEqual([1, 2, 3, 5, 9]);

    // All final nodes should be marked with success highlight
    expect(finalStep.nodes.every((n) => n.highlight === 'success')).toBe(true);
    expect(finalStep.explanation).toContain('complete');
  });

  // ── 3. Trace contains comparison and swap steps ──────────────────────────
  it('contains comparison and swap steps with correct highlights and variables', () => {
    const trace = generateBubbleSortTrace(defaultInput);

    // Filter comparison steps (steps with nodes marked as "comparing")
    const comparisonSteps = trace.steps.filter((s) =>
      s.nodes.some((n) => n.highlight === 'comparing')
    );
    expect(comparisonSteps.length).toBeGreaterThan(0);

    // Filter swap steps (steps with nodes marked as "swapped")
    const swapSteps = trace.steps.filter((s) =>
      s.nodes.some((n) => n.highlight === 'swapped')
    );
    expect(swapSteps.length).toBeGreaterThan(0);

    // Check that exactly 2 nodes are comparing in comparison steps
    for (const step of comparisonSteps) {
      const comparingNodes = step.nodes.filter((n) => n.highlight === 'comparing');
      expect(comparingNodes).toHaveLength(2);
      expect(step.sourceLine).toBe(6);
      expect(step.conceptTag).toBe('sorting');

      const varNames = step.variables.map((v) => v.name);
      expect(varNames).toContain('i');
      expect(varNames).toContain('j');
      expect(varNames).toContain('swapped');
    }

    // Check that exactly 2 nodes are marked swapped in swap steps
    for (const step of swapSteps) {
      const swappedNodes = step.nodes.filter((n) => n.highlight === 'swapped');
      expect(swappedNodes).toHaveLength(2);
      expect(step.sourceLine).toBe(7);

      const swappedVar = step.variables.find((v) => v.name === 'swapped');
      expect(swappedVar?.value).toBe(true);
    }
  });

  // ── 4. Determinism: identical input produces identical traces ───────────
  it('produces identical traces for identical inputs (pure & deterministic)', () => {
    const trace1 = generateBubbleSortTrace([4, 1, 3]);
    const trace2 = generateBubbleSortTrace([4, 1, 3]);

    expect(trace1).toEqual(trace2);
    expect(JSON.stringify(trace1)).toBe(JSON.stringify(trace2));
  });

  it('does not mutate the input array', () => {
    const input = [5, 2, 9, 1, 3];
    const copy = [...input];

    generateBubbleSortTrace(input);

    expect(input).toEqual(copy);
  });

  // ── 5. Empty and single-element arrays are handled safely ─────────────────
  it('handles empty array safely', () => {
    const trace = generateBubbleSortTrace([]);

    expect(isValidTrace(trace)).toBe(true);
    expect(trace.totalSteps).toBe(1);
    expect(trace.steps).toHaveLength(1);
    expect(trace.steps[0].nodes).toHaveLength(0);
    expect(trace.steps[0].conceptTag).toBe('sorting');
  });

  it('handles single-element array safely', () => {
    const trace = generateBubbleSortTrace([42]);

    expect(isValidTrace(trace)).toBe(true);
    expect(trace.totalSteps).toBe(1);
    expect(trace.steps).toHaveLength(1);
    expect(trace.steps[0].nodes).toHaveLength(1);
    expect(trace.steps[0].nodes[0].value).toBe(42);
    expect(trace.steps[0].nodes[0].highlight).toBe('success');
  });

  it('handles already sorted array with early exit', () => {
    const trace = generateBubbleSortTrace([1, 2, 3, 4]);

    expect(isValidTrace(trace)).toBe(true);
    const finalStep = trace.steps[trace.steps.length - 1];
    expect(finalStep.nodes.map((n) => n.value)).toEqual([1, 2, 3, 4]);

    // In an already sorted array of length 4, only 3 comparisons occur and 0 swaps occur
    const swapSteps = trace.steps.filter((s) =>
      s.nodes.some((n) => n.highlight === 'swapped')
    );
    expect(swapSteps).toHaveLength(0);
  });

  // ── 6. Invalid input is rejected with a clear error ──────────────────────
  it('rejects non-array input with a clear error message', () => {
    // @ts-expect-error Testing runtime invalid input
    expect(() => generateBubbleSortTrace(null)).toThrow('Input must be an array');
    // @ts-expect-error Testing runtime invalid input
    expect(() => generateBubbleSortTrace('not an array')).toThrow('Input must be an array');
    // @ts-expect-error Testing runtime invalid input
    expect(() => generateBubbleSortTrace({})).toThrow('Input must be an array');
  });

  it('rejects array containing non-finite or non-number elements', () => {
    // @ts-expect-error Testing runtime invalid element
    expect(() => generateBubbleSortTrace([1, 'foo', 3])).toThrow('finite numbers');
    expect(() => generateBubbleSortTrace([1, NaN, 3])).toThrow('finite numbers');
    expect(() => generateBubbleSortTrace([1, Infinity, 3])).toThrow('finite numbers');
  });

  // ── 7. TraceGenerator contract compliance ─────────────────────────────────
  it('bubbleSortGenerator complies with the TraceGenerator interface', () => {
    expect(bubbleSortGenerator.id).toBe('bubble-sort');
    expect(bubbleSortGenerator.title).toBe('Bubble Sort');
    expect(bubbleSortGenerator.language).toBe('python');
    expect(bubbleSortGenerator.track).toBe('dsa');
    expect(bubbleSortGenerator.conceptTag).toBe('sorting');
    expect(bubbleSortGenerator.defaultInput).toEqual([5, 2, 9, 1, 3]);

    const trace = bubbleSortGenerator.generate(bubbleSortGenerator.defaultInput);
    expect(isValidTrace(trace)).toBe(true);
  });
});
