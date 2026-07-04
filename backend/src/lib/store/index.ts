import { config, useGoogleSheets } from '../../config.js';
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
