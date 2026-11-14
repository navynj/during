import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * The rebrand's words hold (H78, _docs/GLOSSARY.md): no string the app can
 * render names a retired term. Pool, lane, splash and ripple stay in code —
 * identifiers, tables, routes, keys — so this reads only what can reach a
 * screen: string literals, template text and JSX text, as the TypeScript
 * parser finds them, never comments or names.
 *
 * A literal counts as rendered when it holds a space or starts with a capital
 * (a label, a sentence); a lone lower-case word is a key or a table name.
 * What is left over is listed below, each with why.
 */

const ROOTS = ['app', 'features', 'components', 'lib'];
// Not rendered: dev-only screens, query selects, generated types.
const SKIP_DIRS = ['app/dev', 'lib/queries'];
const SKIP_FILES = ['lib/database.types.ts'];

const RETIRED = /\b(pools?|lanes?|splash(es)?|ripples?)\b/i;

// file:line → why it is not rendered text. Keep each one justified.
const ALLOWED: Record<string, string> = {
  'lib/avatars.ts:125': 'a signing kind, named only in a console error',
  'features/auth/welcome-splash.ts:56': 'a failure report tag, never shown',
  'features/month-board/board-handles.tsx:229': 'a DOM selector of data attributes',
  'features/lanes/lane-rows.tsx:120': 'a DOM selector of data attributes',
  // The old tagline, replaced with the name in the next commit (H78, part 2).
  'app/layout.tsx:24': 'old tagline',
  'app/layout.tsx:33': 'old tagline',
  'app/manifest.ts:19': 'old tagline',
  'app/sign-in/page.tsx:34': 'old tagline',
  'features/auth/pool-block.tsx:55': 'old tagline',
  'features/share-image/export-board.tsx:249': 'old tagline',
};

function sourceFiles(dir: string): string[] {
  if (SKIP_DIRS.includes(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    if (!/\.tsx?$/.test(name) || /\.test\.tsx?$/.test(name) || SKIP_FILES.includes(path)) {
      return [];
    }
    return [path];
  });
}

function looksRendered(raw: string): boolean {
  if (raw.includes('[during]')) return false; // a console prefix
  if (/\b(text|bg|border|ring|fill|stroke)-pool-\d/.test(raw)) return false; // a class name
  const text = raw.replace(/^[\s'"`}]+|[\s'"`$]+$/g, '').replace(/\$\{$/, '');
  return /\s/.test(text) || (/^[A-Z]/.test(text) && !/^[A-Z_]+$/.test(text));
}

function retiredIn(file: string): string[] {
  const src = readFileSync(file, 'utf8');
  const kind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, kind);
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
    let literal = false;
    if (ts.isJsxText(node)) literal = true;
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const parent = node.parent;
      literal = !(
        (ts.isPropertyAssignment(parent) && parent.name === node) ||
        ts.isLiteralTypeNode(parent) ||
        ts.isElementAccessExpression(parent)
      );
    } else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      literal = true;
    }
    if (literal) {
      const raw = src.slice(node.getStart(), node.getEnd());
      const line = sf.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      if (RETIRED.test(raw) && looksRendered(raw) && !(`${file}:${line}` in ALLOWED)) {
        found.push(`${file}:${line}  ${raw.replace(/\s+/g, ' ').trim()}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

describe('the retired words (H78)', () => {
  it('appear in no rendered string', () => {
    const found = ROOTS.flatMap(sourceFiles).flatMap(retiredIn);
    expect(found).toEqual([]);
  });

  it('keeps every allowance pointing at a real literal', () => {
    for (const at of Object.keys(ALLOWED)) {
      const [file, line] = at.split(':');
      const text = readFileSync(file, 'utf8').split('\n')[Number(line) - 1] ?? '';
      expect(RETIRED.test(text), at).toBe(true);
    }
  });
});
