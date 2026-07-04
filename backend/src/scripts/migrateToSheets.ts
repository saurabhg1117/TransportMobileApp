import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { config, useGoogleSheets } from '../config.js';
import { GoogleSheetsStore } from '../lib/store/GoogleSheetsStore.js';
import { TABLE_NAMES, TABLES, type TableName } from '../lib/store/schema.js';
import type { StoreRow } from '../lib/store/DataStore.js';

dotenv.config();

type JsonDb = Partial<Record<TableName, StoreRow[]>>;

function normalizeRow(table: TableName, row: StoreRow): StoreRow {
  const out: StoreRow = {};
  for (const col of TABLES[table]) {
    const value = row[col];
    out[col] = value === undefined || value === null ? '' : String(value);
  }
  return out;
}

function loadJsonDb(filePath: string): JsonDb {
  const raw = readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as JsonDb;
}

/**
 * Copies rows from the local JSON file into Google Sheets (skips ids already present).
 */
async function migrate(): Promise<void> {
  if (!useGoogleSheets) {
    console.error('Google Sheets is not configured. Run: npm run sheets:configure -- <key.json> <sheet-id>');
    process.exit(1);
  }

  const jsonPath = path.resolve(process.cwd(), config.dataFile);
  if (!existsSync(jsonPath)) {
    console.error(`JSON data file not found: ${jsonPath}`);
    process.exit(1);
  }

  const db = loadJsonDb(jsonPath);
  const store = new GoogleSheetsStore({
    sheetId: config.google.sheetId,
    serviceAccountEmail: config.google.serviceAccountEmail,
    privateKey: config.google.privateKey,
  });

  console.log('Connecting to Google Sheets…');
  await store.init();

  let inserted = 0;
  let skipped = 0;

  for (const table of TABLE_NAMES) {
    const sourceRows = (db[table] ?? []).map((row) => normalizeRow(table, row));
    const existing = await store.getAll(table);
    const existingIds = new Set(existing.map((row) => row['id']).filter(Boolean));

    console.log(`\n${table}: ${sourceRows.length} in JSON, ${existing.length} already in sheet`);

    for (const row of sourceRows) {
      const id = row['id'];
      if (!id) continue;
      if (existingIds.has(id)) {
        skipped += 1;
        continue;
      }
      await store.insert(table, row);
      existingIds.add(id);
      inserted += 1;
    }
  }

  console.log(`\nMigration complete. Inserted ${inserted} row(s), skipped ${skipped} duplicate(s).`);
  console.log('Restart the backend (npm run dev) — it will now read/write Google Sheets.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
