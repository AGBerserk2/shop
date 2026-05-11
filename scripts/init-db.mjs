#!/usr/bin/env node
// Inicializa el schema de EverShop en una base de datos ya configurada via .env.
// Equivalente a `npm run setup` pero sin re-escribir .env y sin la guarda
// "ya estás instalado". Idempotente: las tablas usan IF NOT EXISTS y las
// migraciones rastrean la versión instalada por módulo.

import 'dotenv/config';
import { mkdir } from 'fs/promises';
import path from 'path';
import {
  commit,
  execute,
  insertOnUpdate,
  rollback,
  startTransaction
} from '@evershop/postgres-query-builder';

import { pool, getConnection } from '../packages/evershop/dist/lib/postgres/connection.js';
import { hashPassword } from '../packages/evershop/dist/lib/util/passwordHelper.js';
import { getCoreModules } from '../packages/evershop/dist/bin/lib/loadModules.js';
import { migrate } from '../packages/evershop/dist/bin/lib/bootstrap/migrate.js';
import { createMigrationTable } from '../packages/evershop/dist/bin/install/createMigrationTable.js';

const ROOT = process.cwd();

const ADMIN_FULLNAME = process.env.ADMIN_FULLNAME || 'Admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@fairways.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Fairways2026!';

console.log('→ Verificando conexión a la base de datos...');
const ping = await pool.query('select version()');
console.log(`  ✓ Conectado: ${ping.rows[0].version.split(',')[0]}`);

console.log('→ Creando carpetas locales (media/, public/)...');
await mkdir(path.resolve(ROOT, 'media'), { recursive: true });
await mkdir(path.resolve(ROOT, 'public'), { recursive: true });
console.log('  ✓ Carpetas listas');

const connection = await getConnection();
await startTransaction(connection);
try {
  console.log('→ Creando tabla migration (si no existe)...');
  await createMigrationTable(connection);

  console.log('→ Creando tabla admin_user (si no existe)...');
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "admin_user" (
      "admin_user_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "uuid" UUID NOT NULL DEFAULT gen_random_uuid (),
      "status" boolean NOT NULL DEFAULT TRUE,
      "email" varchar NOT NULL,
      "password" varchar NOT NULL,
      "full_name" varchar DEFAULT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ADMIN_USER_EMAIL_UNIQUE" UNIQUE ("email"),
      CONSTRAINT "ADMIN_USER_UUID_UNIQUE" UNIQUE ("uuid")
    );`
  );

  console.log(`→ Insertando/actualizando admin (${ADMIN_EMAIL})...`);
  await insertOnUpdate('admin_user', ['email'])
    .given({
      status: 1,
      email: ADMIN_EMAIL,
      password: hashPassword(ADMIN_PASSWORD),
      full_name: ADMIN_FULLNAME
    })
    .execute(connection);

  console.log('→ Corriendo migraciones de los módulos core...');
  const coreModules = getCoreModules();
  await migrate(coreModules, connection);

  await commit(connection);
  console.log('  ✓ Migraciones completadas');
} catch (e) {
  await rollback(connection);
  console.error('FAIL durante init:', e);
  process.exit(1);
}

const tableCount = await pool.query(
  `select count(*)::int as n from information_schema.tables where table_schema='public'`
);
console.log(`\n✓ Schema listo en Supabase. Tablas en public: ${tableCount.rows[0].n}`);
console.log('\nCredenciales del admin:');
console.log(`  email:    ${ADMIN_EMAIL}`);
console.log(`  password: ${ADMIN_PASSWORD}  ← cámbiala desde el panel cuando entres`);
console.log('\nSiguiente paso: npm run build && npm run start');

await pool.end();
process.exit(0);
