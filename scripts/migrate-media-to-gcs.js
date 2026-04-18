#!/usr/bin/env node
import { readdir, stat } from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { Storage } from '@google-cloud/storage';

const {
  GCS_BUCKET,
  GCS_PROJECT_ID,
  GCS_KEY_FILE,
  MEDIA_DIR = path.resolve(process.cwd(), 'media')
} = process.env;

if (!GCS_BUCKET) {
  console.error('Missing GCS_BUCKET env var');
  process.exit(1);
}

const storage = new Storage({
  projectId: GCS_PROJECT_ID,
  keyFilename: GCS_KEY_FILE
});
const bucket = storage.bucket(GCS_BUCKET);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

const root = path.resolve(MEDIA_DIR);
let count = 0;
let bytes = 0;

for await (const file of walk(root)) {
  const objectPath = path.relative(root, file).split(path.sep).join('/');
  const info = await stat(file);
  process.stdout.write(`→ ${objectPath} (${info.size} B) ... `);
  await new Promise((resolve, reject) => {
    createReadStream(file)
      .pipe(
        bucket.file(objectPath).createWriteStream({
          resumable: false,
          metadata: { cacheControl: 'public, max-age=31536000' }
        })
      )
      .on('finish', resolve)
      .on('error', reject);
  });
  count++;
  bytes += info.size;
  process.stdout.write('ok\n');
}

console.log(`\nDone. Uploaded ${count} files (${(bytes / 1024 / 1024).toFixed(2)} MB) to gs://${GCS_BUCKET}`);
