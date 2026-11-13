import { describe, it, expect } from 'vitest';
import { generateLinearSearchTrace } from '../linearSearchTrace.js';
import { validateTrace, isValidTrace } from '../../types/vep.js';

// ---------------------------------------------------------------------------
// Helper: assert full Zod validation passes on the returned trace
// ---------------------------------------------------------------------------
function expectValid(trace: ReturnType<typeof generateLinearSearchTrace>) {
  // validateTrace already ran inside the generator â€” call isValidTrace as an
  // independent double-check using the safeParse path.
  expect(isValidTrace(trace)).toBe(true);
}

// ---------------------------------------------------------------------------
// Helper: last step of a trace
// ---------------------------------------------------------------------------
function lastStep(trace: ReturnType<typeof generateLinearSearchTrace>) {
  return trace.steps[trace.steps.length - 1];
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('generateLinearSearchTrace', () => {
  // â”€â”€ 1. Target found at first position â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  it('finds target at index 0', () => {
    const trace = generateLinearSearchTrace({ array: [9, 2, 5, 1], target: 9 });

    expectValid(trace);
    expect(trace.title).toBe('Linear Search: find 9 in [9, 2, 5, 1]');
    expect(trace.totalSteps).toBe(trace.steps.length);

    // Step 0: initialization
    expect(trace.steps[0].conceptTag).toBe('initialization');
    expect(trace.steps[0].sourceLine).toBe(2);
    expect(trace.steps[0].nodes).toHaveLength(4);
    expect(trace.steps[0].nodes.every((n) => n.highlight === 'idle')).toBe(true);

    // Step 1: comparison at index 0 (match)
    const compareStep = trace.steps[1];
    expect(compareStep.conceptTag).toBe('comparison');
    expect(compareStep.sourceLine).toBe(3);
    expect(compareStep.nodes[0].highlight).toBe('comparing');

    // Second-to-last step: target-found
    const foundStep = trace.steps[trace.steps.length - 2];
    expect(foundStep.conceptTag).toBe('target-found');
    expect(foundStep.sourceLine).toBe(4);
    expect(foundStep.nodes[0].highlight).toBe('success');
    const foundVar = foundStep.variables.find((v) => v.name === 'found');
    expect(foundVar?.value).toBe(true);

    // Last step: completed
    const done = lastStep(trace);
    expect(done.conceptTag).toBe('completed');
    expect(done.sourceLine).toBe(4);
    const resultVar = done.variables.find((v) => v.name === 'resultIndex');
    expect(resultVar?.value).toBe(0);
  });

  // â”€â”€ 2. Target found in the middle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  it('finds target in the middle (reference fixture scenario)', () => {
    const trace = generateLinearSearchTrace({ array: [5, 2, 9, 1], target: 9 });

    expectValid(trace);

    // 1 init + 3 compare + 1 found + 1 completed = 6 steps
    expect(trace.steps).toHaveLength(6);
    expect(trace.totalSteps).toBe(6);

    // Index 0 and 1 must be visited by the time we reach index 2
    const compareAt2 = trace.steps[3]; // step index 3
    expect(compareAt2.nodes[0].highlight).toBe('visited');
    expect(compareAt2.nodes[1].highlight).toBe('visited');
    expect(compareAt2.nodes[2].highlight).toBe('comparing');
    expect(compareAt2.nodes[3].highlight).toBe('idle');

    // resultIndex in last step
    const done = lastStep(trace);
    expect(done.variables.find((v) => v.name === 'resultIndex')?.value).toBe(2);
  });

  // â”€â”€ 3. Target found at the last position â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  it('finds target at the last index', () => {
    const trace = generateLinearSearchTrace({ array: [1, 2, 3, 7], target: 7 });

    expectValid(trace);
    // 1 init + 4 compare + 1 found + 1 completed = 7 steps
    expect(trace.steps).toHaveLength(7);

    const done = lastStep(trace);
    expect(done.conceptTag).toBe('completed');
    expect(done.variables.find((v) => v.name === 'resultIndex')?.value).toBe(3);
    expect(done.nodes[3].highlight).toBe('success');
    expect(done.nodes.slice(0, 3).every((n) => n.highlight === 'visited')).toBe(true);
  });

  // â”€â”€ 4. Target not found â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  it('handles target not present in array', () => {
    const trace = generateLinearSearchTrace({ array: [1, 2, 3], target: 99 });

    expectValid(trace);
    // 1 init + 3 compare + 1 not-found completion = 5 steps
    expect(trace.steps).toHaveLength(5);

    expect(trace.steps[0].sourceLine).toBe(2);
    expect(trace.steps[1].sourceLine).toBe(3);
    expect(trace.steps[2].sourceLine).toBe(3);
    expect(trace.steps[3].sourceLine).toBe(3);

    const done = lastStep(trace);
    expect(done.conceptTag).toBe('completed');
    expect(done.sourceLine).toBe(7);
    expect(done.variables.find((v) => v.name === 'resultIndex')?.value).toBe(-1);
    expect(done.variables.find((v) => v.name === 'found')?.value).toBe(false);
    // i should hold the last index actually checked (n-1), not n
    expect(done.variables.find((v) => v.name === 'i')?.value).toBe(2);
    // All nodes visited
    expect(done.nodes.every((n) => n.highlight === 'visited')).toBe(true);
  });

  it('handles empty array', () => {
    const trace = generateLinearSearchTrace({ array: [], target: 5 });

    expectValid(trace);
    // 1 init + 1 completed = 2 steps
    expect(trace.steps).toHaveLength(2);
    expect(trace.steps[0].nodes).toHaveLength(0);
    expect(trace.steps[0].sourceLine).toBe(2);

    const done = lastStep(trace);
    expect(done.conceptTag).toBe('completed');
    expect(done.sourceLine).toBe(7);
    expect(done.variables.find((v) => v.name === 'resultIndex')?.value).toBe(-1);
  });

  it('stops at first occurrence when duplicates exist', () => {
    const trace = generateLinearSearchTrace({ array: [3, 7, 7, 7], target: 7 });

    expectValid(trace);
    // 1 init + 2 compare (index 0 miss, index 1 hit) + 1 found + 1 completed = 5 steps
    expect(trace.steps).toHaveLength(5);

    const done = lastStep(trace);
    // resultIndex must be 1, not 2 or 3
    expect(done.variables.find((v) => v.name === 'resultIndex')?.value).toBe(1);
    expect(done.sourceLine).toBe(4);

    // Nodes at index 2 and 3 should be idle in all steps (never visited/compared)
    for (const step of trace.steps) {
      if (step.nodes.length >= 4) {
        expect(step.nodes[2].highlight).not.toBe('comparing');
        expect(step.nodes[2].highlight).not.toBe('visited');
        expect(step.nodes[3].highlight).not.toBe('comparing');
        expect(step.nodes[3].highlight).not.toBe('visited');
      }
    }
  });

  it('all generated traces pass validateTrace independently', () => {
    const cases: Array<{ array: number[]; target: number }> = [
      { array: [9], target: 9 },
      { array: [1, 2, 3, 4, 5], target: 3 },
      { array: [1, 2, 3, 4, 5], target: 6 },
      { array: [], target: 0 },
      { array: [5, 5, 5], target: 5 },
    ];

    for (const input of cases) {
      const trace = generateLinearSearchTrace(input);
      // Should not throw
      expect(() => validateTrace(trace)).not.toThrow();
      // Sequential step indices
      trace.steps.forEach((step, idx) => {
        expect(step.step).toBe(idx);
        expect(typeof step.sourceLine).toBe('number');
        expect(step.sourceLine).toBeGreaterThan(0);
      });
      // totalSteps === actual steps
      expect(trace.totalSteps).toBe(trace.steps.length);
    }
  });

  it('includes canonical source code and valid sourceLine on every step', () => {
    const trace = generateLinearSearchTrace({ array: [10, 20, 30], target: 20 });

    expect(trace.language).toBe('javascript');
    expect(trace.code).toBeDefined();
    expect(typeof trace.code).toBe('string');
    expect(trace.code).toContain('function linearSearch(arr, target)');

    const lines = trace.code!.split('\n');
    expect(lines.length).toBe(8);

    // Verify every step's sourceLine points to a valid 1-based line in trace.code
    trace.steps.forEach((step) => {
      expect(step.sourceLine).toBeDefined();
      expect(step.sourceLine).toBeGreaterThanOrEqual(1);
      expect(step.sourceLine).toBeLessThanOrEqual(lines.length);
    });

    // Step 0: loop initialization (Line 2)
    expect(trace.steps[0].sourceLine).toBe(2);
    // Step 1: compare array[0] (Line 3)
    expect(trace.steps[1].sourceLine).toBe(3);
    // Step 2: compare array[1] (Line 3)
    expect(trace.steps[2].sourceLine).toBe(3);
    // Step 3: found match (Line 4: return i;)
    expect(trace.steps[3].sourceLine).toBe(4);
    // Step 4: completed (Line 4)
    expect(trace.steps[4].sourceLine).toBe(4);
  });
});
