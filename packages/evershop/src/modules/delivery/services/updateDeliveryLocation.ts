import { select, update } from '@evershop/postgres-query-builder';
import { pool } from '../../../lib/postgres/connection.js';

/**
 * Records the driver's latest GPS position. The first ping flips the
 * delivery from "assigned" to "en_route". Throws once delivered.
 */
export async function updateDeliveryLocation(
  token: string,
  latitude: number,
  longitude: number
) {
  const delivery = await select()
    .from('delivery')
    .where('access_token', '=', token)
    .load(pool);
  if (!delivery) {
    throw new Error('Entrega no encontrada');
  }
  if (delivery.status === 'delivered') {
    throw new Error('Esta entrega ya fue completada');
  }

  const nextStatus =
    delivery.status === 'assigned' ? 'en_route' : delivery.status;

  await update('delivery')
    .given({
      driver_latitude: latitude,
      driver_longitude: longitude,
      location_updated_at: new Date(),
      status: nextStatus,
      updated_at: new Date()
    })
    .where('delivery_id', '=', delivery.delivery_id)
    .execute(pool);

  return { ...delivery, status: nextStatus };
}
