import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { normalizePrivateKey } from '../lib/normalizePrivateKey.js';

/**
 * Prints Belmo-ready env values from a service-account JSON file.
 * Usage: npx tsx src/scripts/printHostingEnv.ts path/to/key.json
 */
const keyPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(process.env['USERPROFILE'] ?? '', 'Downloads/tpsms-501417-02833c979652.json');

if (!existsSync(keyPath)) {
  console.error(`Key file not found: ${keyPath}`);
  process.exit(1);
}

const key = JSON.parse(readFileSync(keyPath, 'utf8')) as {
  client_email?: string;
  private_key?: string;
};

const email = key.client_email?.trim();
const privateKey = normalizePrivateKey(key.private_key ?? '');

if (!email || !privateKey) {
  console.error('Invalid JSON: missing client_email or private_key');
  process.exit(1);
}

console.log('\nCopy these into Belmo → Environment:\n');
console.log(`GOOGLE_SERVICE_ACCOUNT_EMAIL=${email}`);
console.log('GOOGLE_PRIVATE_KEY=');
console.log(privateKey);
console.log('\nTip: paste GOOGLE_PRIVATE_KEY as multiple lines (BEGIN ... END).');
console.log('Do NOT wrap in extra quotes. Then click Redeploy.\n');
