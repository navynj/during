import type { ReactElement } from 'react';

// The mark's two pages, as exported (public/dida-logo-light.svg, H78):
// the back page, then the front over it, in a 236 × 284 box.
const BACK =
  'M0 16C0 7.16343 7.16344 0 16 0H97.6918C133.038 0 161.692 28.6538 161.692 64V159.083C161.692 194.429 133.038 223.083 97.6918 223.083H16C7.16343 223.083 0 215.919 0 207.083V16Z';
const FRONT =
  'M74.3081 76.5266C74.3081 67.69 81.4716 60.5266 90.3081 60.5266H172C207.346 60.5266 236 89.1804 236 124.527V219.609C236 254.956 207.346 283.609 172 283.609H90.3081C81.4715 283.609 74.3081 276.446 74.3081 267.609V76.5266Z';

/** The ink mark's two greys (H78): fixed, for light grounds the theme does not reach. */
const INK = { back: '#D0D0D4', front: '#161622' } as const;

/**
 * Dida's mark, transparent (H78; no tile anywhere since 2026-11-14).
 * `theme` (the default) follows the place's theme through globals.css
 * (`.dida-mark`): the header and the settings foot. `ink` is the ink mark
 * whatever the theme — front #161622, back an opaque #D0D0D4, so a line
 * behind it never shows through — for sign-in and the invite. Decorative:
 * the name beside it says Dida.
 */
export function DidaMark({
  height = 24,
  tone = 'theme',
  className = '',
}: {
  height?: number;
  tone?: 'theme' | 'ink';
  className?: string;
}): ReactElement {
  const ink = tone === 'ink';
  return (
    <svg
      aria-hidden
      data-dida-mark={tone}
      viewBox="0 0 236 284"
      height={height}
      width={(height * 236) / 284}
      className={`${ink ? '' : 'dida-mark'}shrink-0 ${className}`}
    >
      <path
        className={ink ? undefined : 'dida-mark-back'}
        fill={ink ? INK.back : undefined}
        d={BACK}
      />
      <path
        className={ink ? undefined : 'dida-mark-front'}
        fill={ink ? INK.front : undefined}
        d={FRONT}
      />
    </svg>
  );
}

/**
 * A small white rounded tile with the ink mark: the share image's watermark,
 * which sits over photos of every colour (H78). The only tile left; the
 * dark one is retired.
 */
export function DidaWhiteTile({
  size = 20,
  className = '',
}: {
  size?: number;
  className?: string;
}): ReactElement {
  return (
    <svg
      aria-hidden
      data-dida-tile="white"
      viewBox="0 0 441 441"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    >
      <rect width="441" height="441" rx="98" fill="#ffffff" />
      {/* The mark at 62% of the tile, lifted 7.5 as the export is, as the favicon was. */}
      <g transform="translate(106.9 76.3) scale(0.9627)">
        <path d={BACK} fill={INK.back} />
        <path d={FRONT} fill={INK.front} />
      </g>
    </svg>
  );
}
