import { describe, it, expect } from 'vitest';
import {
  generateBinarySearchTrace,
  binarySearchGenerator,
  BINARY_SEARCH_CODE,
} from '../binarySearch.js';
import { validateTrace, isValidTrace } from '../../types/vep.js';

describe('Binary Search Trace Generator', () => {
  const defaultInput = { array: [1, 3, 5, 7, 9, 11, 13], target: 9 };

  // ── 1. Valid trace schema ────────────────────────────────────────────────
  it('passes VEP schema validation with Python metadata', () => {
    const trace = generateBinarySearchTrace(defaultInput);

    expect(isValidTrace(trace)).toBe(true);
    const validated = validateTrace(trace);

    expect(validated.id).toBe('binary-search');
    expect(validated.title).toBe('Binary Search');
    expect(validated.language).toBe('python');
    expect(validated.track).toBe('dsa');
    expect(validated.algorithm).toBe('binary-search');
    expect(validated.code).toBe(BINARY_SEARCH_CODE);
    expect(validated.totalSteps).toBe(validated.steps.length);
    expect(validated.steps.length).toBeGreaterThan(0);
  });

  // ── 2. Correct target found at the expected index ────────────────────────
  it('finds target at the expected index with success highlight', () => {
    const trace = generateBinarySearchTrace(defaultInput);
    const finalStep = trace.steps[trace.steps.length - 1];

    expect(finalStep.explanation).toContain('found at index 4');
    expect(finalStep.nodes[4].highlight).toBe('success');
    expect(finalStep.nodes[4].value).toBe(9);
    expect(finalStep.sourceLine).toBe(8);

    // Filter comparison steps (where a midpoint is being compared)
    const comparisonSteps = trace.steps.filter((s) =>
      s.nodes.some((n) => n.highlight === 'comparing')
    );
    expect(comparisonSteps.length).toBeGreaterThan(0);

    for (const step of comparisonSteps) {
      expect(step.sourceLine).toBe(7);
      expect(step.conceptTag).toBe('searching');
      expect(step.nodes.filter((n) => n.highlight === 'comparing')).toHaveLength(1);
    }
  });

  // ── 3. Missing target produces no success highlight and says not found ──
  it('handles absent target properly with not-found explanation and no success highlight', () => {
    const trace = generateBinarySearchTrace({
      array: [1, 3, 5, 7, 9, 11, 13],
      target: 8,
    });

    expect(isValidTrace(trace)).toBe(true);
    const finalStep = trace.steps[trace.steps.length - 1];

    expect(finalStep.explanation).toContain('not found');
    expect(finalStep.nodes.some((n) => n.highlight === 'success')).toBe(false);
    expect(finalStep.sourceLine).toBe(14);
  });

  // ── 4. First and last array elements ─────────────────────────────────────
  it('finds target when it is the first element', () => {
    const trace = generateBinarySearchTrace({
      array: [2, 4, 6, 8, 10],
      target: 2,
    });

    expect(isValidTrace(trace)).toBe(true);
    const finalStep = trace.steps[trace.steps.length - 1];
    expect(finalStep.nodes[0].highlight).toBe('success');
    expect(finalStep.explanation).toContain('found at index 0');
  });

  it('finds target when it is the last element', () => {
    const trace = generateBinarySearchTrace({
      array: [2, 4, 6, 8, 10],
      target: 10,
    });

    expect(isValidTrace(trace)).toBe(true);
    const finalStep = trace.steps[trace.steps.length - 1];
    expect(finalStep.nodes[4].highlight).toBe('success');
    expect(finalStep.explanation).toContain('found at index 4');
  });

  // ── 5. Empty array ───────────────────────────────────────────────────────
  it('handles empty array safely', () => {
    const trace = generateBinarySearchTrace({ array: [], target: 5 });

    expect(isValidTrace(trace)).toBe(true);
    expect(trace.totalSteps).toBe(1);
    expect(trace.steps).toHaveLength(1);
    expect(trace.steps[0].nodes).toHaveLength(0);
    expect(trace.steps[0].explanation).toContain('Array is empty');
  });

  // ── 6. Single-element array ──────────────────────────────────────────────
  it('handles single-element array when target is found', () => {
    const trace = generateBinarySearchTrace({ array: [7], target: 7 });

    expect(isValidTrace(trace)).toBe(true);
    const finalStep = trace.steps[trace.steps.length - 1];
    expect(finalStep.nodes[0].highlight).toBe('success');
    expect(finalStep.nodes[0].value).toBe(7);
  });

  it('handles single-element array when target is missing', () => {
    const trace = generateBinarySearchTrace({ array: [7], target: 3 });

    expect(isValidTrace(trace)).toBe(true);
    const finalStep = trace.steps[trace.steps.length - 1];
    expect(finalStep.nodes[0].highlight).not.toBe('success');
    expect(finalStep.explanation).toContain('not found');
  });

  // ── 7. Repeated calls produce identical traces (determinism) ─────────────
  it('produces identical traces for identical inputs', () => {
    const trace1 = generateBinarySearchTrace(defaultInput);
    const trace2 = generateBinarySearchTrace(defaultInput);

    expect(trace1).toEqual(trace2);
    expect(JSON.stringify(trace1)).toBe(JSON.stringify(trace2));
  });

  // ── 8. Input array remains unchanged ─────────────────────────────────────
  it('does not mutate the supplied input array', () => {
    const inputArray = [1, 3, 5, 7, 9];
    const copy = [...inputArray];

    generateBinarySearchTrace({ array: inputArray, target: 5 });

    expect(inputArray).toEqual(copy);
  });

  // ── 9. Unsorted input is rejected ────────────────────────────────────────
  it('throws a clear error when the input array is not sorted', () => {
    expect(() =>
      generateBinarySearchTrace({ array: [5, 2, 9, 1], target: 9 })
    ).toThrow('Input array must be sorted in ascending order');

    expect(() =>
      generateBinarySearchTrace({ array: [1, 3, 2, 4], target: 2 })
    ).toThrow('Input array must be sorted in ascending order');
  });

  // ── 10. Invalid target and invalid array values are rejected ─────────────
  it('rejects invalid target values', () => {
    // @ts-expect-error Testing runtime invalid target
    expect(() => generateBinarySearchTrace({ array: [1, 2, 3], target: '9' })).toThrow(
      'Target must be a finite number'
    );
    expect(() =>
      generateBinarySearchTrace({ array: [1, 2, 3], target: NaN })
    ).toThrow('Target must be a finite number');
    expect(() =>
      generateBinarySearchTrace({ array: [1, 2, 3], target: Infinity })
    ).toThrow('Target must be a finite number');
  });

  it('rejects invalid array values and invalid structure', () => {
    // @ts-expect-error Testing runtime invalid structure
    expect(() => generateBinarySearchTrace(null)).toThrow('Input must be an object');
    // @ts-expect-error Testing runtime invalid array
    expect(() => generateBinarySearchTrace({ array: null, target: 5 })).toThrow(
      'Array must be an array of numbers'
    );
    // @ts-expect-error Testing runtime non-number array element
    expect(() => generateBinarySearchTrace({ array: [1, '3', 5], target: 3 })).toThrow(
      'finite numbers'
    );
    expect(() => generateBinarySearchTrace({ array: [1, NaN, 5], target: 3 })).toThrow(
      'finite numbers'
    );
  });

  // ── 11. TraceGenerator contract compliance ────────────────────────────────
  it('binarySearchGenerator complies with the TraceGenerator interface', () => {
    expect(binarySearchGenerator.id).toBe('binary-search');
    expect(binarySearchGenerator.title).toBe('Binary Search');
    expect(binarySearchGenerator.language).toBe('python');
    expect(binarySearchGenerator.track).toBe('dsa');
    expect(binarySearchGenerator.conceptTag).toBe('searching');
    expect(binarySearchGenerator.defaultInput).toEqual({
      array: [1, 3, 5, 7, 9, 11, 13],
      target: 9,
    });

    const trace = binarySearchGenerator.generate(binarySearchGenerator.defaultInput);
    expect(isValidTrace(trace)).toBe(true);
  });
});
