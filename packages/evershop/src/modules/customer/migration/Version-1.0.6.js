import { execute } from '@evershop/postgres-query-builder';

export default async (connection) => {
  // Persist the Firebase Auth photoURL so the storefront can render a
  // real profile avatar in the header. NULL when the user signed up
  // with email/password and never set a photo.
  await execute(
    connection,
    `ALTER TABLE customer
       ADD COLUMN IF NOT EXISTS photo_url VARCHAR(1024);`
  );
};
