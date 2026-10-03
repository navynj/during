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
