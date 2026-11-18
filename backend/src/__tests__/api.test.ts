import { describe, it, expect } from "vitest";
import http from "node:http";
import { Socket } from "node:net";
import type { Express } from "express";
import { app, createApp } from "../app.js";
import { isValidTrace, type Trace } from "../../../shared/vep.js";

interface TestResponse<T = any> {
  status: number;
  headers: http.OutgoingHttpHeaders;
  body: T;
}

function request<T = any>(
  targetApp: Express,
  method: string,
  url: string,
  body?: unknown
): Promise<TestResponse<T>> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    const req = new http.IncomingMessage(socket);
    req.method = method;
    req.url = url;
    req.headers = { host: "localhost" };

    const res = new http.ServerResponse(req);
    let resBody = "";

    res.write = function (chunk: any) {
      if (chunk) resBody += chunk.toString();
      return true;
    };

    res.end = function (chunk?: any) {
      if (chunk) resBody += chunk.toString();
      let parsed = resBody as any;
      try {
        parsed = JSON.parse(resBody);
      } catch {
        // Keep string
      }
      resolve({
        status: res.statusCode,
        headers: res.getHeaders(),
        body: parsed,
      });
      return this;
    };

    if (body) {
      const payload = JSON.stringify(body);
      req.headers["content-type"] = "application/json";
      req.headers["content-length"] = String(Buffer.byteLength(payload));
      req.push(payload);
    }
    req.push(null);

    targetApp.handle(req, res, (err: unknown) => {
      if (err) reject(err);
    });
  });
}

