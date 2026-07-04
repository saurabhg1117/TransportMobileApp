/**
 * Normalizes a Google service-account private key from hosting env vars.
 * Hosting UIs often mangle PEM formatting (quotes, escaped newlines, single-line paste).
 */
export function normalizePrivateKey(raw: string): string {
  if (!raw) return '';

  let key = raw.trim();

  // Strip accidental wrapping quotes from dashboard paste.
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  // Convert literal "\n" sequences to real newlines (handle double-escaping from hosts).
  while (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n');
  }

  // Single-line PEM pasted without newlines.
  if (!key.includes('\n') && key.includes('-----BEGIN PRIVATE KEY-----')) {
    key = key
      .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
      .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
  }

  return key;
}
