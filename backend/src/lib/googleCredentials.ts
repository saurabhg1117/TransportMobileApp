import { normalizePrivateKey } from './normalizePrivateKey.js';

export interface GoogleCredentials {
  sheetId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

function parseServiceAccountJson(rawJson: string, source: string): GoogleCredentials | null {
  try {
    const creds = JSON.parse(rawJson) as { client_email?: string; private_key?: string };
    return {
      sheetId: '',
      serviceAccountEmail: creds.client_email?.trim() || '',
      privateKey: normalizePrivateKey(creds.private_key || ''),
    };
  } catch {
    console.error(`[config] ${source} is not valid JSON.`);
    return null;
  }
}

/** Load Google Sheets credentials from env — supports full JSON paste for hosting dashboards. */
export function loadGoogleCredentials(env: NodeJS.ProcessEnv): GoogleCredentials {
  const sheetId = env['GOOGLE_SHEET_ID'] || '';

  const rawB64 = env['GOOGLE_SERVICE_ACCOUNT_JSON_B64']?.trim();
  if (rawB64) {
    const parsed = parseServiceAccountJson(
      Buffer.from(rawB64, 'base64').toString('utf8'),
      'GOOGLE_SERVICE_ACCOUNT_JSON_B64',
    );
    if (parsed) return { ...parsed, sheetId };
  }

  const rawJson = env['GOOGLE_SERVICE_ACCOUNT_JSON']?.trim();
  if (rawJson) {
    const parsed = parseServiceAccountJson(rawJson, 'GOOGLE_SERVICE_ACCOUNT_JSON');
    if (parsed) return { ...parsed, sheetId };
  }

  return {
    sheetId,
    serviceAccountEmail: env['GOOGLE_SERVICE_ACCOUNT_EMAIL'] || '',
    privateKey: normalizePrivateKey(env['GOOGLE_PRIVATE_KEY'] || ''),
  };
}
