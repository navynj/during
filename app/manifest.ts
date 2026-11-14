import type { MetadataRoute } from 'next';

/**
 * Enough of a manifest to install, and nothing more.
 *
 * No offline cache: a diary that shows a stale day is worse than one that
 * says it cannot reach the network, and getting that right is its own piece
 * of work rather than a line here. The one service worker (public/sw.js,
 * H32) is for Web Push and has no fetch handler.
 *
 * `standalone` is the whole point — the phone's browser chrome is what makes
 * a bookmarked web page feel like a bookmarked web page.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dida Diary',
    short_name: 'Dida',
    description: 'A digital diary you decorate.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    // The page's own ground, not the live surface. Law 5 reserves a solid
    // #0507C9 surface for a live session; a status bar carrying it would make
    // that claim for as long as the app is open.
    theme_color: '#ffffff',
    orientation: 'portrait',
    icons: [
      { src: '/dida-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/dida-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Cut to the launcher's own shape: the mark sits in the middle 80%,
      // on white, which takes whatever is trimmed (scripts/make-icons.mjs).
      {
        src: '/dida-icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
