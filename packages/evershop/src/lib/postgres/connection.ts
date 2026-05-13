import fs from 'fs';
import { PoolClient } from '@evershop/postgres-query-builder';
import { Pool } from 'pg';
import type { PoolConfig } from 'pg';
import { getConfig } from '../util/getConfig.js';

// Use env for the database connection, maintain the backward compatibility
// Pool size capped to fit Supabase free tier session pooler (max 15 clients
// across all processes). Override with DB_POOL_MAX env var if needed.
// keepAlive + a slightly aggressive idleTimeout avoids the "Connection
// terminated unexpectedly" errors that happen when Supavisor closes idle
// connections that the pool still believes are open.
//
// IMPORTANT: Supabase free-tier session-mode pooler caps total clients at
// 15 across ALL processes hitting the project. EverShop spawns 3
// processes per app instance (main + subscriber + cron) so the default
// max here is 3 → 3*3 = 9 connections per instance, leaving headroom
// for prod + local dev running simultaneously without hitting
// EMAXCONNSESSION. Override per-process by setting DB_POOL_MAX.
const connectionSetting: PoolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT as unknown as number,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : 3,
  idleTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // Tag each connection so we can see in Supabase Dashboard which Node
  // process is holding it open (main vs subscriber vs cron).
  application_name: `anroy-${process.env.EVERSHOP_PROCESS || 'main'}-${process.pid}`
};

// Support SSL
const sslMode = process.env.DB_SSLMODE;
switch (sslMode) {
  case 'disable': {
    connectionSetting.ssl = false;
    break;
  }
  case 'require':
  case 'prefer':
  case 'verify-ca':
  case 'verify-full': {
    const ssl: PoolConfig['ssl'] = {
      rejectUnauthorized: true
    };
    const ca = process.env.DB_SSLROOTCERT;
    if (ca) {
      ssl.ca = fs.readFileSync(ca).toString();
    }
    const cert = process.env.DB_SSLCERT;
    if (cert) {
      ssl.cert = fs.readFileSync(cert).toString();
    }
    const key = process.env.DB_SSLKEY;
    if (key) {
      ssl.key = fs.readFileSync(key).toString();
    }
    connectionSetting.ssl = ssl;
    break;
  }
  case 'no-verify': {
    connectionSetting.ssl = {
      rejectUnauthorized: false
    };
    break;
  }
  default: {
    connectionSetting.ssl = false;
    break;
  }
}

// onConnect is awaited by pg before the client is handed to user code,
// unlike pool.on('connect', ...) which is not awaited (deprecated in pg@8.19.0).
// Cast needed because @types/pg doesn't yet declare onConnect in PoolConfig.
const pool = new Pool({
  ...connectionSetting,
  onConnect: async (client: import('pg').PoolClient) => {
    const timeZone = getConfig('shop.timezone', 'UTC');
    await client.query(`SET TIMEZONE TO "${timeZone}";`);
  }
} as PoolConfig);

const isStaleConnError = (err: unknown): boolean => {
  const msg = (err as Error)?.message || String(err);
  return /terminated unexpectedly|ECONNRESET|read ECONNRESET|Client has encountered a connection error|Connection terminated|connection terminated|server closed the connection/i.test(
    msg
  );
};

// Swallow idle-client errors so a remotely-closed connection (Supavisor pooler
// reaping idle sessions) does not kill the whole process. The pool transparently
// reconnects on the next checkout.
pool.on('error', (err) => {
  if (isStaleConnError(err)) return;
  // eslint-disable-next-line no-console
  console.warn('[pg-pool error]', (err as Error)?.message || err);
});

// Defense in depth: if a pending query throws because the underlying socket
// died, the rejection may surface as an uncaughtException/unhandledRejection
// before any callsite-level handler attaches. Swallow those specifically — the
// pool will hand out a fresh connection on the next checkout.
const swallowPgConnError = (
  err: unknown,
  origin: 'uncaughtException' | 'unhandledRejection'
) => {
  if (isStaleConnError(err)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[pg ${origin}] stale connection swallowed: ${(err as Error)?.message || err}`
    );
    return true;
  }
  return false;
};

if (!(globalThis as unknown as { __pgConnHandlersAttached?: boolean }).__pgConnHandlersAttached) {
  process.on('uncaughtException', (err) => {
    swallowPgConnError(err, 'uncaughtException');
    // For non-pg errors, let other listeners (e.g. EverShop's logger) handle.
  });
  process.on('unhandledRejection', (reason) => {
    swallowPgConnError(reason, 'unhandledRejection');
  });
  (globalThis as unknown as { __pgConnHandlersAttached?: boolean }).__pgConnHandlersAttached = true;
}

async function getConnection(): Promise<PoolClient> {
  return await pool.connect();
}

export { pool, getConnection, connectionSetting };
