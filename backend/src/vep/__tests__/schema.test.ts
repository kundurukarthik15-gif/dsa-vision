import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

import {
  TraceSchema,
  validateTrace,
  isValidTrace,
} from "../schema.js";

// Load JSON fixtures
const arrayFixture = JSON.parse(
  readFileSync(
    new URL("../fixtures/array-linear-search.json", import.meta.url),
    "utf-8"
  )
);

const linkedListFixture = JSON.parse(
  readFileSync(
    new URL("../fixtures/linked-list-traversal.json", import.meta.url),
    "utf-8"
  )
);

describe("VEP Schema Validation", () => {
  it("should successfully parse the array linear search fixture", () => {
    const result = validateTrace(arrayFixture);

    expect(result.id).toBe("array-linear-search");
    expect(result.steps).toHaveLength(6);
  });

  it("should successfully parse the linked list traversal fixture", () => {
    const result = validateTrace(linkedListFixture);

    expect(result.id).toBe("linked-list-traversal");
    expect(result.steps).toHaveLength(6);
  });

  it("should identify both fixtures as valid traces", () => {
    expect(isValidTrace(arrayFixture)).toBe(true);
    expect(isValidTrace(linkedListFixture)).toBe(true);
  });

  it("should reject an invalid trace object", () => {
    expect(isValidTrace({ id: "bad", title: 123 })).toBe(false);
  });

  it("should reject traces with missing explanations or zero steps", () => {
    const missingExplanation = structuredClone(arrayFixture);
    delete missingExplanation.steps[0].explanation;

    const zeroSteps = {
      ...arrayFixture,
      totalSteps: 0,
      steps: [],
    };

    expect(() => TraceSchema.parse(missingExplanation)).toThrow();
    expect(() => TraceSchema.parse(zeroSteps)).toThrow();
  });

  it("should reject traces where totalSteps does not match steps.length", () => {
    const mismatchedTotalSteps = {
      ...arrayFixture,
      totalSteps: 10,
    };

    expect(isValidTrace(mismatchedTotalSteps)).toBe(false);
    expect(() => TraceSchema.parse(mismatchedTotalSteps)).toThrow(
      /totalSteps must match the number of steps/
    );
  });

  it("should reject traces with non-sequential step numbers", () => {
    // Case 1: First step does not start at 0
    const nonZeroStart = structuredClone(arrayFixture);
    nonZeroStart.steps[0].step = 1;

    expect(isValidTrace(nonZeroStart)).toBe(false);
    expect(() => TraceSchema.parse(nonZeroStart)).toThrow(
      /Step indices must be sequential and match their zero-based array position/
    );

    // Case 2: Skipped step index (e.g. [0, 2, 2, 3, 4, 5])
    const skippedStep = structuredClone(arrayFixture);
    skippedStep.steps[1].step = 2;

    expect(isValidTrace(skippedStep)).toBe(false);
    expect(() => TraceSchema.parse(skippedStep)).toThrow(
      /Step indices must be sequential and match their zero-based array position/
    );
  });

  it("should reject duplicate node IDs within the same step", () => {
    const duplicateNodeTrace = structuredClone(arrayFixture);
    duplicateNodeTrace.steps[0].nodes.push({
      id: "0", // "0" already exists in step 0
      kind: "array-cell",
      label: "Duplicate Index 0",
      value: 99,
      position: { x: 999, y: 999 },
    });

    expect(isValidTrace(duplicateNodeTrace)).toBe(false);
    expect(() => TraceSchema.parse(duplicateNodeTrace)).toThrow(
      /Node IDs must be unique within a step/
    );
  });

  it("should reject duplicate edge IDs within the same step", () => {
    const duplicateEdgeTrace = structuredClone(linkedListFixture);
    duplicateEdgeTrace.steps[0].edges.push({
      id: "edge-A-B", // "edge-A-B" already exists in step 0
      from: "A",
      to: "B",
    });

    expect(isValidTrace(duplicateEdgeTrace)).toBe(false);
    expect(() => TraceSchema.parse(duplicateEdgeTrace)).toThrow(
      /Edge IDs must be unique within a step/
    );
  });

  it("should reject an edge referencing a nonexistent source or destination node", () => {
    // Nonexistent source node
    const badSourceEdge = structuredClone(linkedListFixture);
    badSourceEdge.steps[0].edges[0].from = "NONEXISTENT_NODE";

    expect(isValidTrace(badSourceEdge)).toBe(false);
    expect(() => TraceSchema.parse(badSourceEdge)).toThrow(
      /Edge source and destination must reference existing node IDs in the same step/
    );

    // Nonexistent destination node
    const badDestEdge = structuredClone(linkedListFixture);
    badDestEdge.steps[0].edges[0].to = "NONEXISTENT_NODE";

    expect(isValidTrace(badDestEdge)).toBe(false);
    expect(() => TraceSchema.parse(badDestEdge)).toThrow(
      /Edge source and destination must reference existing node IDs in the same step/
    );
  });

  it("should reject a variable referencing a nonexistent node", () => {
    const badVarRef = structuredClone(linkedListFixture);
    badVarRef.steps[0].variables[0].referencesNodeId = "NONEXISTENT_NODE";

    expect(isValidTrace(badVarRef)).toBe(false);
    expect(() => TraceSchema.parse(badVarRef)).toThrow(
      /Variable referencesNodeId must reference an existing node ID in the same step/
    );
  });

  it("should accept valid variable references and edge references", () => {
    const validRefTrace = structuredClone(linkedListFixture);
    validRefTrace.steps[0].variables[0].referencesNodeId = "A";

    expect(isValidTrace(validRefTrace)).toBe(true);
    const parsed = TraceSchema.parse(validRefTrace);
    expect(parsed.steps[0].variables[0].referencesNodeId).toBe("A");
  });

  it("should validate optional sourceLine metadata on steps and code on trace", () => {
    const traceWithCode = structuredClone(arrayFixture);
    traceWithCode.code = "function test() {}";
    traceWithCode.steps[0].sourceLine = 2;
    traceWithCode.steps[1].sourceLine = 3;

    expect(isValidTrace(traceWithCode)).toBe(true);
    const parsed = validateTrace(traceWithCode);
    expect(parsed.code).toBe("function test() {}");
    expect(parsed.steps[0].sourceLine).toBe(2);
    expect(parsed.steps[1].sourceLine).toBe(3);
    // Backward compatibility: step without sourceLine is still valid
    expect(parsed.steps[2].sourceLine).toBeUndefined();
  });

  it("should reject invalid sourceLine values", () => {
    const zeroLineTrace = structuredClone(arrayFixture);
    (zeroLineTrace.steps[0] as Record<string, unknown>).sourceLine = 0;
    expect(() => TraceSchema.parse(zeroLineTrace)).toThrow();

    const negativeLineTrace = structuredClone(arrayFixture);
    (negativeLineTrace.steps[0] as Record<string, unknown>).sourceLine = -5;
    expect(() => TraceSchema.parse(negativeLineTrace)).toThrow();

    const floatLineTrace = structuredClone(arrayFixture);
    (floatLineTrace.steps[0] as Record<string, unknown>).sourceLine = 2.5;
    expect(() => TraceSchema.parse(floatLineTrace)).toThrow();
  });

  it("should validate all supported LanguageEnum values including javascript", () => {
    const languages = ["c", "cpp", "java", "python", "javascript", "typescript", "backend"] as const;
    for (const lang of languages) {
      const trace = structuredClone(arrayFixture);
      trace.language = lang;
      expect(isValidTrace(trace)).toBe(true);
      expect(validateTrace(trace).language).toBe(lang);
    }

    const invalidLangTrace = structuredClone(arrayFixture);
    (invalidLangTrace as Record<string, unknown>).language = "ruby";
    expect(isValidTrace(invalidLangTrace)).toBe(false);
  });
});
