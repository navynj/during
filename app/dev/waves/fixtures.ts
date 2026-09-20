import type { WaveState } from '@/components/ui/waves';

/**
 * Mirrors supabase/seed.sql by hand rather than querying it: the wave library
 * is a pure render library, and a fixture page that needs a database is one
 * that cannot be opened when the stack is down.
 */
export type WaveFixture = {
  label: string;
  note: string;
  emoji: string;
  state: WaveState;
  /** null = a drop or a date-only record: no duration to span. */
  durationMinutes: number | null;
  tag?: string;
};

export const SEED_ROWS: WaveFixture[] = [
  {
    label: '09:00–10:30 · timed, finished',
    note: 'spec rewrite',
    emoji: '🔍',
    state: 'done',
    durationMinutes: 90,
  },
  {
    label: '12:15 · drop',
    note: 'kitsilano beach',
    emoji: '📍',
    state: 'done',
    durationMinutes: null,
  },
  {
    label: '20:00– · timed, in progress',
    note: 'session 0',
    emoji: '🔍',
    state: 'active',
    durationMinutes: 75,
  },
  {
    label: '21:30 · planned',
    note: 'dinner with mina',
    emoji: '📍',
    state: 'planned',
    durationMinutes: null,
  },
  {
    label: '16:00 · drop, locked',
    note: 'the thing I am not saying out loud yet',
    emoji: '🖋',
    state: 'done',
    durationMinutes: null,
    tag: 'locked · author only',
  },
  {
    label: 'no time · date-only',
    note: 'slept badly, worked anyway',
    emoji: '🖋',
    state: 'done',
    durationMinutes: null,
    tag: 'date-only · Daily Note area',
  },
  {
    label: "5 days ago · Jae's ripple",
    note: 'see you when I see you',
    emoji: '🖋',
    state: 'done',
    durationMinutes: null,
    tag: 'past — the section background sinks, the wave does not',
  },
];

export const STATES: WaveState[] = ['planned', 'active', 'done'];

/** The points the log curve is pinned at (see bundleLineCount). */
export const DURATIONS = [5, 15, 25, 60, 120, 240, 480, 1440];
