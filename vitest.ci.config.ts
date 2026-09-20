import { fileURLToPath } from 'node:url';
import { defaultExclude, defineConfig } from 'vitest/config';

/**
 * The suite as a deploy can run it: everything except the files that talk to
 * a live Postgres.
 *
 * Those are not skipped for being slow — they are the ones that prove RLS,
 * the exclusion constraint and the containment triggers actually hold, and
 * they have to keep running locally before every push. A build machine has no
 * stack to point them at, so it runs the rest rather than pretending.
 */
const NEEDS_LOCAL_STACK = [
  'tests/rls.test.ts',
  'tests/edit-delete.test.ts',
  'tests/timeline-exclusivity.test.ts',
  'tests/break.test.ts',
  'tests/bootstrap-profile.test.ts',
  'tests/auth-redirect.test.ts',
];

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: [...defaultExclude, ...NEEDS_LOCAL_STACK],
    setupFiles: ['tests/setup.ts'],
    fileParallelism: false,
  },
});
