import { config, useGoogleSheets, getGoogleConfigStatus } from '../../config.js';
import type { DataStore } from './DataStore.js';
import { GoogleSheetsStore } from './GoogleSheetsStore.js';
import { JsonFileStore } from './JsonFileStore.js';

let instance: DataStore | null = null;
let initPromise: Promise<DataStore> | null = null;

function create(): DataStore {
  if (useGoogleSheets) {
    return new GoogleSheetsStore({
      sheetId: config.google.sheetId,
      serviceAccountEmail: config.google.serviceAccountEmail,
      privateKey: config.google.privateKey,
    });
  }

  // Production with a sheet id configured should use Sheets, not local JSON.
  if (process.env['NODE_ENV'] === 'production' && config.google.sheetId) {
    const { missing } = getGoogleConfigStatus();
    throw new Error(
      `Google Sheets credentials incomplete. Missing: ${missing.join(', ')}. ` +
        'Add GOOGLE_SERVICE_ACCOUNT_JSON_B64 in Belmo Environment, then Redeploy.',
    );
  }

  return new JsonFileStore(config.dataFile);
}

/**
 * Returns a lazily-initialized, shared data store. Safe to call concurrently:
 * initialization runs at most once.
 */
export async function getStore(): Promise<DataStore> {
  if (instance) return instance;
  if (!initPromise) {
    const store = create();
    initPromise = store.init().then(() => {
      instance = store;
      return store;
    });
  }
  return initPromise;
}

export * from './DataStore.js';
export * from './schema.js';
