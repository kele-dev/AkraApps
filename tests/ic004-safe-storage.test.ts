import test from 'node:test';
import assert from 'node:assert/strict';
import { safeJsonParse, safeStorageGet, safeStorageSet } from '../src/lib/storage.ts';

test('safeJsonParse returns fallback on malformed JSON or null', () => {
  assert.deepEqual(safeJsonParse(null, []), []);
  assert.deepEqual(safeJsonParse('{bad-json', { ok: false }), { ok: false });
  assert.deepEqual(safeJsonParse('{"a":1}', { a: 0 }), { a: 1 });
});

test('safeStorageGet and safeStorageSet catch storage errors without throwing', () => {
  const brokenStorage = {
    getItem() {
      throw new Error('SecurityError');
    },
    setItem() {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    },
  };

  assert.deepEqual(safeStorageGet('k', ['default'], brokenStorage), ['default']);
  assert.equal(safeStorageSet('k', { big: 'data' }, brokenStorage), false);

  const mem = new Map<string, string>();
  const okStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => { mem.set(k, v); },
  };
  assert.equal(safeStorageSet('k', { ok: 1 }, okStorage), true);
  assert.deepEqual(safeStorageGet('k', { ok: 0 }, okStorage), { ok: 1 });
});
