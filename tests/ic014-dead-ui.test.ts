import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('previously dead UI controls have wired handlers and Books renders showAddForm', () => {
  const booksSrc = fs.readFileSync(path.join(process.cwd(), 'src/features/Books/Books.tsx'), 'utf8');
  assert.match(booksSrc, /\{showAddForm\s*&&/);

  const headerSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/Header.tsx'), 'utf8');
  assert.doesNotMatch(headerSrc, /<button className="hidden sm:flex[^"]*">\s*<MessageSquare/);
  assert.doesNotMatch(headerSrc, /<button className="hidden sm:flex[^"]*">\s*<Users/);

  const bookDetailsSrc = fs.readFileSync(path.join(process.cwd(), 'src/features/Books/BookDetails.tsx'), 'utf8');
  assert.doesNotMatch(bookDetailsSrc, /<button type="button" className="px-5 py-1 text-xs font-bold text-white bg-black[^"]*">\s*Follow/);
});
