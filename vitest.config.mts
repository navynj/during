import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The RLS suite talks to the local stack; keep it serial and patient.
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    fileParallelism: false,
  },
});
