import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_FIREBASE_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

test('.env.example documents all Firebase keys and README.md reflects AKRA project setup', () => {
  const envExamplePath = path.join(process.cwd(), '.env.example');
  assert.equal(fs.existsSync(envExamplePath), true, '.env.example must exist');
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  for (const key of REQUIRED_FIREBASE_KEYS) {
    assert.match(envExample, new RegExp(`^${key}=`, 'm'));
  }

  const readme = fs.readFileSync(path.join(process.cwd(), 'README.md'), 'utf8');
  assert.doesNotMatch(readme, /bootstrapped with \[`create-next-app`\]/);
  assert.match(readme, /NEXT_PUBLIC_FIREBASE_API_KEY/);
  assert.match(readme, /npm run typecheck/);
});
