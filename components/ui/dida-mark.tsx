import type { ReactElement } from 'react';

// The mark's two pages, as exported (public/dida-logo-light.svg, H78):
// the back page, then the front over it, in a 236 × 284 box.
const BACK =
  'M0 16C0 7.16343 7.16344 0 16 0H97.6918C133.038 0 161.692 28.6538 161.692 64V159.083C161.692 194.429 133.038 223.083 97.6918 223.083H16C7.16343 223.083 0 215.919 0 207.083V16Z';
const FRONT =
  'M74.3081 76.5266C74.3081 67.69 81.4716 60.5266 90.3081 60.5266H172C207.346 60.5266 236 89.1804 236 124.527V219.609C236 254.956 207.346 283.609 172 283.609H90.3081C81.4715 283.609 74.3081 276.446 74.3081 267.609V76.5266Z';

/**
 * Dida's mark without its tile (H78, part 2b). On a light ground it is the
 * light mark: the front page in ink, the back page an opaque light grey —
 * opaque, so a photo or a line behind it never shows through. On the dark
 * water ground it is the white mark, the back page white at 20%
 * (globals.css, `.dida-mark`). Decorative: the name beside it says Dida.
 */
export function DidaMark({
  height = 24,
  className = '',
}: {
  height?: number;
  className?: string;
}): ReactElement {
  return (
    <svg
      aria-hidden
      data-dida-mark
      viewBox="0 0 236 284"
      height={height}
      width={(height * 236) / 284}
      className={`dida-mark shrink-0 ${className}`}
    >
      <path className="dida-mark-back" d={BACK} />
      <path className="dida-mark-front" d={FRONT} />
    </svg>
  );
}

/**
 * The dark tile (public/dida-full-logo.svg): the white mark on a rounded
 * #161622 square, as exported plus its corners. For the places a first look
 * lands on — sign-in, the invite — and over photos, which vary behind it.
 */
export function DidaTile({
  size = 48,
  className = '',
}: {
  size?: number;
  className?: string;
}): ReactElement {
  return (
    <svg
      aria-hidden
      data-dida-tile
      viewBox="0 0 441 441"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    >
      <rect width="441" height="441" rx="98" fill="#161622" />
      {/* The mark at 58% of the tile, lifted 7.5 as the export is (scripts/make-icons.mjs). */}
      <g transform="translate(114.2 85.1) scale(0.9006)">
        <path d={BACK} fill="#ffffff" opacity={0.2} />
        <path d={FRONT} fill="#ffffff" />
      </g>
    </svg>
  );
}
