import { describe, expect, it } from 'vitest';

import { isLavender } from '../e2e/lavender';

const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

describe('a cool grey reads as grey, the old lavender as lavender (H78)', () => {
  it.each([
    ['ink', '#161622'],
    ['ink, body', '#161621'],
    ['background', '#F8F8FA'],
    ['surface-muted', '#F1F1F4'],
    ['border', '#E3E3E8'],
    ['text-muted', '#5C5C68'],
    ['neutral grey', '#5E5E5E'],
    ['white', '#FFFFFF'],
  ])('%s %s passes', (_, hex) => {
    expect(isLavender(...rgb(hex))).toBe(false);
  });

  it.each([
    ['old muted text', '#6B79A3'],
    ['old blue tint', '#D3D7F6'],
    ['old recent blue', '#787BE2'],
    ['Blue', '#0507C9'],
    ['violet', '#8A2BE2'],
  ])('%s %s fails', (_, hex) => {
    expect(isLavender(...rgb(hex))).toBe(true);
  });
});
