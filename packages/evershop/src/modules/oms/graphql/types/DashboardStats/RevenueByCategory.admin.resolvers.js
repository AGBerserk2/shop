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
    revenueByCategory: async (_, { from, to, limit = 10 }) => {
      const range = parseRange(from, to);
      const currency = getConfig('shop.currency', 'USD');
      const lim = Math.max(1, Math.min(50, Number(limit) || 10));

      // Sum line totals from order_item joined through product to category.
      // We exclude canceled orders so they don't inflate the numbers.
      const result = await pool.query(
        `SELECT
           p.category_id                                   AS category_id,
           COALESCE(cd.name, '—')                          AS name,
           SUM(oi.line_total)::float                       AS revenue,
           SUM(oi.qty)::int                                AS units_sold,
           COUNT(DISTINCT o.order_id)::int                 AS order_count
         FROM order_item oi
         JOIN "order" o ON o.order_id = oi.order_item_order_id
         JOIN product p ON p.product_id = oi.product_id
         LEFT JOIN category_description cd
           ON cd.category_description_category_id = p.category_id
         WHERE o.created_at >= $1 AND o.created_at < $2
           AND o.status NOT IN ('canceled', 'closed')
         GROUP BY p.category_id, cd.name
         ORDER BY revenue DESC NULLS LAST
         LIMIT $3`,
        [range.from, range.to, lim]
      );

      const totalRow = await pool.query(
        `SELECT COALESCE(SUM(oi.line_total)::float, 0) AS total
         FROM order_item oi
         JOIN "order" o ON o.order_id = oi.order_item_order_id
         WHERE o.created_at >= $1 AND o.created_at < $2
           AND o.status NOT IN ('canceled', 'closed')`,
        [range.from, range.to]
      );
      const totalRevenue = Number(totalRow.rows[0]?.total || 0);

      const uncategorizedRow = await pool.query(
        `SELECT COALESCE(SUM(oi.line_total)::float, 0) AS total
         FROM order_item oi
         JOIN "order" o ON o.order_id = oi.order_item_order_id
         JOIN product p ON p.product_id = oi.product_id
         WHERE o.created_at >= $1 AND o.created_at < $2
           AND o.status NOT IN ('canceled', 'closed')
           AND p.category_id IS NULL`,
        [range.from, range.to]
      );
      const uncategorizedRevenue = Number(uncategorizedRow.rows[0]?.total || 0);

      const categories = result.rows.map((r) => {
        const revenue = Number(r.revenue || 0);
        return {
          categoryId: r.category_id != null ? Number(r.category_id) : null,
          name: r.name || '—',
          revenue,
          revenueText: format(revenue, currency),
          unitsSold: Number(r.units_sold || 0),
          orderCount: Number(r.order_count || 0),
          pct: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
        };
      });

      return {
        totalRevenue,
        totalRevenueText: format(totalRevenue, currency),
        categories,
        uncategorizedRevenue
      };
    }
  }
};
