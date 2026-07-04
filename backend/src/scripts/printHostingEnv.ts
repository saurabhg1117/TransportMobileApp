import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

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

const raw = readFileSync(keyPath, 'utf8');
const key = JSON.parse(raw) as { client_email?: string; private_key?: string };

const email = key.client_email?.trim();
if (!email || !key.private_key) {
  console.error('Invalid JSON: missing client_email or private_key');
  process.exit(1);
}

const b64 = Buffer.from(raw.trim(), 'utf8').toString('base64');

console.log('\n=== Belmo Environment (copy these) ===\n');
console.log('GOOGLE_SHEET_ID=1otvWmNDE5zJCWwVN_mu9B1bNZ_sy-rCIz1NyWlbOHvk');
console.log('NODE_ENV=production');
console.log('JWT_SECRET=<paste a long random string>');
console.log('\n--- Easiest: one-line base64 (recommended) ---\n');
console.log(`GOOGLE_SERVICE_ACCOUNT_JSON_B64=${b64}`);
console.log('\nRemove GOOGLE_PRIVATE_KEY and GOOGLE_SERVICE_ACCOUNT_EMAIL if present.');
console.log('Then Save → Redeploy → open /health\n');
