import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedImageMime, ALLOWED_RASTER_IMAGE_MIMES } from '../src/lib/uploadValidation.ts';
import nextConfig from '../next.config.ts';

test('isAllowedImageMime allows safe raster formats and rejects SVG/HTML/executable files', () => {
  for (const mime of ALLOWED_RASTER_IMAGE_MIMES) {
    assert.equal(isAllowedImageMime(mime), true);
  }
  assert.equal(isAllowedImageMime('image/svg+xml'), false);
  assert.equal(isAllowedImageMime('text/html'), false);
  assert.equal(isAllowedImageMime('application/pdf'), false);
  assert.equal(isAllowedImageMime(''), false);
});

test('nextConfig defines HTTP security headers including X-Frame-Options, nosniff, and CSP', async () => {
  assert.equal(typeof nextConfig.headers, 'function');
  const headerEntries = await nextConfig.headers!();
  assert.ok(headerEntries.length > 0);
  const keys = headerEntries[0].headers.map((h) => h.key.toLowerCase());
  assert.ok(keys.includes('x-frame-options'));
  assert.ok(keys.includes('x-content-type-options'));
  assert.ok(keys.includes('referrer-policy'));
  assert.ok(keys.includes('content-security-policy'));
});
