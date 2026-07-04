import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { DataStore, StoreRow } from './DataStore.js';
import { TABLE_NAMES, TABLES, type TableName } from './schema.js';

type Db = Record<TableName, StoreRow[]>;

/**
 * Local file-backed store used automatically when Google Sheets credentials are
 * not configured. Keeps the whole dataset in a single JSON file and mirrors the
 * table/column layout of the spreadsheet so behaviour is identical.
 */
export class JsonFileStore implements DataStore {
  readonly kind = 'json-file' as const;
  private readonly filePath: string;
  private cache: Db | null = null;

  constructor(filePath: string) {
    this.filePath = path.resolve(process.cwd(), filePath);
  }

  async init(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const db = await this.load();
    // Guarantee every configured table exists.
    for (const table of TABLE_NAMES) {
      if (!Array.isArray(db[table])) db[table] = [];
    }
    await this.persist(db);
  }

  async getAll(table: TableName): Promise<StoreRow[]> {
    const db = await this.load();
    return [...(db[table] ?? [])];
  }

  async insert(table: TableName, row: StoreRow): Promise<StoreRow> {
    const db = await this.load();
    const normalized = normalizeRow(table, row);
    db[table] = [...(db[table] ?? []), normalized];
    await this.persist(db);
    return normalized;
  }

  async update(table: TableName, id: string, patch: StoreRow): Promise<StoreRow | undefined> {
    const db = await this.load();
    const rows = db[table] ?? [];
    const idx = rows.findIndex((r) => r['id'] === id);
    if (idx === -1) return undefined;
    const merged = normalizeRow(table, { ...rows[idx], ...patch, id });
    rows[idx] = merged;
    db[table] = rows;
    await this.persist(db);
    return merged;
  }

  async remove(table: TableName, id: string): Promise<boolean> {
    const db = await this.load();
    const rows = db[table] ?? [];
    const next = rows.filter((r) => r['id'] !== id);
    if (next.length === rows.length) return false;
    db[table] = next;
    await this.persist(db);
    return true;
  }

  private async load(): Promise<Db> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      this.cache = JSON.parse(raw) as Db;
    } catch {
      this.cache = {} as Db;
    }
    return this.cache;
  }

  private async persist(db: Db): Promise<void> {
    this.cache = db;
    await fs.writeFile(this.filePath, JSON.stringify(db, null, 2), 'utf8');
  }
}

/** Ensure a row only contains the columns declared for its table (order preserved). */
function normalizeRow(table: TableName, row: StoreRow): StoreRow {
  const out: StoreRow = {};
  for (const col of TABLES[table]) {
    out[col] = row[col] ?? '';
  }
  return out;
}
