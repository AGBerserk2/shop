import { Storage, StorageOptions } from '@google-cloud/storage';
import fs from 'node:fs';
import path from 'node:path';
import { getConfig } from '../../../lib/util/getConfig.js';

export interface GcsConfig {
  driver: 'gcs';
  bucket: string;
  projectId?: string;
  keyFilename?: string;
  publicHost?: string;
}

let cachedStorage: Storage | undefined;

export const getGcsConfig = (): GcsConfig | undefined => {
  const cfg = getConfig('system.file_storage') as GcsConfig | undefined;
  if (!cfg || cfg.driver !== 'gcs' || !cfg.bucket) {
    return undefined;
  }
  return cfg;
};

export const getStorage = (cfg: GcsConfig): Storage => {
  if (cachedStorage) return cachedStorage;
  const opts: StorageOptions = {};
  if (cfg.projectId) opts.projectId = cfg.projectId;
  // Only set keyFilename when the file actually exists on disk. On
  // Cloud Run there is no service-account file — Application Default
  // Credentials kick in automatically through the service account
  // attached to the running revision.
  if (cfg.keyFilename) {
    const resolved = path.isAbsolute(cfg.keyFilename)
      ? cfg.keyFilename
      : path.resolve(process.cwd(), cfg.keyFilename);
    if (fs.existsSync(resolved)) {
      opts.keyFilename = resolved;
    }
  }
  cachedStorage = new Storage(opts);
  return cachedStorage;
};

export const getBucket = (cfg: GcsConfig) => getStorage(cfg).bucket(cfg.bucket);

export const toPublicUrl = (cfg: GcsConfig, objectPath: string): string => {
  const host = cfg.publicHost || `https://storage.googleapis.com/${cfg.bucket}`;
  const clean = objectPath.replace(/^\/+/, '');
  return `${host.replace(/\/+$/, '')}/${clean}`;
};

export const toObjectPath = (destinationPath: string, filename: string) => {
  const parts = [destinationPath, filename]
    .filter(Boolean)
    .map((p) => p.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean);
  return parts.join('/');
};
