import { Storage } from '@google-cloud/storage';
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
  if (!cachedStorage) {
    cachedStorage = new Storage({
      projectId: cfg.projectId,
      keyFilename: cfg.keyFilename
    });
  }
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
