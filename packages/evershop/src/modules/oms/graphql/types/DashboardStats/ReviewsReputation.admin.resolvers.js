import { pool } from '../../../../../lib/postgres/connection.js';
import { buildUrl } from '../../../../../lib/router/buildUrl.js';

function parseRange(from, to) {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  let f = from ? new Date(from) : defaultFrom;
  let t = to ? new Date(to) : new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (Number.isNaN(f.getTime())) f = defaultFrom;
  if (Number.isNaN(t.getTime())) t = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return { from: f.toISOString(), to: t.toISOString() };
}

// Guard against environments where product_review hasn't been created yet
// (e.g. older DBs that didn't run migration 1.0.9).
async function tableExists(name) {
  const r = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1
     LIMIT 1`,
    [name]
  );
  return r.rows.length > 0;
}

const EMPTY_REPORT = {
  averageRating: 0,
  totalReviews: 0,
  totalApproved: 0,
  totalPending: 0,
  ratingDistribution: [0, 0, 0, 0, 0],
  reviewsInPeriod: 0,
  ordersInPeriod: 0,
  reviewRate: 0,
  topProducts: [],
  worstProducts: []
};

export default {
  Query: {
    reviewsReputation: async (_, { from, to, limit = 5 }) => {
      if (!(await tableExists('product_review'))) {
        return EMPTY_REPORT;
      }

      const range = parseRange(from, to);
      const lim = Math.max(1, Math.min(20, Number(limit) || 5));

      const [globalStats, distribution, periodReviews, periodOrders, productList] =
        await Promise.all([
          pool.query(
            `SELECT
               AVG(rating)::float                          AS avg,
               COUNT(*) FILTER (WHERE status='approved')::int AS approved,
               COUNT(*) FILTER (WHERE status='pending')::int  AS pending,
               COUNT(*)::int                               AS total
             FROM product_review`
          ),
          pool.query(
            `SELECT rating, COUNT(*)::int AS n
             FROM product_review
             WHERE status='approved'
             GROUP BY rating`
          ),
          pool.query(
            `SELECT COUNT(*)::int AS n
             FROM product_review
             WHERE created_at >= $1 AND created_at < $2`,
            [range.from, range.to]
          ),
          pool.query(
            `SELECT COUNT(*)::int AS n
             FROM "order"
             WHERE created_at >= $1 AND created_at < $2
               AND status NOT IN ('canceled', 'closed')`,
            [range.from, range.to]
          ),
          pool.query(
            `SELECT
               pr.product_id                                AS product_id,
               p.uuid                                       AS uuid,
               pd.name                                      AS name,
               p.sku                                        AS sku,
               AVG(pr.rating)::float                        AS avg_rating,
               COUNT(*)::int                                AS review_count,
               (
                 SELECT origin_image
                 FROM product_image
                 WHERE product_image_product_id = p.product_id
                 ORDER BY product_image_id ASC
                 LIMIT 1
               )                                            AS image_url
             FROM product_review pr
             JOIN product p ON p.product_id = pr.product_id
             LEFT JOIN product_description pd
               ON pd.product_description_product_id = p.product_id
             WHERE pr.status = 'approved'
             GROUP BY pr.product_id, p.uuid, pd.name, p.sku, p.product_id
             HAVING COUNT(*) >= 1
             ORDER BY avg_rating DESC, review_count DESC`
          )
        ]);

      const g = globalStats.rows[0] || {};
      const dist = [0, 0, 0, 0, 0];
      distribution.rows.forEach((r) => {
        const idx = Number(r.rating);
        if (idx >= 1 && idx <= 5) dist[idx - 1] = Number(r.n);
      });

      const totalReviews = Number(g.total || 0);
      const reviewsInPeriod = Number(periodReviews.rows[0]?.n || 0);
      const ordersInPeriod = Number(periodOrders.rows[0]?.n || 0);
      const reviewRate =
        ordersInPeriod > 0 ? (reviewsInPeriod / ordersInPeriod) * 100 : 0;

      const productsSorted = productList.rows.map((r) => ({
        productId: Number(r.product_id),
        uuid: r.uuid,
        name: r.name,
        sku: r.sku,
        averageRating: Math.round(Number(r.avg_rating) * 10) / 10,
        reviewCount: Number(r.review_count),
        imageUrl: r.image_url || null,
        editUrl: buildUrl('productEdit', { id: r.uuid })
      }));

      const topProducts = productsSorted.slice(0, lim);
      const worstProducts = [...productsSorted]
        .sort((a, b) => a.averageRating - b.averageRating || b.reviewCount - a.reviewCount)
        .slice(0, lim);

      return {
        averageRating:
          g.avg != null ? Math.round(Number(g.avg) * 10) / 10 : 0,
        totalReviews,
        totalApproved: Number(g.approved || 0),
        totalPending: Number(g.pending || 0),
        ratingDistribution: dist,
        reviewsInPeriod,
        ordersInPeriod,
        reviewRate,
        topProducts,
        worstProducts
      };
    }
  }
};
