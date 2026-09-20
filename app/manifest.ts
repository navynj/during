import type { MetadataRoute } from 'next';

/**
 * Enough of a manifest to install, and nothing more.
 *
 * No service worker and no offline cache in P1 (v2): a diary that shows a
 * stale day is worse than one that says it cannot reach the network, and
 * getting that right is its own piece of work rather than a line here.
 *
 * `standalone` is the whole point — the phone's browser chrome is what makes
 * a bookmarked web page feel like a bookmarked web page.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'During',
    short_name: 'During',
    description: 'A one-line diary that assembles itself.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    // The live surface, so the splash and the status bar are the app's own
    // colour rather than a browser default.
    theme_color: '#0507c9',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Cropped to a circle by the launcher; the mark sits inside the safe
      // zone and the blue takes whatever is trimmed.
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
