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
    couponPerformance: async (_, { from, to }) => {
      const range = parseRange(from, to);
      const currency = getConfig('shop.currency', 'USD');

      // Group orders by coupon code, sum discount + revenue. Note that
      // 'coupon' lives on the order row as a text column (the code used).
      const result = await pool.query(
        `SELECT
           o.coupon                                   AS code,
           COUNT(*)::int                              AS redemptions,
           COALESCE(SUM(o.discount_amount)::float, 0) AS total_discount,
           COALESCE(SUM(o.grand_total)::float, 0)     AS revenue
         FROM "order" o
         WHERE o.created_at >= $1 AND o.created_at < $2
           AND o.coupon IS NOT NULL AND o.coupon <> ''
           AND o.status NOT IN ('canceled', 'closed')
         GROUP BY o.coupon
         ORDER BY redemptions DESC, total_discount DESC`,
        [range.from, range.to]
      );

      // Enrich with coupon metadata.
      const codes = result.rows.map((r) => r.code);
      let meta = new Map();
      if (codes.length > 0) {
        const metaRows = await pool.query(
          `SELECT coupon, description, status, discount_type, discount_amount, free_shipping
           FROM coupon
           WHERE coupon = ANY($1::text[])`,
          [codes]
        );
        meta = new Map(metaRows.rows.map((r) => [r.coupon, r]));
      }

      let totalDiscount = 0;
      let totalRedemptions = 0;

      const coupons = result.rows.map((r) => {
        const m = meta.get(r.code) || {};
        const td = Number(r.total_discount || 0);
        const rev = Number(r.revenue || 0);
        totalDiscount += td;
        totalRedemptions += Number(r.redemptions || 0);
        return {
          code: r.code,
          description: m.description || null,
          status: m.status ? 1 : 0,
          discountType: m.discount_type || 'unknown',
          discountAmount: m.discount_amount != null ? Number(m.discount_amount) : null,
          redemptions: Number(r.redemptions || 0),
          totalDiscount: td,
          totalDiscountText: format(td, currency),
          revenue: rev,
          revenueText: format(rev, currency),
          freeShipping: Boolean(m.free_shipping)
        };
      });

      return {
        totalCoupons: coupons.length,
        totalRedemptions,
        totalDiscount,
        totalDiscountText: format(totalDiscount, currency),
        coupons
      };
    }
  }
};
