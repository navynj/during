import type { Database } from '@/lib/database.types';

type RippleMode = Database['public']['Enums']['ripple_mode'];

/**
 * The seed every new profile starts with (E1: presets declare a culture, not
 * just a taxonomy — resting ranks with focus). Day is the residual category;
 * SPEC 4 keeps it out of pool mappings by default for the same reason.
 */
export const PRESET_CATEGORIES: ReadonlyArray<{
  name: string;
  icon: string;
  default_mode: RippleMode;
}> = [
  { name: 'Focus', icon: '🔍', default_mode: 'timed' },
  { name: 'Place', icon: '📍', default_mode: 'drop' },
  { name: 'Listening', icon: '🎧', default_mode: 'drop' },
  { name: 'Day', icon: '🖋', default_mode: 'drop' },
];
