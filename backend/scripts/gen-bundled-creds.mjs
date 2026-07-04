import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keyPath =
  process.argv[2] ||
  path.resolve(process.env.USERPROFILE ?? '', 'Downloads/tpsms-501417-02833c979652.json');

const raw = readFileSync(keyPath, 'utf8').trim();
const b64 = Buffer.from(raw).toString('base64');
const out = path.resolve(__dirname, '../src/lib/bundledGoogleCredentials.ts');

writeFileSync(
  out,
  `/** Auto-bundled Google credentials for Belmo (env UI cannot hold long values). Rotate key in GCP after go-live. */
export const BUNDLED_GOOGLE_SHEET_ID = '1otvWmNDE5zJCWwVN_mu9B1bNZ_sy-rCIz1NyWlbOHvk';
export const BUNDLED_GOOGLE_SERVICE_ACCOUNT_JSON_B64 = '${b64}';
`,
  'utf8',
);

console.log('Wrote', out);
