import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const collectTsx = (dir: string): string[] => {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsx(full));
    } else if (entry.name.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
};

test('shared Media components handle cover/avatar fallbacks and feature/nav components avoid raw <img>', () => {
  const mediaPath = path.join(root, 'src/components/Media.tsx');
  assert.equal(fs.existsSync(mediaPath), true, 'src/components/Media.tsx must exist');
  const mediaSrc = fs.readFileSync(mediaPath, 'utf8');
  assert.match(mediaSrc, /export const BookCover/);
  assert.match(mediaSrc, /export const UserAvatar/);
  assert.match(mediaSrc, /onError/);

  const nextConfig = fs.readFileSync(path.join(root, 'next.config.ts'), 'utf8');
  assert.match(nextConfig, /remotePatterns/);

  const tsxFiles = collectTsx(path.join(root, 'src')).filter(
    (f) => !f.endsWith(`${path.sep}Media.tsx`)
  );
  const rawImgFiles: string[] = [];
  for (const file of tsxFiles) {
    const src = fs.readFileSync(file, 'utf8');
    if (/<img\b/.test(src)) {
      rawImgFiles.push(path.relative(root, file));
    }
  }
  assert.deepEqual(rawImgFiles, [], `Found raw <img> tags in: ${rawImgFiles.join(', ')}`);
});
