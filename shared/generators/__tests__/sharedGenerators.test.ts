import { describe, it, expect } from 'vitest';
import {
  traceRegistry,
  registryEntries,
  getTraceEntries,
  getTrace,
} from '../registry.js';
import {
  generateLinearSearchTrace,
  linearSearchGenerator,
} from '../linearSearch.js';
import {
  generateBubbleSortTrace,
  bubbleSortGenerator,
} from '../bubbleSort.js';
import {
  generateBinarySearchTrace,
  binarySearchGenerator,
} from '../binarySearch.js';
import { isValidTrace, validateTrace } from '../../vep.js';

describe('Shared Registry & Generators', () => {
  // -------------------------------------------------------------------------
  // 1. Registry verification
  // -------------------------------------------------------------------------
  describe('Registry Registration & Metadata', () => {
    it('registers all four required algorithms', () => {
      expect(traceRegistry['array-linear-search']).toBeDefined();
      expect(traceRegistry['bubble-sort']).toBeDefined();
      expect(traceRegistry['binary-search']).toBeDefined();
      expect(traceRegistry['linked-list-traversal']).toBeDefined();

      expect(registryEntries).toHaveLength(4);
      expect(getTraceEntries()).toHaveLength(4);
    });

    it('all registry entries have id, label, group, and load function', () => {
      for (const entry of registryEntries) {
        expect(entry.id).toBeDefined();
        expect(typeof entry.id).toBe('string');
        expect(entry.label).toBeDefined();
        expect(typeof entry.label).toBe('string');
        expect(entry.group).toBe('dsa');
        expect(typeof entry.load).toBe('function');
      }
    });

    it('every registered algorithm produces a valid trace', () => {
      for (const entry of registryEntries) {
        const trace = entry.load();
        expect(isValidTrace(trace)).toBe(true);
        expect(trace.steps.length).toBeGreaterThan(0);
      }
    });

    it('each trace ID matches its registry entry ID', () => {
      for (const entry of registryEntries) {
        const trace = entry.load();
        expect(trace.id).toBe(entry.id);
      }

      // Explicit check for all 4 algorithm IDs
      expect(traceRegistry['array-linear-search'].load().id).toBe('array-linear-search');
      expect(traceRegistry['bubble-sort'].load().id).toBe('bubble-sort');
      expect(traceRegistry['binary-search'].load().id).toBe('binary-search');
      expect(traceRegistry['linked-list-traversal'].load().id).toBe('linked-list-traversal');
    });

    it('preserves backward compatibility for legacy frontend algorithm ID "linear-search"', () => {
      // 1. traceRegistry['linear-search'] accessor
      expect(traceRegistry['linear-search']).toBeDefined();
      expect(traceRegistry['linear-search'].id).toBe('array-linear-search');

      // 2. getTrace('linear-search') lookup
      const trace = getTrace('linear-search');
      expect(trace).toBeDefined();
      expect(trace.id).toBe('array-linear-search');
      expect(trace.algorithm).toBe('linear-search');
      expect(isValidTrace(trace)).toBe(true);
    });

    it('unknown algorithm IDs produce a clear error', () => {
      expect(() => getTrace('non-existent-algo')).toThrow(
        /Unknown algorithm ID "non-existent-algo"/
      );
      expect(() => getTrace('')).toThrow(/Unknown algorithm ID ""/);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Linear Search generator tests
  // -------------------------------------------------------------------------
  describe('Linear Search Generator', () => {
    it('finds target in array and marks result correctly', () => {
      const trace = generateLinearSearchTrace({ array: [5, 2, 9, 1], target: 9 });
      expect(isValidTrace(trace)).toBe(true);
      expect(trace.id).toBe('array-linear-search');

      // Check success step
      const successStep = trace.steps.find((s) =>
        s.nodes.some((n) => n.highlight === 'success')
      );
      expect(successStep).toBeDefined();

      // Check final completed step
      const finalStep = trace.steps[trace.steps.length - 1];
      const resultVar = finalStep.variables.find((v) => v.name === 'resultIndex');
      const foundVar = finalStep.variables.find((v) => v.name === 'found');
      expect(resultVar?.value).toBe(2);
      expect(foundVar?.value).toBe(true);
    });

    it('handles missing target when target is absent', () => {
      const trace = generateLinearSearchTrace({ array: [5, 2, 9, 1], target: 99 });
      expect(isValidTrace(trace)).toBe(true);
      expect(trace.id).toBe('array-linear-search');

      // No node should ever have success highlight
      const hasSuccess = trace.steps.some((s) =>
        s.nodes.some((n) => n.highlight === 'success')
      );
      expect(hasSuccess).toBe(false);

      // Check final step
      const finalStep = trace.steps[trace.steps.length - 1];
      const resultVar = finalStep.variables.find((v) => v.name === 'resultIndex');
      const foundVar = finalStep.variables.find((v) => v.name === 'found');
      expect(resultVar?.value).toBe(-1);
      expect(foundVar?.value).toBe(false);
    });

    it('handles empty array gracefully', () => {
      const trace = generateLinearSearchTrace({ array: [], target: 5 });
      expect(isValidTrace(trace)).toBe(true);
      expect(trace.steps).toHaveLength(2);
      const finalStep = trace.steps[1];
      const resultVar = finalStep.variables.find((v) => v.name === 'resultIndex');
      expect(resultVar?.value).toBe(-1);
    });

    it('linearSearchGenerator contract matches expected schema', () => {
      expect(linearSearchGenerator.id).toBe('array-linear-search');
      expect(linearSearchGenerator.title).toBe('Linear Search');
      expect(linearSearchGenerator.language).toBe('javascript');
      expect(linearSearchGenerator.track).toBe('dsa');
      const trace = linearSearchGenerator.generate(linearSearchGenerator.defaultInput);
      expect(trace.id).toBe('array-linear-search');
      expect(isValidTrace(trace)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Bubble Sort generator tests
  // -------------------------------------------------------------------------
  describe('Bubble Sort Generator', () => {
    it('produces sorted output from unsorted input', () => {
      const input = [5, 2, 9, 1, 3];
      const trace = generateBubbleSortTrace(input);
      expect(isValidTrace(trace)).toBe(true);
      expect(trace.id).toBe('bubble-sort');

      // Final step checks
      const finalStep = trace.steps[trace.steps.length - 1];
      const finalValues = finalStep.nodes.map((n) => n.value);
      expect(finalValues).toEqual([1, 2, 3, 5, 9]);

      // All nodes in the final step should be highlighted with success
      expect(finalStep.nodes.every((n) => n.highlight === 'success')).toBe(true);
    });

    it('handles already sorted array with early exit', () => {
      const input = [1, 2, 3, 4, 5];
      const trace = generateBubbleSortTrace(input);
      expect(isValidTrace(trace)).toBe(true);

      const finalStep = trace.steps[trace.steps.length - 1];
      expect(finalStep.nodes.map((n) => n.value)).toEqual([1, 2, 3, 4, 5]);
      expect(finalStep.nodes.every((n) => n.highlight === 'success')).toBe(true);
    });

    it('handles single element array', () => {
      const trace = generateBubbleSortTrace([42]);
      expect(isValidTrace(trace)).toBe(true);
      expect(trace.steps).toHaveLength(1);
      expect(trace.steps[0].nodes[0].highlight).toBe('success');
    });

    it('handles empty array', () => {
      const trace = generateBubbleSortTrace([]);
      expect(isValidTrace(trace)).toBe(true);
      expect(trace.steps).toHaveLength(1);
      expect(trace.steps[0].nodes).toHaveLength(0);
    });

    it('bubbleSortGenerator contract matches expected schema', () => {
      expect(bubbleSortGenerator.id).toBe('bubble-sort');
      expect(bubbleSortGenerator.title).toBe('Bubble Sort');
      expect(bubbleSortGenerator.language).toBe('python');
      expect(bubbleSortGenerator.track).toBe('dsa');
      const trace = bubbleSortGenerator.generate(bubbleSortGenerator.defaultInput);
      expect(trace.id).toBe('bubble-sort');
      expect(isValidTrace(trace)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Binary Search generator tests
  // -------------------------------------------------------------------------
  describe('Binary Search Generator', () => {
    it('finds target in sorted array', () => {
      const input = { array: [1, 3, 5, 7, 9, 11, 13], target: 9 };
      const trace = generateBinarySearchTrace(input);
      expect(isValidTrace(trace)).toBe(true);
      expect(trace.id).toBe('binary-search');

      // Final step has success highlight on index 4
      const finalStep = trace.steps[trace.steps.length - 1];
      const targetNode = finalStep.nodes[4];
      expect(targetNode.value).toBe(9);
      expect(targetNode.highlight).toBe('success');
      expect(finalStep.explanation).toContain('found at index 4');
    });

    it('handles missing target in sorted array', () => {
      const input = { array: [1, 3, 5, 7, 9, 11, 13], target: 4 };
      const trace = generateBinarySearchTrace(input);
      expect(isValidTrace(trace)).toBe(true);
      expect(trace.id).toBe('binary-search');

      // No node should have success highlight
      const hasSuccess = trace.steps.some((s) =>
        s.nodes.some((n) => n.highlight === 'success')
      );
      expect(hasSuccess).toBe(false);

      const finalStep = trace.steps[trace.steps.length - 1];
      expect(finalStep.explanation).toContain('was not found');
    });

    it('handles empty array', () => {
      const trace = generateBinarySearchTrace({ array: [], target: 7 });
      expect(isValidTrace(trace)).toBe(true);
      expect(trace.steps).toHaveLength(1);
      expect(trace.steps[0].explanation).toContain('was not found');
    });

    it('throws error when array is not sorted in ascending order', () => {
      expect(() =>
        generateBinarySearchTrace({ array: [5, 2, 9], target: 2 })
      ).toThrow(/must be sorted in ascending order/);
    });

    it('binarySearchGenerator contract matches expected schema', () => {
      expect(binarySearchGenerator.id).toBe('binary-search');
      expect(binarySearchGenerator.title).toBe('Binary Search');
      expect(binarySearchGenerator.language).toBe('python');
      expect(binarySearchGenerator.track).toBe('dsa');
      const trace = binarySearchGenerator.generate(binarySearchGenerator.defaultInput);
      expect(trace.id).toBe('binary-search');
      expect(isValidTrace(trace)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Linked List Traversal fixture tests
  // -------------------------------------------------------------------------
  describe('Linked List Traversal Fixture', () => {
    it('loads and validates the shared JSON fixture via getTrace', () => {
      const trace = getTrace('linked-list-traversal');
      expect(trace).toBeDefined();
      expect(trace.id).toBe('linked-list-traversal');
      expect(isValidTrace(trace)).toBe(true);
      expect(trace.steps.length).toBeGreaterThan(0);
      expect(trace.steps[0].nodes.length).toBeGreaterThan(0);
    });
  });
});
