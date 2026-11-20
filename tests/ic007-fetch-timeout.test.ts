import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchWithTimeout } from '../src/lib/http.ts';

test('fetchWithTimeout aborts slow requests after timeoutMs and forwards external signal', async () => {
  const slowFetch: typeof fetch = (_input, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });

  await assert.rejects(
    () => fetchWithTimeout('https://example.com', { timeoutMs: 25, fetchImpl: slowFetch }),
    (err: unknown) => (err as { name?: string }).name === 'AbortError'
  );

  const caller = new AbortController();
  const promise = fetchWithTimeout('https://example.com', {
    timeoutMs: 5000,
    signal: caller.signal,
    fetchImpl: slowFetch,
  });
  caller.abort();
  await assert.rejects(
    () => promise,
    (err: unknown) => (err as { name?: string }).name === 'AbortError'
  );
});
