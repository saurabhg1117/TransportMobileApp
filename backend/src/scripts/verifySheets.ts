import dotenv from 'dotenv';
import { config, useGoogleSheets } from '../config.js';
import { getStore } from '../lib/store/index.js';
import { TABLE_NAMES } from '../lib/store/schema.js';

dotenv.config();

/**
 * Quick connectivity check — lists row counts per table in the active store.
 */
async function verify(): Promise<void> {
  if (!useGoogleSheets) {
    console.log('Store: json-file (Google Sheets not configured)');
    console.log(`File:  ${config.dataFile}`);
    console.log('\nTo switch to Google Sheets:');
    console.log('  npm run sheets:configure -- path/to/key.json SPREADSHEET_ID');
    process.exit(0);
  }

  const store = await getStore();
  console.log(`Store: ${store.kind}`);
  console.log(`Sheet: ${config.google.sheetId}`);
  console.log(`Account: ${config.google.serviceAccountEmail}\n`);

  for (const table of TABLE_NAMES) {
    const rows = await store.getAll(table);
    console.log(`  ${table}: ${rows.length} row(s)`);
  }

  console.log('\nGoogle Sheets connection OK.');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
