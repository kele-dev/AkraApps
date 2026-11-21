import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('fonts load via next/font/google without render-blocking @import and globals.css supports reduced-motion & dark scheme', () => {
  const layout = fs.readFileSync(path.join(root, 'src/app/layout.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/app/globals.css'), 'utf8');

  assert.doesNotMatch(css, /@import\s+url\(['"]https:\/\/fonts\.googleapis\.com/);
  assert.match(layout, /from\s+["']next\/font\/google["']/);
  assert.match(layout, /Plus_Jakarta_Sans/);
  assert.match(layout, /Outfit/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s*\(prefers-color-scheme:\s*dark\)/);
});
