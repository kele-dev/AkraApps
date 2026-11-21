import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { formatRelativeTime } from '../src/lib/dateUtils.ts';
import { filterLocalBooks } from '../src/lib/bookSearchUtils.ts';

test('formatRelativeTime formats Indonesian and English relative timestamps consistently', () => {
  const now = new Date('2026-11-21T12:00:00Z');
  const fiveMinsAgo = '2026-11-21T11:55:00Z';
  const twoHoursAgo = '2026-11-21T10:00:00Z';

  assert.equal(formatRelativeTime(fiveMinsAgo, 'id', now), '5 menit lalu');
  assert.equal(formatRelativeTime(twoHoursAgo, 'id', now), '2 jam lalu');
  assert.equal(formatRelativeTime(fiveMinsAgo, 'en', now), '5m ago');
  assert.equal(formatRelativeTime(twoHoursAgo, 'en', now), '2h ago');
});

test('filterLocalBooks filters books by case-insensitive title or author', () => {
  const books = [
    { id: '1', title: 'Laskar Pelangi', author: 'Andrea Hirata', coverImage: '', totalPages: 500 },
    { id: '2', title: 'Bumi', author: 'Tere Liye', coverImage: '', totalPages: 400 },
  ];
  assert.equal(filterLocalBooks(books, 'andrea').length, 1);
  assert.equal(filterLocalBooks(books, 'BUMI').length, 1);
  assert.equal(filterLocalBooks(books, 'nonexistent').length, 0);
});

test('ConfirmDeleteModal is extracted and reused by Feed and Profile', () => {
  const root = process.cwd();
  const modalPath = path.join(root, 'src/components/ConfirmDeleteModal.tsx');
  assert.equal(fs.existsSync(modalPath), true, 'ConfirmDeleteModal.tsx must exist');

  const feed = fs.readFileSync(path.join(root, 'src/features/Feed/Feed.tsx'), 'utf8');
  const profile = fs.readFileSync(path.join(root, 'src/features/Profile/Profile.tsx'), 'utf8');
  assert.match(feed, /ConfirmDeleteModal/);
  assert.match(profile, /ConfirmDeleteModal/);
});
