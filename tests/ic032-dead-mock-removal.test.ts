import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const collectTs = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectTs(full));
    else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
};

test('dead empty mock constants are removed from src/', () => {
  const root = process.cwd();
  const forbidden =
    /\b(INITIAL_USERS|INITIAL_BOOKS|INITIAL_PROGRESS|INITIAL_POSTS|INITIAL_STORIES|INITIAL_GOALS|INITIAL_BUDDY_READS|INITIAL_NOTIFICATIONS|getInitialBuddyMessages|LOCAL_BOOK_DATABASE|RICH_BOOK_DATABASE)\b/;

  const matches: string[] = [];
  for (const file of collectTs(path.join(root, 'src'))) {
    const src = fs.readFileSync(file, 'utf8');
    const hit = src.match(forbidden);
    if (hit) {
      matches.push(`${path.relative(root, file)}: ${hit[1]}`);
    }
  }
  assert.deepEqual(matches, [], `Dead mock constants still exist:\n${matches.join('\n')}`);
});
