import { pool } from '../../../../../lib/postgres/connection.js';
import { getConfig } from '../../../../../lib/util/getConfig.js';

function format(value, currency) {
  try {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  } catch {
    return `${currency || ''} ${Number(value || 0).toFixed(2)}`.trim();
  }
}

function parseRange(from, to) {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  let f = from ? new Date(from) : defaultFrom;
  let t = to ? new Date(to) : new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (Number.isNaN(f.getTime())) f = defaultFrom;
  if (Number.isNaN(t.getTime())) t = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return { from: f.toISOString(), to: t.toISOString() };
}

export default {
  Query: {
    cartConversion: async (_, { from, to }) => {
      const range = parseRange(from, to);
      const currency = getConfig('shop.currency', 'USD');

      // Each stage of the funnel.
      const [allCarts, withItems, withCheckout, orderRow, abandonedRow] = await Promise.all([
        pool.query(
          `SELECT COUNT(*)::int AS n
           FROM cart
           WHERE created_at >= $1 AND created_at < $2`,
          [range.from, range.to]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS n
           FROM cart
           WHERE created_at >= $1 AND created_at < $2
             AND total_qty > 0`,
          [range.from, range.to]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS n
           FROM cart
           WHERE created_at >= $1 AND created_at < $2
             AND total_qty > 0
             AND (shipping_address_id IS NOT NULL OR billing_address_id IS NOT NULL)`,
          [range.from, range.to]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS n
           FROM "order"
           WHERE created_at >= $1 AND created_at < $2
             AND status NOT IN ('canceled', 'closed')`,
          [range.from, range.to]
        ),
        // Abandoned cart value: carts with items + status='new' that don't have a matching order.
        pool.query(
          `SELECT COALESCE(SUM(c.grand_total)::float, 0) AS total
           FROM cart c
           WHERE c.created_at >= $1 AND c.created_at < $2
             AND c.total_qty > 0
             AND c.status = 1
             AND NOT EXISTS (
               SELECT 1 FROM "order" o WHERE o.cart_id = c.cart_id
             )`,
          [range.from, range.to]
        ).catch(() => ({ rows: [{ total: 0 }] }))
      ]);

      const carts = Number(allCarts.rows[0]?.n || 0);
      const cartsWithItems = Number(withItems.rows[0]?.n || 0);
      const cartsWithCheckout = Number(withCheckout.rows[0]?.n || 0);
      const orders = Number(orderRow.rows[0]?.n || 0);
      const abandonedCartTotal = Number(abandonedRow.rows[0]?.total || 0);

      const conversionRate =
        cartsWithItems > 0 ? (orders / cartsWithItems) * 100 : 0;
      const abandonmentRate = 100 - conversionRate;

      return {
        carts,
        cartsWithItems,
        cartsWithCheckout,
        orders,
        conversionRate,
        abandonmentRate,
        abandonedCartTotal,
        abandonedCartTotalText: format(abandonedCartTotal, currency)
      };
    }
  }
};
