import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();

const collectTsFiles = (dir: string): string[] => {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
};

test('no explicit any or as any in src/', () => {
  const files = collectTsFiles(path.join(rootDir, 'src'));
  const offenders: string[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/\bany\b/.test(line) && !line.trim().startsWith('//')) {
        // Check specifically for TypeScript `: any`, `as any`, `<any>`
        if (/:\s*any\b|\bas\s+any\b|<any>|\bany\[\]/.test(line)) {
          offenders.push(`${path.relative(rootDir, file)}:${index + 1}: ${line.trim()}`);
        }
      }
    });
  }

  assert.deepEqual(offenders, [], `Found explicit any usages:\n${offenders.join('\n')}`);
});

test('TypeScript compiler passes with zero errors (npm run typecheck)', () => {
  execSync('npx tsc --noEmit --incremental false', {
    cwd: rootDir,
    stdio: 'pipe',
  });
});
