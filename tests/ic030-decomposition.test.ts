import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { translations } from '../src/lib/i18n.ts';

const root = process.cwd();

test('translations live in src/lib/i18n.ts with matching id and en keys', () => {
  const idKeys = Object.keys(translations.id).sort();
  const enKeys = Object.keys(translations.en).sort();
  assert.deepEqual(idKeys, enKeys);
  assert.ok(idKeys.length > 50);
});

test('monolithic UI features are decomposed into focused subcomponents', () => {
  const modules = [
    'src/lib/i18n.ts',
    'src/features/Feed/FeedSidebarWidgets.tsx',
    'src/features/Feed/StoryViewerModal.tsx',
    'src/features/Profile/ProfileActivityTabs.tsx',
    'src/features/Books/BuddyReadSection.tsx',
  ];

  for (const mod of modules) {
    assert.equal(fs.existsSync(path.join(root, mod)), true, `${mod} must exist`);
  }
});
