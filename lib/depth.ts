/**
 * SPEC 7 law 1: within a continuous scroll, the past sinks. Sections step
 * white, then #F1F3F7, then #D8DCE8 as you descend, so moving back through
 * the archive reads as going deeper through one surface.
 *
 * Only the two views that scroll through many days use this. Home Daily pages
 * one day at a time and keeps its white ground at every date (H14): a page is
 * not a section, and tinting a whole one reads as disabled rather than deep.
 */
export const DEPTH_SURFACES = ['#ffffff', '#f1f3f7', '#d8dce8'] as const;

/**
 * The ground for a section, counted back from the newest one on screen.
 *
 * Clamped rather than continued: three steps is the whole ramp, and a fourth
 * tone would be a new token. Everything past the bottom step shares it, which
 * is the honest reading of "deep" — depth stops being legible long before an
 * archive does.
 */
export function depthSurface(sectionsBack: number): string {
  const step = Math.min(Math.max(sectionsBack, 0), DEPTH_SURFACES.length - 1);
  return DEPTH_SURFACES[step];
}
