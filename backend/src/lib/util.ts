import { randomUUID } from 'node:crypto';

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Parse a stored string into a number, defaulting to 0 for blank/invalid values. */
export function parseNum(value: string | number | undefined | null): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === undefined || value === null || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function parseBool(value: string | boolean | undefined | null): boolean {
  if (typeof value === 'boolean') return value;
  if (!value) return false;
  return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
}
