import {
  App,
  applicationDefault,
  cert,
  getApps,
  initializeApp
} from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import fs from 'node:fs';
import path from 'node:path';
import { getConfig } from '../util/getConfig.js';

// Singleton initializer for the Firebase Admin SDK.
//
// Credential resolution priority:
//   1) FIREBASE_SERVICE_ACCOUNT_JSON  — raw JSON inline (preferred in
//      PaaS hosts where you paste secrets as env vars)
//   2) FIREBASE_SERVICE_ACCOUNT_PATH  — absolute or cwd-relative path
//   3) GOOGLE_APPLICATION_CREDENTIALS — standard ADC path
//   4) system.file_storage.keyFilename from config (reuses GCS creds)
//   5) Application Default Credentials — picked up automatically when
//      running on Cloud Run / GCE / GKE with an attached service account
let cached: App | null = null;

function loadServiceAccountFromFile(p: string): Record<string, unknown> {
  const resolved = path.isAbsolute(p)
    ? p
    : path.resolve(process.cwd(), p);
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

  // 1) Inline JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    cached = initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
    });
    return cached;
  }

  // 2) Explicit file path
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    cached = initializeApp({
      credential: cert(
        loadServiceAccountFromFile(
          process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        ) as any
      )
    });
    return cached;
  }

  // 3) GOOGLE_APPLICATION_CREDENTIALS — applicationDefault() reads it
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    cached = initializeApp({ credential: applicationDefault() });
    return cached;
  }

  // 4) Config-driven file (reuses the GCS service account locally)
  const configGet = getConfig as unknown as (
    path: string,
    fallback: unknown
  ) => unknown;
  const configPath = configGet('system.file_storage.keyFilename', null) as
    | string
    | null;
  if (configPath) {
    try {
      cached = initializeApp({
        credential: cert(loadServiceAccountFromFile(configPath) as any)
      });
      return cached;
    } catch {
      // file missing on this host — fall through to ADC
    }
  }

  // 5) Pure ADC — works on Cloud Run, GCE, GKE, Cloud Functions, etc.
  cached = initializeApp({ credential: applicationDefault() });
  return cached;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseAdmin());
}
