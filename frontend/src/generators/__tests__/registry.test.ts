import { describe, it, expect, vi } from 'vitest';
import {
  traceRegistry,
  registryEntries,
  getTrace,
  getTraceEntries,
} from '../registry.js';
import { isValidTrace } from '../../types/vep.js';

describe('Trace Registry', () => {
  it('registers all four required algorithms', () => {
    expect(traceRegistry['linear-search']).toBeDefined();
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

  it('loads Linear Search trace via getTrace', () => {
    const trace = getTrace('linear-search');

    expect(isValidTrace(trace)).toBe(true);
    expect(trace.algorithm).toBe('linear-search');
    expect(trace.steps.length).toBeGreaterThan(0);
  });

  it('loads Bubble Sort trace via getTrace', () => {
    const trace = getTrace('bubble-sort');

    expect(isValidTrace(trace)).toBe(true);
    expect(trace.id).toBe('bubble-sort');
    expect(trace.algorithm).toBe('bubble-sort');
    expect(trace.language).toBe('python');
    expect(trace.steps.length).toBeGreaterThan(0);
  });

  it('loads Binary Search trace via getTrace', () => {
    const trace = getTrace('binary-search');

    expect(isValidTrace(trace)).toBe(true);
    expect(trace.id).toBe('binary-search');
    expect(trace.algorithm).toBe('binary-search');
    expect(trace.language).toBe('python');
    expect(trace.steps.length).toBeGreaterThan(0);
  });

  it('loads Linked List Traversal trace via getTrace using exact fixture ID', () => {
    const trace = getTrace('linked-list-traversal');

    expect(isValidTrace(trace)).toBe(true);
    expect(trace.id).toBe('linked-list-traversal');
    expect(trace.algorithm).toBe('linked-list-traversal');
    expect(trace.language).toBe('python');
    expect(trace.steps).toHaveLength(6);
  });

  it('throws a clear error for an unknown algorithm ID', () => {
    expect(() => getTrace('non-existent-algo')).toThrow(
      'Unknown algorithm ID "non-existent-algo"'
    );
  });

  it('reports ID mismatch via console.warn and preserves actual trace ID when fixture/generator ID differs', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // 'linear-search' registry entry loads a trace with id 'array-linear-search'
    const trace = getTrace('linear-search');

    expect(trace.id).toBe('array-linear-search');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
