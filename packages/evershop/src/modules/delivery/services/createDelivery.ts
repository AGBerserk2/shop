import { randomBytes } from 'crypto';
import { insert, select } from '@evershop/postgres-query-builder';
import { pool } from '../../../lib/postgres/connection.js';
import { geocodeAddress } from './geocodeAddress.js';

/**
 * Assigns a driver to an order: creates the delivery row with a random
 * access token and a best-effort geocoded destination. Throws if the
 * order is missing or already has a delivery.
 */
export async function createDelivery(
  orderUuid: string,
  driverName: string,
  driverPhone: string | null
) {
  const order = await select()
    .from('order')
    .where('uuid', '=', orderUuid)
    .load(pool);
  if (!order) {
    throw new Error('Pedido no encontrado');
  }

  const existing = await select()
    .from('delivery')
    .where('delivery_order_id', '=', order.order_id)
    .load(pool);
  if (existing) {
    throw new Error('Este pedido ya tiene un repartidor asignado');
  }

  let destLatitude: number | null = null;
  let destLongitude: number | null = null;
  if (order.shipping_address_id) {
    const address = await select()
      .from('order_address')
      .where('order_address_id', '=', order.shipping_address_id)
      .load(pool);
    if (address) {
      const coords = await geocodeAddress(address);
      if (coords) {
        destLatitude = coords.lat;
        destLongitude = coords.lng;
      }
    }
  }

  const accessToken = randomBytes(24).toString('hex');

  const result = await insert('delivery')
    .given({
      delivery_order_id: order.order_id,
      driver_name: driverName,
      driver_phone: driverPhone || null,
      access_token: accessToken,
      status: 'assigned',
      dest_latitude: destLatitude,
      dest_longitude: destLongitude
    })
    .execute(pool);

  return select()
    .from('delivery')
    .where('delivery_id', '=', result.insertId)
    .load(pool);
}
