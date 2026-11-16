import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateTrace, isValidTrace } from '../../types/vep.js';

const linkedListFixture = JSON.parse(
  readFileSync(
    new URL('../../fixtures/linked-list-traversal.json', import.meta.url),
    'utf-8'
  )
);

describe('Linked List Traversal Fixture & Source-Line Synchronization', () => {
  it('passes VEP schema validation with Python language metadata', () => {
    expect(isValidTrace(linkedListFixture)).toBe(true);
    const trace = validateTrace(linkedListFixture);

    expect(trace.id).toBe('linked-list-traversal');
    expect(trace.language).toBe('python');
    expect(trace.track).toBe('dsa');
    expect(trace.algorithm).toBe('linked-list-traversal');
    expect(trace.totalSteps).toBe(6);
    expect(trace.steps).toHaveLength(6);
  });

  it('contains top-level Python source code', () => {
    expect(linkedListFixture.code).toBeDefined();
    expect(typeof linkedListFixture.code).toBe('string');
    expect(linkedListFixture.code).toContain('def traverse(head):');
    expect(linkedListFixture.code).toContain('current = head');
    expect(linkedListFixture.code).toContain('while current is not None:');
    expect(linkedListFixture.code).toContain('print(current.value)');
    expect(linkedListFixture.code).toContain('current = current.next');
    expect(linkedListFixture.code).toContain('return position');
  });

  it('maps sourceLine to all six steps accurately according to specifications', () => {
    const trace = validateTrace(linkedListFixture);

    // Step 0: line 2 (initialize current)
    expect(trace.steps[0].sourceLine).toBe(2);
    expect(trace.steps[0].conceptTag).toBe('initialization');

    // Step 1: line 6 (visit and print the first node)
    expect(trace.steps[1].sourceLine).toBe(6);
    expect(trace.steps[1].conceptTag).toBe('traversal');

    // Steps 2, 3, 4: line 6 (visit and print the current node)
    expect(trace.steps[2].sourceLine).toBe(6);
    expect(trace.steps[2].conceptTag).toBe('traversal');

    expect(trace.steps[3].sourceLine).toBe(6);
    expect(trace.steps[3].conceptTag).toBe('traversal');

    expect(trace.steps[4].sourceLine).toBe(6);
    expect(trace.steps[4].conceptTag).toBe('traversal');

    // Step 5: line 5 (while condition evaluates to false when current is null)
    expect(trace.steps[5].sourceLine).toBe(5);
    expect(trace.steps[5].conceptTag).toBe('completed');
  });

  it('preserves existing linked list nodes, edges, variables and explanations', () => {
    const trace = validateTrace(linkedListFixture);

    // All steps have 4 nodes
    trace.steps.forEach((step) => {
      expect(step.nodes).toHaveLength(4);
      expect(step.nodes.map((n) => n.id)).toEqual(['A', 'B', 'C', 'D']);
      expect(step.edges).toHaveLength(3);
    });

    // Step 0: node A active? idle, current -> A
    expect(trace.steps[0].nodes[0].highlight).toBe('idle');
    expect(trace.steps[0].variables[0]).toEqual({
      name: 'current',
      value: 'A',
      type: 'pointer',
      referencesNodeId: 'A',
    });

    // Step 1: node A active
    expect(trace.steps[1].nodes[0].highlight).toBe('active');

    // Step 5: all nodes visited, current is null
    expect(trace.steps[5].nodes.every((n) => n.highlight === 'visited')).toBe(true);
    expect(trace.steps[5].variables[0]).toEqual({
      name: 'current',
      value: null,
      type: 'pointer',
    });
  });
});
