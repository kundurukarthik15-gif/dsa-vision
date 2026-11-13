import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

// This config runs frontend generator tests (pure TS, no DOM) using the
// backend's Vitest installation. The frontend has no test runner of its own.
export default defineConfig({
  resolve: {
    alias: {
      // Alias 'zod' to the frontend's own installed copy rather than the
      // backend's copy. Both are the same version (^4.x), but aliasing
      // ensures a single Zod instance is used throughout the test run:
      // the generator imports validateTrace from frontend/src/types/vep.ts,
      // which itself imports from zod — if two separate node_modules copies
      // were loaded, Zod schema identity checks could silently diverge.
      // Keep both package.json files at the same Zod major version.
      zod: resolve(import.meta.dirname, '../frontend/node_modules/zod/index.js'),
    },
  },
  test: {
    environment: 'node',
    include: [
      '../frontend/src/generators/__tests__/**/*.test.ts',
    ],
  },
});
