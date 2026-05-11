import { Client } from 'pg';
import { getEnabledExtensions } from '../../bin/extension/index.js';
import { loadBootstrapScript } from '../../bin/lib/bootstrap/bootstrap.js';
import { getCoreModules } from '../../bin/lib/loadModules.js';
import { pool, connectionSetting } from '../../lib/postgres/connection.js';
import { debug, error } from '../log/logger.js';
import { lockHooks } from '../util/hookable.js';
import { lockRegistry } from '../util/registry.js';
import { createEventProcessor } from './EventProcessor.js';
import { EventStorage } from './EventStorage.js';
import { loadSubscribers } from './loadSubscribers.js';

const POLL_INTERVAL = 10000;

const modules = [...getCoreModules(), ...getEnabledExtensions()];
const subscribers = await loadSubscribers(modules);

const storage = new EventStorage(pool);
const { loadAndProcess } = createEventProcessor({ storage, subscribers });

const init = async () => {
  try {
    for (const module of modules) {
      await loadBootstrapScript(module, {
        ...JSON.parse(process.env.bootstrapContext || '{}'),
        process: 'event'
      });
    }
    lockHooks();
    lockRegistry();
  } catch (e) {
    error(e);
    process.exit(0);
  }
  process.env.ALLOW_CONFIG_MUTATIONS = 'false';

  // Dedicated client for LISTEN — pool connections are transient and cannot
  // maintain a persistent LISTEN registration. Connection-pooled providers like
  // Supabase Supavisor reap idle sessions, so we have to reconnect on disconnect
  // and ping periodically to stay alive.
  let listenClient: Client | null = null;
  let keepAliveInterval: NodeJS.Timeout | null = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_DELAY_MS = 30000;

  const setupListenClient = async () => {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
    if (listenClient) {
      try {
        listenClient.removeAllListeners();
        await listenClient.end().catch(() => undefined);
      } catch {
        /* ignore */
      }
    }

    listenClient = new Client(connectionSetting);

    listenClient.on('notification', () => {
      debug('Received pg_notify(new_event), waking up event processor');
      loadAndProcess().catch((e) => error(e));
    });

    listenClient.on('error', (e) => {
      error(`LISTEN client error (will reconnect): ${e?.message || e}`);
      // Schedule a reconnect; do NOT exit the process
      void reconnectListenClient();
    });

    listenClient.on('end', () => {
      debug('LISTEN client connection ended, scheduling reconnect');
      void reconnectListenClient();
    });

    await listenClient.connect();
    await listenClient.query('LISTEN new_event');
    reconnectAttempts = 0;
    debug('LISTEN client connected');

    // Keep-alive ping every 20s prevents Supavisor from reaping the session
    // as idle. Cheap query, no schema dependency.
    keepAliveInterval = setInterval(() => {
      if (!listenClient) return;
      listenClient.query('SELECT 1').catch((e) => {
        debug(`LISTEN keep-alive ping failed: ${e?.message || e}`);
      });
    }, 20000);
  };

  let reconnectScheduled = false;
  const reconnectListenClient = async () => {
    if (reconnectScheduled) return;
    reconnectScheduled = true;
    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttempts),
      MAX_RECONNECT_DELAY_MS
    );
    reconnectAttempts += 1;
    setTimeout(async () => {
      reconnectScheduled = false;
      try {
        await setupListenClient();
        // After reconnecting, drain anything we may have missed.
        await loadAndProcess();
      } catch (e) {
        error(`Failed to reconnect LISTEN client: ${e?.message || e}`);
        void reconnectListenClient();
      }
    }, delay);
  };

  await setupListenClient();

  // Fallback poll: catches events inserted before LISTEN was ready, or missed notifications
  setInterval(() => {
    loadAndProcess().catch((e) => error(e));
  }, POLL_INTERVAL);

  // Mark events stuck as 'processing' from a previous crash as 'failed'.
  // At-most-once delivery: subscribers are never called twice, failed events
  // remain visible in the table for operator inspection.
  const stuckCount = await storage.markStuckAsFailed();
  if (stuckCount > 0) {
    error(
      `Marked ${stuckCount} stuck event(s) as failed — they were interrupted by a previous crash`
    );
  }

  // Drain any events that were pending before this process started
  await loadAndProcess();
};

process.on('SIGTERM', async () => {
  debug('Event manager received SIGTERM, shutting down...');
  try {
    process.exit(0);
  } catch (err) {
    error('Error during shutdown:');
    error(err);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  debug('Event manager received SIGINT, shutting down...');
  try {
    process.exit(0);
  } catch (err) {
    error('Error during shutdown:');
    error(err);
    process.exit(1);
  }
});

init();
