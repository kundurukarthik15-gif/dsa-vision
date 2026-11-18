import express, { Request, Response } from "express";
import cors from "cors";
import { z } from "zod";
import {
  getTrace,
  getTraceEntries,
  generateLinearSearchTrace,
  validateTrace,
} from "../../shared/index.js";

export interface AppDependencies {
  getTrace: typeof getTrace;
  getTraceEntries: typeof getTraceEntries;
  generateLinearSearchTrace: typeof generateLinearSearchTrace;
  validateTrace: typeof validateTrace;
}

const CustomLinearSearchRequestSchema = z
  .object({
    values: z.array(z.number().int()).optional(),
    array: z.array(z.number().int()).optional(),
    target: z.number().int(),
  })
  .refine((data) => data.values !== undefined || data.array !== undefined, {
    message: "Request body must include 'values' or 'array' as an array of integers.",
  });

export function createApp(customDeps: Partial<AppDependencies> = {}) {
  const deps: AppDependencies = {
    getTrace,
    getTraceEntries,
    generateLinearSearchTrace,
    validateTrace,
    ...customDeps,
  };
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.get("/api/traces", (_req: Request, res: Response) => {
    try {
      const entries = deps.getTraceEntries();
      const traces = entries.map(({ id, label, group }) => ({
        id,
        label,
        group,
      }));
      res.status(200).json({ traces });
    } catch (error) {
      console.error("Failed to retrieve algorithm traces:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to retrieve algorithm traces.",
      });
    }
  });

  // POST endpoint for custom trace generation
  app.post("/api/traces/:id/generate", (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (id !== "array-linear-search" && id !== "linear-search") {
      return res.status(404).json({
        error: "Not Found",
        message: `Algorithm "${id}" does not support custom generation.`,
      });
    }

    const parseResult = CustomLinearSearchRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Bad Request",
        message:
          "Invalid input: 'values' must be an array of integers and 'target' must be an integer.",
        details: parseResult.error.flatten(),
      });
    }

    const { target } = parseResult.data;
    const array = (parseResult.data.values ?? parseResult.data.array)!;

    try {
      const trace = deps.generateLinearSearchTrace({ array, target });
      const validated = deps.validateTrace(trace);
      return res.status(200).json({ trace: validated });
    } catch (error) {
      console.error(`Failed to generate custom trace for "${id}":`, error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to generate custom trace.",
      });
    }
  });

  app.get("/api/traces/:id", (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        error: "Bad Request",
        message: "Invalid or missing trace ID.",
      });
    }

    try {
      const trace = deps.getTrace(id);
      res.status(200).json({ trace });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Unknown algorithm ID")) {
        return res.status(404).json({
          error: "Not Found",
          message: `Algorithm trace with id "${id}" was not found.`,
        });
      }

      console.error(`Internal error processing algorithm trace "${id}":`, error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to load algorithm trace.",
      });
    }
  });

  return app;
}

export const app = createApp();
