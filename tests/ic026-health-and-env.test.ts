import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateFirebaseEnv } from '../src/lib/firebaseConfig.ts';

test('validateFirebaseEnv reports missing NEXT_PUBLIC_FIREBASE_* keys accurately', () => {
  const partial = validateFirebaseEnv({
    NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyRealKey123',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'akra.firebaseapp.com',
  });

  assert.equal(partial.isValid, false);
  assert.deepEqual(partial.missingKeys, [
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ]);

  const complete = validateFirebaseEnv({
    NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyRealKey123',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'akra.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'akra-prod',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'akra-prod.appspot.com',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
    NEXT_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:abcdef',
  });

  assert.equal(complete.isValid, true);
  assert.deepEqual(complete.missingKeys, []);
});

test('health route handler exports async GET returning ok status and dependency readiness', async () => {
  const routePath = path.join(process.cwd(), 'src/app/api/health/route.ts');
  assert.equal(fs.existsSync(routePath), true, 'src/app/api/health/route.ts must exist');

  const routeModule = await import('../src/app/api/health/route.ts');
  assert.equal(typeof routeModule.GET, 'function');

  const response = await routeModule.GET();
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'ok');
  assert.equal(typeof body.timestamp, 'string');
  assert.equal(typeof body.firebaseConfigured, 'boolean');
  assert.ok(Array.isArray(body.missingFirebaseKeys));
});
