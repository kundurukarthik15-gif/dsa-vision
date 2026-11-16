import { validateTrace, type Trace } from '../types/vep';

/**
 * Generic interface for algorithmic trace generators in DSA Vision.
 */
export interface TraceGenerator<TInput = unknown> {
  id: string;
  title: string;
  description: string;
  language: Trace['language'];
  track: Trace['track'];
  defaultInput: TInput;
  generate(input: TInput): Trace;
}

/**
 * Asserts that a trace conforms to the VEP Trace schema.
 * Uses the existing `validateTrace` helper from `../types/vep`.
 * If validation fails, throws an Error with useful validation details.
 */
export function assertValidTrace(trace: Trace): void {
  try {
    validateTrace(trace);
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`Trace validation failed for "${trace?.id ?? 'unknown'}": ${details}`);
  }
}
