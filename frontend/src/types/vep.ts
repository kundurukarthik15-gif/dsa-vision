import { z } from "zod";

// 1. Enums

export const NodeKindEnum = z.enum([
  "array-cell",
  "linked-list-node",
  "tree-node",
  "graph-node",
  "stack-frame",
  "heap-object",
  "variable-box",
  "pointer",
  "server",
  "middleware",
  "router",
  "handler",
  "database",
  "client",
  "load-balancer",
]);

export const HighlightStateEnum = z.enum([
  "idle",
  "active",
  "visited",
  "comparing",
  "swapped",
  "selected",
  "inserted",
  "removed",
  "error",
  "success",
]);

export const LanguageEnum = z.enum([
  "c",
  "cpp",
  "java",
  "python",
  "typescript",
  "backend",
]);

export const TrackEnum = z.enum([
  "dsa",
  "python",
  "java",
  "backend",
]);

// 2. Position schema

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
}).strict();

// 3. Node schema

export const NodeSchema = z.object({
  id: z.string(),
  kind: NodeKindEnum,
  label: z.string().optional(),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
  ]).optional(),
  position: PositionSchema,
  highlight: HighlightStateEnum.default("idle"),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict();

// 4. Edge schema

export const EdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  directed: z.boolean().default(true),
  highlight: HighlightStateEnum.default("idle"),
}).strict();

// 5. Variable schema

export const VariableSchema = z.object({
  name: z.string(),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
  ]),
  type: z.string().optional(),
  scope: z.string().optional(),
  referencesNodeId: z.string().optional(),
}).strict();

// 6. Step schema

export const StepSchema = z.object({
  step: z.number().int().nonnegative(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema).default([]),
  variables: z.array(VariableSchema).default([]),
  explanation: z.string(),
  conceptTag: z.string().optional(),
}).strict()
  .refine(
    (step) => {
      const nodeIds = new Set<string>();
      for (const node of step.nodes) {
        if (nodeIds.has(node.id)) return false;
        nodeIds.add(node.id);
      }
      return true;
    },
    {
      message: "Node IDs must be unique within a step",
      path: ["nodes"],
    }
  )
  .refine(
    (step) => {
      const edgeIds = new Set<string>();
      for (const edge of step.edges) {
        if (edgeIds.has(edge.id)) return false;
        edgeIds.add(edge.id);
      }
      return true;
    },
    {
      message: "Edge IDs must be unique within a step",
      path: ["edges"],
    }
  )
  .refine(
    (step) => {
      const nodeIds = new Set(step.nodes.map((n) => n.id));
      return step.edges.every((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to));
    },
    {
      message: "Edge source and destination must reference existing node IDs in the same step",
      path: ["edges"],
    }
  )
  .refine(
    (step) => {
      const nodeIds = new Set(step.nodes.map((n) => n.id));
      return step.variables.every(
        (variable) =>
          variable.referencesNodeId === undefined ||
          nodeIds.has(variable.referencesNodeId)
      );
    },
    {
      message: "Variable referencesNodeId must reference an existing node ID in the same step",
      path: ["variables"],
    }
  );

// 7. Trace schema

export const TraceSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  language: LanguageEnum,
  track: TrackEnum,
  algorithm: z.string(),
  input: z.unknown().optional(),
  totalSteps: z.number().int().positive(),
  steps: z.array(StepSchema).min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict()
  .refine((data) => data.totalSteps === data.steps.length, {
    message: "totalSteps must match the number of steps",
    path: ["totalSteps"],
  })
  .refine(
    (data) => data.steps.every((step, index) => step.step === index),
    {
      message: "Step indices must be sequential and match their zero-based array position",
      path: ["steps"],
    }
  );

// 8. Inferred TypeScript types

export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type Variable = z.infer<typeof VariableSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Trace = z.infer<typeof TraceSchema>;

// 9. Validation helpers

export function validateTrace(data: unknown): Trace {
  return TraceSchema.parse(data);
}

export function isValidTrace(data: unknown): boolean {
  return TraceSchema.safeParse(data).success;
}

