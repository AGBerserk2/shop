import { execute } from '@evershop/postgres-query-builder';

export default async (connection) => {
  // Track which customers signed up via Google so the password column can
  // safely store a random unusable hash for those accounts.
  await execute(
    connection,
    `ALTER TABLE customer
       ADD COLUMN IF NOT EXISTS is_google_login BOOLEAN NOT NULL DEFAULT FALSE;`
  );
};
