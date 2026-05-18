import { select } from '@evershop/postgres-query-builder';
import { provinces } from '../../../../../lib/locale/provinces.js';

// Postgres returns numeric columns as strings — coerce for GraphQL Float.
const toNumber = (v) => (v === null || v === undefined ? null : Number(v));

export default {
  Query: {
    // Customer-facing: only the customer who placed the order may track it.
    delivery: async (_, { orderUuid }, { pool, customer }) => {
      if (!orderUuid) {
        return null;
      }
      const order = await select()
        .from('order')
        .where('uuid', '=', orderUuid)
        .load(pool);
      if (!order) {
        return null;
      }
      if (!customer || order.customer_id !== customer.customer_id) {
        return null;
      }
      const row = await select()
        .from('delivery')
        .where('delivery_order_id', '=', order.order_id)
        .load(pool);
      if (!row) {
        return null;
      }
      return {
        status: row.status,
        driverName: row.driver_name,
        driverLatitude: toNumber(row.driver_latitude),
        driverLongitude: toNumber(row.driver_longitude),
        destLatitude: toNumber(row.dest_latitude),
        destLongitude: toNumber(row.dest_longitude),
        locationUpdatedAt: row.location_updated_at
          ? new Date(row.location_updated_at).toISOString()
          : null
      };
    },

    // Driver-facing: authenticated by the unguessable token in the link.
    driverDelivery: async (_, { token }, { pool }) => {
      if (!token) {
        return null;
      }
      const row = await select()
        .from('delivery')
        .where('access_token', '=', token)
        .load(pool);
      if (!row) {
        return null;
      }
      const order = await select()
        .from('order')
        .where('order_id', '=', row.delivery_order_id)
        .load(pool);
      if (!order) {
        return null;
      }
      let address = null;
      let customerPhone = null;
      if (order.shipping_address_id) {
        const addr = await select()
          .from('order_address')
          .where('order_address_id', '=', order.shipping_address_id)
          .load(pool);
        if (addr) {
          const provinceName =
            provinces.find((p) => p.code === addr.province)?.name || '';
          address = [addr.address_1, addr.address_2, addr.city, provinceName]
            .filter(Boolean)
            .join(', ');
          customerPhone = addr.telephone || null;
        }
      }
      return {
        status: row.status,
        token: row.access_token,
        orderNumber: String(order.order_number),
        customerName: order.customer_full_name || null,
        customerPhone,
        address
      };
    }
  }
};
