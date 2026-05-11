import { pool } from '../../../../../lib/postgres/connection.js';

function parseRange(from, to) {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  let fromD = from ? new Date(from) : defaultFrom;
  let toD = to ? new Date(to) : new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (Number.isNaN(fromD.getTime())) fromD = defaultFrom;
  if (Number.isNaN(toD.getTime())) toD = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return { from: fromD.toISOString(), to: toD.toISOString() };
}

export default {
  Query: {
    ordersByStatus: async (_, { from, to }) => {
      const range = parseRange(from, to);

      // Count + avg age (hours since created_at) per status.
      const buckets = await pool.query(
        `SELECT
           COALESCE(status, 'unknown')                          AS status,
           COUNT(*)::int                                        AS count,
           AVG(EXTRACT(EPOCH FROM (now() - created_at)) / 3600)::float AS avg_age_hours
         FROM "order"
         WHERE created_at >= $1 AND created_at < $2
         GROUP BY status
         ORDER BY count DESC`,
        [range.from, range.to]
      );

      const total = buckets.rows.reduce((sum, r) => sum + Number(r.count || 0), 0);

      const rows = buckets.rows.map((r) => ({
        status: r.status,
        count: Number(r.count),
        pct: total > 0 ? (Number(r.count) / total) * 100 : 0,
        avgAgeHours: r.avg_age_hours != null ? Number(r.avg_age_hours) : null
      }));

      // Fulfillment time = first time shipment_status changed to shipped/delivered.
      // We don't track that explicitly, so approximate with updated_at - created_at
      // for orders whose current shipment_status is shipped or delivered.
      const fulfill = await pool.query(
        `SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)::float AS days
         FROM "order"
         WHERE created_at >= $1 AND created_at < $2
           AND shipment_status IN ('shipped', 'delivered')`,
        [range.from, range.to]
      );

      // Time to complete = updated_at - created_at for completed orders.
      const complete = await pool.query(
        `SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)::float AS days
         FROM "order"
         WHERE created_at >= $1 AND created_at < $2
           AND status IN ('completed', 'closed')`,
        [range.from, range.to]
      );

      return {
        total,
        buckets: rows,
        averageDaysToFulfill: fulfill.rows[0]?.days != null ? Number(fulfill.rows[0].days) : null,
        averageDaysToComplete: complete.rows[0]?.days != null ? Number(complete.rows[0].days) : null
      };
    }
  }
};
