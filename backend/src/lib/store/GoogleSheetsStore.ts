import { GoogleSpreadsheet, type GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import type { DataStore, StoreRow } from './DataStore.js';
import { TABLE_NAMES, TABLES, type TableName } from './schema.js';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export interface GoogleSheetsConfig {
  sheetId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

/**
 * Google Sheets backed store. Each table is a worksheet (tab) whose first row is
 * the header. Rows are addressed by their `id` column. Reads pull the whole tab
 * (fine for the scale this system targets) and rely on repositories to filter.
 */
export class GoogleSheetsStore implements DataStore {
  readonly kind = 'google-sheets' as const;
  private readonly doc: GoogleSpreadsheet;
  private loaded = false;

  constructor(cfg: GoogleSheetsConfig) {
    const auth = new JWT({
      email: cfg.serviceAccountEmail,
      key: cfg.privateKey,
      scopes: SCOPES,
    });
    this.doc = new GoogleSpreadsheet(cfg.sheetId, auth);
  }

  async init(): Promise<void> {
    await this.load();
    for (const table of TABLE_NAMES) {
      const headers = [...TABLES[table]];
      const minColumns = headers.length;
      let sheet = this.doc.sheetsByTitle[table];
      if (!sheet) {
        sheet = await this.doc.addSheet({
          title: table,
          gridProperties: { columnCount: minColumns, rowCount: 1000 },
          headerValues: headers,
        });
      } else {
        if (sheet.columnCount < minColumns) {
          await sheet.resize({ columnCount: minColumns, rowCount: Math.max(sheet.rowCount, 1000) });
        }
        await sheet.loadHeaderRow().catch(async () => {
          await sheet!.setHeaderRow(headers);
        });
        if (!sheet.headerValues || sheet.headerValues.length === 0) {
          await sheet.setHeaderRow(headers);
        }
      }
    }
  }

  async getAll(table: TableName): Promise<StoreRow[]> {
    const sheet = await this.sheet(table);
    const rows = await sheet.getRows();
    return rows.map((row) => this.toStoreRow(table, row.toObject()));
  }

  async insert(table: TableName, row: StoreRow): Promise<StoreRow> {
    const sheet = await this.sheet(table);
    const normalized = this.toStoreRow(table, row);
    await sheet.addRow(normalized);
    return normalized;
  }

  async update(table: TableName, id: string, patch: StoreRow): Promise<StoreRow | undefined> {
    const sheet = await this.sheet(table);
    const rows = await sheet.getRows();
    const target = rows.find((r) => r.get('id') === id);
    if (!target) return undefined;
    const merged = this.toStoreRow(table, { ...target.toObject(), ...patch, id });
    for (const col of TABLES[table]) {
      target.set(col, merged[col] ?? '');
    }
    await target.save();
    return merged;
  }

  async remove(table: TableName, id: string): Promise<boolean> {
    const sheet = await this.sheet(table);
    const rows = await sheet.getRows();
    const target = rows.find((r) => r.get('id') === id);
    if (!target) return false;
    await target.delete();
    return true;
  }

  private async load(): Promise<void> {
    if (!this.loaded) {
      await this.doc.loadInfo();
      this.loaded = true;
    }
  }

  private async sheet(table: TableName): Promise<GoogleSpreadsheetWorksheet> {
    await this.load();
    const sheet = this.doc.sheetsByTitle[table];
    if (!sheet) {
      throw new Error(`Sheet "${table}" not found. Run the seed/init step first.`);
    }
    return sheet;
  }

  private toStoreRow(table: TableName, obj: Record<string, unknown>): StoreRow {
    const out: StoreRow = {};
    for (const col of TABLES[table]) {
      const value = obj[col];
      out[col] = value === undefined || value === null ? '' : String(value);
    }
    return out;
  }
}
