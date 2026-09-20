import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * React ships two builds, and `act` exists only in the development one. A
 * deploy sets NODE_ENV=production for the whole build, vitest respects an
 * NODE_ENV that is already set, and the suite then resolves
 * `react-dom-test-utils.production.js` — where every render fails with
 * "React.act is not a function".
 *
 * Set here rather than in the script so no way of invoking the suite can miss
 * it. Tests are a development-time activity whatever the surrounding build is
 * doing; a suite run against production React is testing a different program.
 */
// Assigned through Object.assign because Next types NODE_ENV as read-only,
// and these configs are inside the project's type check.
Object.assign(process.env, { NODE_ENV: 'test' });

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    // The suites talk to the local stack; keep them serial and patient.
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
    fileParallelism: false,
  },
});
