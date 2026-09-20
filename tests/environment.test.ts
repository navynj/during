import * as React from 'react';
import { describe, expect, it } from 'vitest';

/**
 * The suite must run against React's *development* build.
 *
 * A deploy sets NODE_ENV=production for the whole build; vitest respects an
 * NODE_ENV that is already set, so the suite silently resolved
 * `react-dom-test-utils.production.js` and every one of the 118 render tests
 * died on "React.act is not a function" — on the build machine only, with the
 * local run green.
 *
 * Asserted on `act` itself rather than on NODE_ENV: the environment variable
 * is the current lever, but the thing that actually matters is which React is
 * loaded, and a future toolchain could get that wrong some other way.
 */
describe('the suite runs against development React', () => {
  it('has act, which only the development build carries', () => {
    expect(typeof (React as { act?: unknown }).act).toBe('function');
  });
});
