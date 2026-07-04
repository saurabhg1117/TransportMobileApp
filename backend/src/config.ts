import dotenv from 'dotenv';

dotenv.config();

const env = process.env;

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
  google: {
    sheetId: env['GOOGLE_SHEET_ID'] || '',
    serviceAccountEmail: env['GOOGLE_SERVICE_ACCOUNT_EMAIL'] || '',
    // Private keys pasted into .env keep their newlines escaped as literal "\n".
    privateKey: (env['GOOGLE_PRIVATE_KEY'] || '').replace(/\\n/g, '\n'),
  },
} as const;

/** True when all Google Sheets credentials are present, so the Sheets store is used. */
export const useGoogleSheets = Boolean(
  config.google.sheetId && config.google.serviceAccountEmail && config.google.privateKey
);
