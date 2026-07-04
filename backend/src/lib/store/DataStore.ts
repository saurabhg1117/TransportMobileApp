import type { TableName } from './schema.js';

/**
 * A single record. Because the underlying store may be a spreadsheet, every
 * value is persisted as a string; repositories are responsible for converting
 * to/from richer types (numbers, enums, etc.).
 */
export type StoreRow = Record<string, string>;

/**
 * Minimal table-oriented persistence contract. Both the Google Sheets store and
 * the local JSON fallback implement this so the rest of the app is storage
 * agnostic. Every table is expected to have a unique `id` column.
 */
export interface DataStore {
  /** Ensure the backing store exists and every table has its header row. */
  init(): Promise<void>;

  /** Human-readable name of the active backend, used for logging/health checks. */
  readonly kind: 'google-sheets' | 'json-file';

  getAll(table: TableName): Promise<StoreRow[]>;
  insert(table: TableName, row: StoreRow): Promise<StoreRow>;
  update(table: TableName, id: string, patch: StoreRow): Promise<StoreRow | undefined>;
  remove(table: TableName, id: string): Promise<boolean>;
}

/** Shared helpers built on top of the primitive operations. */
export async function findById(
  store: DataStore,
  table: TableName,
  id: string,
): Promise<StoreRow | undefined> {
  const rows = await store.getAll(table);
  return rows.find((r) => r['id'] === id);
}

export async function findOne(
  store: DataStore,
  table: TableName,
  predicate: (row: StoreRow) => boolean,
): Promise<StoreRow | undefined> {
  const rows = await store.getAll(table);
  return rows.find(predicate);
}

export async function filter(
  store: DataStore,
  table: TableName,
  predicate: (row: StoreRow) => boolean,
): Promise<StoreRow[]> {
  const rows = await store.getAll(table);
  return rows.filter(predicate);
}
