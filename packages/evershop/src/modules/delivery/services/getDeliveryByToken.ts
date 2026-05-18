import { select } from '@evershop/postgres-query-builder';
import { pool } from '../../../lib/postgres/connection.js';

/** Loads a delivery by its access token. Returns null when not found. */
export async function getDeliveryByToken(token: string) {
  if (!token) {
    return null;
  }
  return select()
    .from('delivery')
    .where('access_token', '=', token)
    .load(pool);
}
