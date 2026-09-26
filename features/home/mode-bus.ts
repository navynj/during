/**
 * The third way to switch Home's view mode (SPEC 5): re-tapping the Home tab
 * while already on Home. The tab bar lives in the shell and the mode lives on
 * the page, so the request crosses as a window event rather than a context
 * threaded through the layout — the bar asks, and Home answers if mounted.
 */
const HOME_MODE_TOGGLE = 'during:home-mode-toggle';

export function requestHomeModeToggle(): void {
  window.dispatchEvent(new Event(HOME_MODE_TOGGLE));
}

export function onHomeModeToggle(handler: () => void): () => void {
  window.addEventListener(HOME_MODE_TOGGLE, handler);
  return () => window.removeEventListener(HOME_MODE_TOGGLE, handler);
}
