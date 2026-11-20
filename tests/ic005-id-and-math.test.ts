import test from 'node:test';
import assert from 'node:assert/strict';
import { createUniqueId, clampGoalTarget, computePercent } from '../src/lib/idAndMath.ts';

test('createUniqueId produces distinct IDs even within the same millisecond', () => {
  const ids = new Set<string>();
  for (let i = 0; i < 200; i += 1) {
    ids.add(createUniqueId('post'));
  }
  assert.equal(ids.size, 200);
  assert.ok([...ids].every((id) => id.startsWith('post_')));
});

test('clampGoalTarget and computePercent prevent division by zero or Infinity', () => {
  assert.equal(clampGoalTarget(0), 1);
  assert.equal(clampGoalTarget(-5), 1);
  assert.equal(clampGoalTarget(Number.NaN), 1);
  assert.equal(clampGoalTarget(15.6), 16);

  assert.equal(computePercent(3, 0), 0);
  assert.equal(computePercent(3, -10), 0);
  assert.equal(computePercent(15, 10), 100);
  assert.equal(computePercent(1, 4), 25);
});
