import dotenv from 'dotenv';
import { loadGoogleCredentials } from './lib/googleCredentials.js';

dotenv.config();

const env = process.env;
const google = loadGoogleCredentials(env);

export const config = {
  port: Number(env['PORT'] ?? 5000),
  jwtSecret: env['JWT_SECRET'] || 'supersecret_TPSMS_2026',
  jwtExpiresIn: env['JWT_EXPIRES_IN'] || '30d',
  bcryptRounds: Number(env['BCRYPT_ROUNDS'] ?? 10),
  sessionTimeoutMinutes: Number(env['SESSION_TIMEOUT_MINUTES'] ?? 60),
  dataFile: env['DATA_FILE'] || 'data/transport-data.json',
  superAdmin: {
    name: env['SUPER_ADMIN_NAME'] || 'Super Admin',
    username: env['SUPER_ADMIN_USERNAME'] || 'admin',
    password: env['SUPER_ADMIN_PASSWORD'] || 'admin123',
  },
  /** Comma-separated allowed browser origins; empty = allow all (dev-friendly). */
  corsOrigins: (env['CORS_ORIGIN'] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  google,
} as const;

/** True when all Google Sheets credentials are present, so the Sheets store is used. */
export const useGoogleSheets = Boolean(
  config.google.sheetId && config.google.serviceAccountEmail && config.google.privateKey
);

/** Lists which Google env vars are still missing (for /health diagnostics). */
export function getGoogleConfigStatus(): { ready: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!config.google.sheetId) missing.push('GOOGLE_SHEET_ID');
  if (!config.google.serviceAccountEmail) {
    missing.push('GOOGLE_SERVICE_ACCOUNT_JSON_B64 (or GOOGLE_SERVICE_ACCOUNT_EMAIL)');
  }
  if (!config.google.privateKey) {
    missing.push('GOOGLE_SERVICE_ACCOUNT_JSON_B64 (or GOOGLE_PRIVATE_KEY)');
  }
  return { ready: missing.length === 0, missing };
}
