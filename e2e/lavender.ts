/**
 * Does a colour read as blue or violet, rather than as a grey with a cool
 * trace (H78)? Hue alone cannot say: ink #161622 and the cool greys sit at
 * a blue hue by design. HSL saturation cannot say either: it inflates near
 * white and near black (#F8F8FA is 17%, ink 21%), while the lavender that
 * prompted this (#6B79A3) is 23%. OKLCH chroma measures the tint as it is
 * seen, the same at every lightness: the greys and ink stay under 0.025,
 * the old lavender ramp's muted text is 0.067 and the old blue tint 0.043.
 */
export const LAVENDER_CHROMA = 0.03;

const linear = (c: number): number => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/** OKLCH chroma and hue (degrees) of an sRGB colour, channels 0–255. */
export function oklch(r: number, g: number, b: number): { chroma: number; hue: number } {
  const [lr, lg, lb] = [linear(r), linear(g), linear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { chroma: Math.hypot(a, bb), hue: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}

/** Blue to violet in OKLCH (sky blue #1E90FF is about 250°, violet #8A2BE2 about 305°). */
export function isLavender(r: number, g: number, b: number): boolean {
  const { chroma, hue } = oklch(r, g, b);
  return chroma > LAVENDER_CHROMA && hue >= 230 && hue <= 310;
}
