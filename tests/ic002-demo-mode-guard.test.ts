import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveFirebaseMode } from '../src/lib/firebaseConfig.ts';

test('fails closed in production even when demo opt-in flag is set', () => {
  const res = resolveFirebaseMode({
    NODE_ENV: 'production',
    NEXT_PUBLIC_ENABLE_DEMO_MODE: 'true',
    NEXT_PUBLIC_FIREBASE_API_KEY: '',
  });
  assert.equal(res.isDemoMode, false);
  assert.equal(res.hasFirebaseConfig, false);
  assert.ok(res.configError);
});

test('requires explicit NEXT_PUBLIC_ENABLE_DEMO_MODE=true in non-production', () => {
  const withoutFlag = resolveFirebaseMode({
    NODE_ENV: 'development',
    NEXT_PUBLIC_FIREBASE_API_KEY: '',
  });
  assert.equal(withoutFlag.isDemoMode, false);
  assert.ok(withoutFlag.configError);

  const withFlag = resolveFirebaseMode({
    NODE_ENV: 'development',
    NEXT_PUBLIC_ENABLE_DEMO_MODE: 'true',
    NEXT_PUBLIC_FIREBASE_API_KEY: 'YOUR_API_KEY',
  });
  assert.equal(withFlag.isDemoMode, true);
  assert.equal(withFlag.configError, null);
});

test('enables real firebase mode when valid API key is present', () => {
  const prod = resolveFirebaseMode({
    NODE_ENV: 'production',
    NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyTestRealKey123',
  });
  assert.equal(prod.hasFirebaseConfig, true);
  assert.equal(prod.isDemoMode, false);
  assert.equal(prod.configError, null);
});
