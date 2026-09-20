import type { WaveState, WaveTone } from '@/components/ui/waves';

/**
 * Mirrors supabase/seed.sql by hand rather than querying it: the wave library
 * is a pure render library, and a fixture page that needs a database is one
 * that cannot be opened when the stack is down.
 */
export type WaveFixture = {
  label: string;
  note: string;
  emoji: string;
  tone: WaveTone;
  state: WaveState;
  /** null = a drop or a date-only record: no duration to span. */
  durationMinutes: number | null;
  locked?: boolean;
  dateOnly?: boolean;
};

export const SEED_ROWS: WaveFixture[] = [
  {
    label: '09:00–10:30 · timed, finished',
    note: 'spec rewrite',
    emoji: '🔍',
    tone: 'recent',
    state: 'done',
    durationMinutes: 90,
  },
  {
    label: '12:15 · drop',
    note: 'kitsilano beach',
    emoji: '📍',
    tone: 'recent',
    state: 'done',
    durationMinutes: null,
  },
  {
    label: '20:00– · timed, in progress',
    note: 'session 0',
    emoji: '🔍',
    tone: 'live',
    state: 'active',
    durationMinutes: 75,
  },
  {
    label: '21:30 · planned',
    note: 'dinner with mina',
    emoji: '📍',
    tone: 'recent',
    state: 'planned',
    durationMinutes: null,
  },
  {
    label: '16:00 · drop, locked',
    note: 'the thing I am not saying out loud yet',
    emoji: '🖋',
    tone: 'recent',
    state: 'done',
    durationMinutes: null,
    locked: true,
  },
  {
    label: 'no time · date-only',
    note: 'slept badly, worked anyway',
    emoji: '🖋',
    tone: 'recent',
    state: 'done',
    durationMinutes: null,
    dateOnly: true,
  },
  {
    label: "5 days ago · Jae's ripple, settled",
    note: 'see you when I see you',
    emoji: '🖋',
    tone: 'settled',
    state: 'done',
    durationMinutes: null,
  },
];

export const TONES: WaveTone[] = ['live', 'recent', 'settled'];
export const STATES: WaveState[] = ['planned', 'active', 'done'];

/** The points the log curve is pinned at (see bundleLineCount). */
export const DURATIONS = [5, 15, 25, 60, 120, 240, 480, 1440];
