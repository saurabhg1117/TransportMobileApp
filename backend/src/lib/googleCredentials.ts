import { normalizePrivateKey } from './normalizePrivateKey.js';

export interface GoogleCredentials {
  sheetId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

/** Load Google Sheets credentials from env — supports full JSON paste for hosting dashboards. */
export function loadGoogleCredentials(env: NodeJS.ProcessEnv): GoogleCredentials {
  const sheetId = env['GOOGLE_SHEET_ID'] || '';

  const rawJson = env['GOOGLE_SERVICE_ACCOUNT_JSON']?.trim();
  if (rawJson) {
    try {
      const creds = JSON.parse(rawJson) as { client_email?: string; private_key?: string };
      return {
        sheetId,
        serviceAccountEmail: creds.client_email?.trim() || '',
        privateKey: normalizePrivateKey(creds.private_key || ''),
      };
    } catch {
      console.error('[config] GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.');
    }
  }

  return {
    sheetId,
    serviceAccountEmail: env['GOOGLE_SERVICE_ACCOUNT_EMAIL'] || '',
    privateKey: normalizePrivateKey(env['GOOGLE_PRIVATE_KEY'] || ''),
  };
}
