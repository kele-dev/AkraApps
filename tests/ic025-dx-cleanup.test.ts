import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('unused Next starter SVGs are removed, .editorconfig exists, and package.json pins Node engines', () => {
  for (const name of ['file.svg', 'globe.svg', 'next.svg', 'vercel.svg', 'window.svg']) {
    assert.equal(fs.existsSync(path.join(root, 'public', name)), false, `${name} should be removed`);
  }

  assert.equal(fs.existsSync(path.join(root, '.editorconfig')), true, '.editorconfig must exist');

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.match(pkg.engines?.node ?? '', />=\s*22/, 'package.json engines.node should require >=22');
});
