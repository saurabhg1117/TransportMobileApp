import { normalizePrivateKey } from './normalizePrivateKey.js';
import {
  BUNDLED_GOOGLE_SHEET_ID,
  BUNDLED_GOOGLE_SERVICE_ACCOUNT_JSON_B64,
} from './bundledGoogleCredentials.js';

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

function fromBase64(rawB64: string, source: string, sheetId: string): GoogleCredentials | null {
  const parsed = parseServiceAccountJson(
    Buffer.from(rawB64, 'base64').toString('utf8'),
    source,
  );
  return parsed ? { ...parsed, sheetId } : null;
}

/** Load Google Sheets credentials from env, with bundled fallback for Belmo deploy. */
export function loadGoogleCredentials(env: NodeJS.ProcessEnv): GoogleCredentials {
  const sheetId = env['GOOGLE_SHEET_ID'] || BUNDLED_GOOGLE_SHEET_ID || '';

  const rawB64 = env['GOOGLE_SERVICE_ACCOUNT_JSON_B64']?.trim();
  if (rawB64) {
    const creds = fromBase64(rawB64, 'GOOGLE_SERVICE_ACCOUNT_JSON_B64', sheetId);
    if (creds) return creds;
  }

  const rawJson = env['GOOGLE_SERVICE_ACCOUNT_JSON']?.trim();
  if (rawJson) {
    const parsed = parseServiceAccountJson(rawJson, 'GOOGLE_SERVICE_ACCOUNT_JSON');
    if (parsed) return { ...parsed, sheetId };
  }

  const email = env['GOOGLE_SERVICE_ACCOUNT_EMAIL'] || '';
  const privateKey = normalizePrivateKey(env['GOOGLE_PRIVATE_KEY'] || '');
  if (email && privateKey) {
    return { sheetId, serviceAccountEmail: email, privateKey };
  }

  // Belmo env UI often rejects long values — use credentials bundled in the repo.
  const bundled = fromBase64(
    BUNDLED_GOOGLE_SERVICE_ACCOUNT_JSON_B64,
    'bundledGoogleCredentials',
    sheetId,
  );
  if (bundled) {
    console.log('[config] Using bundled Google service account credentials.');
    return bundled;
  }

  return { sheetId, serviceAccountEmail: '', privateKey: '' };
}
