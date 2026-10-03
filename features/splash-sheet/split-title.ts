/**
 * The post sheet's one text area (SPEC 6): the first line is the title, and
 * after the first Enter everything is the first block's body. A single line
 * with no Enter is an **untitled** post whose line is its block — the dump
 * posture, preserved on purpose (H21, a dogfood watch item).
 */
export function splitTitle(text: string): { title: string; body: string } {
  const newline = text.indexOf('\n');
  if (newline === -1) return { title: '', body: text.trim() };
  return { title: text.slice(0, newline).trim(), body: text.slice(newline + 1).trim() };
}

/**
 * The same rule across the sheet's two fields (review): the title field is
 * the first line, the body field is what follows the Enter. A line typed into
 * the title alone, with nothing under it and no photo, is still the dump —
 * an untitled post whose line is its block — rather than a titled post with
 * nothing to read.
 */
export function composeDrop(
  title: string,
  body: string,
  hasMedia: boolean,
): { title: string; body: string } {
  const t = title.trim();
  const b = body.trim();
  if (b.length === 0 && !hasMedia) return { title: '', body: t };
  return { title: t, body: b };
}
