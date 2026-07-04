import type { PaymentSlip } from '../types';

/** Text fields that show autocomplete from earlier slips (not cargo/payment). */
export const SUGGESTION_FIELDS = [
  'truckNo',
  'grNo',
  'invoiceNo',
  'doNo',
  'consignor',
  'consignee',
  'fromLocation',
  'toLocation',
  'driverName',
  'driverAddress',
  'ownerName',
  'ownerAddress',
] as const;

export type SuggestionField = (typeof SUGGESTION_FIELDS)[number];

export type SuggestionMap = Record<SuggestionField, string[]>;

function emptyMap(): SuggestionMap {
  return {
    truckNo: [],
    grNo: [],
    invoiceNo: [],
    doNo: [],
    consignor: [],
    consignee: [],
    fromLocation: [],
    toLocation: [],
    driverName: [],
    driverAddress: [],
    ownerName: [],
    ownerAddress: [],
  };
}

/**
 * Builds per-field suggestion lists from historical slips.
 * Newest values appear first; duplicates are ignored (case-insensitive).
 */
export function buildSuggestionMap(slips: PaymentSlip[]): SuggestionMap {
  const map = emptyMap();
  const seen = Object.fromEntries(SUGGESTION_FIELDS.map((k) => [k, new Set<string>()])) as Record<
    SuggestionField,
    Set<string>
  >;

  const sorted = [...slips].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  for (const slip of sorted) {
    for (const field of SUGGESTION_FIELDS) {
      const value = String(slip[field] ?? '').trim();
      if (!value) continue;
      const key = value.toLowerCase();
      if (seen[field].has(key)) continue;
      seen[field].add(key);
      map[field].push(value);
    }
  }

  return map;
}

/** Filter suggestions for the current typed value. */
export function filterSuggestions(all: string[], query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  const pool = q ? all.filter((s) => s.toLowerCase().includes(q)) : all;
  return pool.slice(0, limit);
}
