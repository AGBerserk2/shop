import { addProcessor } from '../../lib/util/registry.js';
import {
  getBucket,
  getGcsConfig,
  toObjectPath,
  toPublicUrl
} from './services/gcsClient.js';

interface UploadedFile {
  name: string;
  mimetype: string;
  size: number;
  url: string;
}

interface MulterFile {
  filename: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const gcsUploader = {
  upload: async (
    files: MulterFile[],
    destinationPath: string
  ): Promise<UploadedFile[]> => {
    const cfg = getGcsConfig();
    if (!cfg) {
      throw new Error('GCS is not configured');
    }
    const bucket = getBucket(cfg);
    return Promise.all(
      files.map(async (file) => {
        const objectPath = toObjectPath(destinationPath, file.filename);
        const gcsFile = bucket.file(objectPath);
        await gcsFile.save(file.buffer, {
          contentType: file.mimetype,
          resumable: false,
          metadata: { cacheControl: 'public, max-age=31536000' }
        });
        return {
          name: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          url: toPublicUrl(cfg, objectPath)
        };
      })
    );
  }
};

const gcsDeleter = {
  delete: async (objectPath: string): Promise<void> => {
    const cfg = getGcsConfig();
    if (!cfg) {
      throw new Error('GCS is not configured');
    }
    const clean = objectPath.replace(/^\/+/, '');
    await getBucket(cfg).file(clean).delete({ ignoreNotFound: true });
  }
};

const gcsFolderCreator = {
  create: async (destinationPath: string): Promise<string> => {
    const cfg = getGcsConfig();
    if (!cfg) {
      throw new Error('GCS is not configured');
    }
    const clean = destinationPath.replace(/^\/+|\/+$/g, '');
    if (!clean) {
      return destinationPath;
    }
    await getBucket(cfg)
      .file(`${clean}/.keep`)
      .save(Buffer.alloc(0), { resumable: false });
    return destinationPath;
  }
};

const gcsBrowser = {
  list: async (
    prefixPath: string
  ): Promise<{ files: { name: string; url: string }[]; folders: string[] }> => {
    const cfg = getGcsConfig();
    if (!cfg) {
      throw new Error('GCS is not configured');
    }
    const prefix = prefixPath.replace(/^\/+/, '').replace(/\/*$/, '/');
    const normalizedPrefix = prefix === '/' ? '' : prefix;
    const [files, , apiResponse] = await getBucket(cfg).getFiles({
      prefix: normalizedPrefix,
      delimiter: '/',
      autoPaginate: false
    } as never);
    const folderPrefixes: string[] =
      (apiResponse as { prefixes?: string[] })?.prefixes || [];
    const folders = folderPrefixes
      .map((p) => p.slice(normalizedPrefix.length).replace(/\/$/, ''))
      .filter(Boolean);
    const fileEntries = files
      .filter((f) => !f.name.endsWith('/.keep'))
      .filter((f) => f.name !== normalizedPrefix)
      .map((f) => ({
        name: f.name.slice(normalizedPrefix.length),
        url: toPublicUrl(cfg, f.name)
      }))
      .filter((entry) => entry.name && !entry.name.includes('/'));
    return { files: fileEntries, folders };
  }
};

export default () => {
  const cfg = getGcsConfig();
  if (!cfg) {
    return;
  }
  addProcessor('fileUploader', () => gcsUploader, 5);
  addProcessor('fileDeleter', () => gcsDeleter, 5);
  addProcessor('folderCreator', () => gcsFolderCreator, 5);
  addProcessor('fileBrowser', () => gcsBrowser, 5);
};
