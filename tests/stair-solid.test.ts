import { describe, expect, it } from 'vitest';

import { LIGHT_TINTS, seat, upSolid, type Stair } from '@/features/home/stair-board';

/**
 * The read card's solid (review): what frosted glass reads as, so a card
 * moving to or from the top never turns a colour the glass then drops.
 */
const STAIR: Stair = { horizontal: false, width: 360, height: 400, left: 0, down: 3, up: 1 };

describe('upSolid', () => {
  it('is 20% white into the theme colour on the dark ground, #3739D4 for blue', () => {
    expect(upSolid('#0507C9', 'dark')).toBe('rgb(55, 57, 212)');
  });

  it('is white on the light and pastel grounds, where the glass is white over white', () => {
    expect(upSolid('#0507C9', 'light')).toBe('#FFFFFF');
    expect(upSolid('#E5318C', 'pastel')).toBe('#FFFFFF');
  });
});

describe('a card moving between the top and the read step without glass', () => {
  it('stays white the whole way on the light ground: no dark flash', () => {
    for (const d of [0, -0.25, -0.5, -0.75, -1]) {
      expect(seat(d, STAIR, false, '#0507C9', upSolid('#0507C9', 'light')).background).toBe(
        'rgb(255, 255, 255)',
      );
    }
  });

  it('deepens into the dark ground’s glass in dark mode', () => {
    expect(seat(-1, STAIR, false, '#0507C9', upSolid('#0507C9', 'dark')).background).toBe(
      'rgb(55, 57, 212)',
    );
  });
});

describe('the back cards on the light ground (H78v)', () => {
  it('step 6%, 10% and 14% of the theme colour, wide enough to part without a line', () => {
    const fill = (d: number): string =>
      seat(d, STAIR, false, '#161621', upSolid('#161621', 'light'), LIGHT_TINTS).background;
    expect(fill(0)).toBe('rgb(255, 255, 255)');
    expect(fill(1)).toBe('rgb(241, 241, 242)');
    expect(fill(2)).toBe('rgb(232, 232, 233)');
    expect(fill(3)).toBe('rgb(222, 222, 224)');
  });
});
