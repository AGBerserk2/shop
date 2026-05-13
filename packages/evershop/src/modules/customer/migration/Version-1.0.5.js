import { execute } from '@evershop/postgres-query-builder';

export default async (connection) => {
  // Persist the Firebase UID for each customer so we can look up a session
  // by uid (stable) or by email (changes when the user edits their account).
  await execute(
    connection,
    `ALTER TABLE customer
       ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128) UNIQUE;`
  );
  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS customer_firebase_uid_idx ON customer (firebase_uid);`
  );
};
