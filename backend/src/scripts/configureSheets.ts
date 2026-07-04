import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Writes Google Sheets credentials into backend/.env from a downloaded
 * service-account JSON key file.
 *
 * Usage:
 *   npm run sheets:configure -- path/to/service-account.json SPREADSHEET_ID
 */
function usage(): never {
  console.log(`
Configure Google Sheets in .env

Steps:
  1. Google Cloud Console -> APIs & Services -> Enable "Google Sheets API"
  2. IAM -> Service Accounts -> Create -> Keys -> Add key -> JSON (download)
  3. Google Sheets -> Create spreadsheet -> Share with service account email (Editor)
  4. Copy the spreadsheet id from its URL:
     https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit

Then run:
  npm run sheets:configure -- path/to/key.json <SPREADSHEET_ID>
`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2) usage();

const keyPath = path.resolve(args[0]!);
const sheetId = args[1]!.trim();
if (!existsSync(keyPath)) {
  console.error(`Key file not found: ${keyPath}`);
  process.exit(1);
}
if (!sheetId) {
  console.error('Spreadsheet id is required.');
  process.exit(1);
}

interface ServiceAccountKey {
  client_email?: string;
  private_key?: string;
}

const key = JSON.parse(readFileSync(keyPath, 'utf8')) as ServiceAccountKey;
const email = key.client_email?.trim();
const privateKey = key.private_key?.trim();
if (!email || !privateKey) {
  console.error('Invalid service account JSON: missing client_email or private_key.');
  process.exit(1);
}

const envPath = path.resolve(process.cwd(), '.env');
if (!existsSync(envPath)) {
  console.error('.env not found. Copy .env.example to .env first.');
  process.exit(1);
}

const envKey = privateKey.replace(/\n/g, '\\n');
const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);

function setEnvVar(name: string, value: string): void {
  const idx = lines.findIndex((line) => line.startsWith(`${name}=`));
  const entry = `${name}=${value}`;
  if (idx >= 0) lines[idx] = entry;
  else lines.push(entry);
}

setEnvVar('GOOGLE_SHEET_ID', sheetId);
setEnvVar('GOOGLE_SERVICE_ACCOUNT_EMAIL', email);
setEnvVar('GOOGLE_PRIVATE_KEY', `"${envKey}"`);

writeFileSync(envPath, `${lines.join('\n').replace(/\n*$/, '')}\n`, 'utf8');

console.log('Google Sheets configured in .env');
console.log(`  Sheet id:  ${sheetId}`);
console.log(`  Account:   ${email}`);
console.log('');
console.log('Next steps:');
console.log('  1. Confirm the spreadsheet is shared with the service account (Editor).');
console.log('  2. npm run sheets:migrate   # copy existing JSON data into the sheet');
console.log('  3. npm run seed             # ensure admin + settings exist');
console.log('  4. npm run dev              # restart the API (uses Google Sheets now)');
