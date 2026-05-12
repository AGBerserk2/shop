import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import fs from 'node:fs';
import path from 'node:path';
import { getConfig } from '../util/getConfig.js';

// Singleton initializer for the Firebase Admin SDK. We reuse the GCS
// service account file (./secrets/firebase-sa.json by default) since
// a Firebase project's service account *is* the same Google Cloud
// service account that owns the storage bucket — no extra credentials
// needed.
let cached: App | null = null;

function loadServiceAccount(): Record<string, unknown> {
  // Priority order:
  //   1) FIREBASE_SERVICE_ACCOUNT_JSON   — raw JSON inline (preferred in PaaS)
  //   2) FIREBASE_SERVICE_ACCOUNT_PATH   — absolute or cwd-relative path
  //   3) config.system.file_storage.keyFilename — reuse the GCS credentials
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  // The file_storage config is module-augmented at runtime, so call
  // getConfig with a string-typed alias to bypass the strict ConfigPath
  // union check.
  const configGet = getConfig as unknown as (path: string, fallback: unknown) => unknown;
  const configPath = configGet('system.file_storage.keyFilename', null) as
    | string
    | null;
  const candidate = envPath || configPath;
  if (!candidate) {
    throw new Error(
      'Firebase service account not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or system.file_storage.keyFilename.'
    );
  }
  const resolved = path.isAbsolute(candidate)
    ? candidate
    : path.resolve(process.cwd(), candidate);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Firebase service account file not found: ${resolved}`);
  }
  return JSON.parse(fs.readFileSync(resolved, 'utf8'));
}

export function getFirebaseAdmin(): App {
  if (cached) return cached;
  const existing = getApps();
  if (existing.length > 0) {
    cached = existing[0];
    return cached;
  }
  const serviceAccount = loadServiceAccount();
  cached = initializeApp({
    credential: cert(serviceAccount as any)
  });
  return cached;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseAdmin());
}
