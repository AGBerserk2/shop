import { error } from '../log/logger.js';

/**
 * In-memory, per-process catalog cache.
 *
 * Each EverShop process keeps its own cache (no Redis, no shared store).
 * Entries carry tags so an admin edit can invalidate exactly the affected
 * data via event subscribers. A TTL acts as a safety net so the rare
 * multi-instance staleness window self-heals.
 */

interface CacheEntry {
  value: unknown;
  expiresAt: number;
  tags: string[];
}

const DEFAULT_TTL_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 500;

const store = new Map<string, CacheEntry>();

// Enabled in production by default; off elsewhere so local dev never
// serves stale data. CACHE_ENABLED ('true'/'false') overrides either way.
function cacheEnabled(): boolean {
  const flag = process.env.CACHE_ENABLED;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

// Map preserves insertion order, so the first key is the oldest — a
// cheap FIFO eviction that keeps memory bounded.
function evictIfNeeded(): void {
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

/**
 * Get-or-compute. Returns the cached value when fresh; otherwise runs
 * `fn`, stores its result and returns it. A cache failure never reaches
 * the caller — it falls through to `fn`.
 */
export async function withCache<T>(
  key: string,
  options: { ttl?: number; tags?: string[] | ((value: T) => string[]) },
  fn: () => Promise<T>
): Promise<T> {
  if (!cacheEnabled()) {
    return fn();
  }

  try {
    const hit = store.get(key);
    if (hit) {
      if (hit.expiresAt > Date.now()) {
        return hit.value as T;
      }
      store.delete(key);
    }
  } catch (e) {
    error(e);
  }

  const value = await fn();

  try {
    const tags =
      typeof options.tags === 'function'
        ? options.tags(value)
        : options.tags || [];
    store.set(key, {
      value,
      expiresAt: Date.now() + (options.ttl ?? DEFAULT_TTL_MS),
      tags
    });
    evictIfNeeded();
  } catch (e) {
    error(e);
  }

  return value;
}

/** Drop every cache entry carrying any of the given tags. */
export function invalidateTags(tags: string[]): void {
  if (!tags || tags.length === 0) {
    return;
  }
  try {
    const wanted = new Set(tags);
    for (const [key, entry] of store) {
      if (entry.tags.some((t) => wanted.has(t))) {
        store.delete(key);
      }
    }
  } catch (e) {
    error(e);
  }
}

/** Empty the whole cache. */
export function clearCache(): void {
  store.clear();
}

/** Current number of entries — for tests and diagnostics. */
export function cacheSize(): number {
  return store.size;
}
