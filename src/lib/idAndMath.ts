let fallbackCounter = 0;

export function createUniqueId(prefix: string): string {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }
  fallbackCounter += 1;
  return `${prefix}_${Date.now()}_${fallbackCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

export function clampGoalTarget(targetBooks: number): number {
  if (!Number.isFinite(targetBooks)) return 1;
  return Math.max(1, Math.round(targetBooks));
}

export function computePercent(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
}
