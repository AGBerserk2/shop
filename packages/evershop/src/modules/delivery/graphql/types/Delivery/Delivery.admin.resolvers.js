import { select } from '@evershop/postgres-query-builder';
import { getBaseUrl } from '../../../../../lib/util/getBaseUrl.js';

export default {
  Order: {
    delivery: async (order, _, { pool }) => {
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
        driverPhone: row.driver_phone,
        driverUrl: `${getBaseUrl()}/entrega/${row.access_token}`
      };
    }
  }
};
