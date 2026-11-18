import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

// This config runs frontend and shared unit/generator/api tests (pure TS/React hooks)
// using the backend's Vitest installation. The frontend has no test runner of its own.
export default defineConfig({
  resolve: {
    alias: {
      // Ensure single instances and resolve frontend packages
      zod: resolve(import.meta.dirname, '../frontend/node_modules/zod/index.js'),
      react: resolve(import.meta.dirname, '../frontend/node_modules/react'),
      'react-dom': resolve(import.meta.dirname, '../frontend/node_modules/react-dom'),
    },
  },
  test: {
    environment: 'node',
    include: [
      '../frontend/src/generators/__tests__/**/*.test.ts',
      '../shared/generators/__tests__/**/*.test.ts',
      '../frontend/src/api/__tests__/**/*.test.ts',
      '../frontend/src/components/__tests__/**/*.test.ts',
    ],
  },
});