describe("Backend API Endpoints", () => {
  it("GET /health returns HTTP 200 with status ok", async () => {
    const res = await request<{ status: string }>(app, "GET", "/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/traces returns four registered algorithm entries", async () => {
    const res = await request<{
      traces: Array<{ id: string; label: string; group: string }>;
    }>(app, "GET", "/api/traces");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.traces)).toBe(true);
    expect(res.body.traces).toHaveLength(4);

    const ids = res.body.traces.map((t) => t.id);
    expect(ids).toContain("array-linear-search");
    expect(ids).toContain("bubble-sort");
    expect(ids).toContain("binary-search");
    expect(ids).toContain("linked-list-traversal");

    for (const item of res.body.traces) {
      expect(typeof item.id).toBe("string");
      expect(typeof item.label).toBe("string");
      expect(typeof item.group).toBe("string");
    }
  });

  it("every listed ID in /api/traces can be fetched and passes shared validation", async () => {
    const listRes = await request<{
      traces: Array<{ id: string; label: string }>;
    }>(app, "GET", "/api/traces");

    for (const { id } of listRes.body.traces) {
      const res = await request<{ trace: Trace }>(app, "GET", `/api/traces/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.trace).toBeDefined();
      expect(res.body.trace.id).toBe(id);
      expect(isValidTrace(res.body.trace)).toBe(true);
    }
  });

  it("GET /api/traces/:id supports the canonical Linear Search ID", async () => {
    const res = await request<{ trace: Trace }>(
      app,
      "GET",
      "/api/traces/array-linear-search"
    );
    expect(res.status).toBe(200);
    expect(res.body.trace.id).toBe("array-linear-search");
    expect(res.body.trace.algorithm).toBe("linear-search");
    expect(isValidTrace(res.body.trace)).toBe(true);
  });

  it("GET /api/traces/:id supports backward-compatible alias 'linear-search'", async () => {
    const res = await request<{ trace: Trace }>(
      app,
      "GET",
      "/api/traces/linear-search"
    );
    expect(res.status).toBe(200);
    expect(res.body.trace.id).toBe("array-linear-search");
    expect(res.body.trace.algorithm).toBe("linear-search");
    expect(isValidTrace(res.body.trace)).toBe(true);
  });

  it("GET /api/traces/:id returns HTTP 404 with JSON error for unknown ID", async () => {
    const res = await request<{ error: string; message: string }>(
      app,
      "GET",
      "/api/traces/non-existent-algo"
    );
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not Found");
    expect(res.body.message).toContain(
      'Algorithm trace with id "non-existent-algo" was not found.'
    );
  });

  it("GET /api/traces/:id returns HTTP 500 when generation or validation fails without leaking stack traces", async () => {
    // Create an isolated app with an injected failing getTrace dependency
    const failingApp = createApp({
      getTrace: () => {
        throw new Error("Simulated generator validation failure");
      },
      getTraceEntries: () => [],
    });

    const res = await request<{ error: string; message: string; stack?: string }>(
      failingApp,
      "GET",
      "/api/traces/any-id"
    );

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Internal Server Error");
    expect(res.body.message).toBe("Failed to load algorithm trace.");
    expect(res.body.stack).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Custom Linear Search Generation (POST)
  // -------------------------------------------------------------------------
  describe("POST /api/traces/:id/generate", () => {
    it("successfully generates custom Linear Search trace from values and target", async () => {
      const res = await request<{ trace: Trace }>(
        app,
        "POST",
        "/api/traces/array-linear-search/generate",
        {
          values: [10, 20, 30, 40],
          target: 30,
        }
      );

      expect(res.status).toBe(200);
      expect(res.body.trace).toBeDefined();
      expect(res.body.trace.id).toBe("array-linear-search");
      expect(res.body.trace.algorithm).toBe("linear-search");
      expect(isValidTrace(res.body.trace)).toBe(true);

      // Verify custom inputs were used
      expect((res.body.trace.input as any).array).toEqual([10, 20, 30, 40]);
      expect((res.body.trace.input as any).target).toBe(30);

      // Final step should indicate target found at index 2
      const finalStep = res.body.trace.steps[res.body.trace.steps.length - 1];
      const resultVar = finalStep.variables.find((v) => v.name === "resultIndex");
      expect(resultVar?.value).toBe(2);
    });

    it("supports alias 'linear-search' for custom generation", async () => {
      const res = await request<{ trace: Trace }>(
        app,
        "POST",
        "/api/traces/linear-search/generate",
        {
          values: [7, 8, 9],
          target: 8,
        }
      );

      expect(res.status).toBe(200);
      expect(res.body.trace.id).toBe("array-linear-search");
      expect(isValidTrace(res.body.trace)).toBe(true);
    });

    it("returns HTTP 400 when values is missing or invalid", async () => {
      const res = await request<{ error: string; message: string }>(
        app,
        "POST",
        "/api/traces/array-linear-search/generate",
        {
          values: "not-an-array",
          target: 5,
        }
      );

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Bad Request");
      expect(res.body.message).toContain("Invalid input");
    });

    it("returns HTTP 400 when values contains non-integer numbers", async () => {
      const res = await request<{ error: string; message: string }>(
        app,
        "POST",
        "/api/traces/array-linear-search/generate",
        {
          values: [1, 2.5, 3],
          target: 5,
        }
      );

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Bad Request");
    });

    it("returns HTTP 400 when target is missing or non-integer", async () => {
      const res = await request<{ error: string; message: string }>(
        app,
        "POST",
        "/api/traces/array-linear-search/generate",
        {
          values: [1, 2, 3],
          target: "invalid-target",
        }
      );

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Bad Request");
    });

    it("returns HTTP 404 when requested algorithm does not support custom generation", async () => {
      const res = await request<{ error: string; message: string }>(
        app,
        "POST",
        "/api/traces/bubble-sort/generate",
        {
          values: [3, 2, 1],
          target: 1,
        }
      );

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Not Found");
      expect(res.body.message).toContain('does not support custom generation');
    });

    it("returns HTTP 500 when custom generation unexpectedly throws", async () => {
      const failingApp = createApp({
        generateLinearSearchTrace: () => {
          throw new Error("Unexpected generator failure");
        },
      });

      const res = await request<{ error: string; message: string; stack?: string }>(
        failingApp,
        "POST",
        "/api/traces/array-linear-search/generate",
        {
          values: [1, 2, 3],
          target: 2,
        }
      );

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Internal Server Error");
      expect(res.body.message).toBe("Failed to generate custom trace.");
      expect(res.body.stack).toBeUndefined();
    });
  });
});
