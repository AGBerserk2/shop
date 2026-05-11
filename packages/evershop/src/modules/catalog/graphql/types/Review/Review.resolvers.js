import { execute, select } from '@evershop/postgres-query-builder';
import { buildUrl } from '../../../../../lib/router/buildUrl.js';

// Cache aggregates per-request via a DataLoader-lite map on the context.pool
// scope. We just compute on demand — for small catalogs this is fine.
async function getSummary(productId, pool) {
  const { rows } = await pool.query(`SELECT
       COALESCE(AVG(rating)::float, 0) AS avg,
       COUNT(*)::int AS count,
       COALESCE(SUM(CASE WHEN rating=1 THEN 1 ELSE 0 END)::int, 0) AS r1,
       COALESCE(SUM(CASE WHEN rating=2 THEN 1 ELSE 0 END)::int, 0) AS r2,
       COALESCE(SUM(CASE WHEN rating=3 THEN 1 ELSE 0 END)::int, 0) AS r3,
       COALESCE(SUM(CASE WHEN rating=4 THEN 1 ELSE 0 END)::int, 0) AS r4,
       COALESCE(SUM(CASE WHEN rating=5 THEN 1 ELSE 0 END)::int, 0) AS r5
     FROM product_review
     WHERE product_id = $1 AND status = 'approved'`,
    [productId]
  );
  const row = rows[0] || { avg: 0, count: 0, r1: 0, r2: 0, r3: 0, r4: 0, r5: 0 };
  return {
    averageRating: Math.round(Number(row.avg) * 10) / 10,
    reviewCount: row.count,
    ratingDistribution: [row.r1, row.r2, row.r3, row.r4, row.r5]
  };
}

export default {
  Product: {
    averageRating: async (product, _, { pool }) => {
      const s = await getSummary(product.product_id, pool);
      return s.averageRating;
    },
    reviewCount: async (product, _, { pool }) => {
      const s = await getSummary(product.product_id, pool);
      return s.reviewCount;
    },
    reviewSummary: async (product, _, { pool }) => {
      return getSummary(product.product_id, pool);
    },
    reviews: async (product, { limit = 20, offset = 0 }, { pool }) => {
      const q = select().from('product_review');
      q.where('product_id', '=', product.product_id);
      q.andWhere('status', '=', 'approved');
      q.orderBy('created_at', 'DESC');
      q.limit(offset, limit);
      const reviews = await q.execute(pool);
      return reviews;
    },
    canCurrentCustomerReview: async (product, _, { pool, customer }) => {
      if (!customer || !customer.customer_id) return false;
      // Has customer purchased this product in a completed order?
      const purchased = await pool.query(`SELECT 1 FROM "order_item" oi
         JOIN "order" o ON o.order_id = oi.order_item_order_id
         WHERE oi.product_id = $1
           AND o.customer_id = $2
           AND o.status IN ('completed', 'closed', 'processing')
         LIMIT 1`,
        [product.product_id, customer.customer_id]
      );
      if (purchased.rows.length === 0) return false;
      // Already left a review?
      const eq = select().from('product_review');
      eq.where('product_id', '=', product.product_id);
      eq.andWhere('customer_id', '=', customer.customer_id);
      const existing = await eq.load(pool);
      return !existing;
    }
  },
  Review: {
    reviewId: (r) => r.product_review_id,
    productId: (r) => r.product_id,
    customerId: (r) => r.customer_id,
    orderId: (r) => r.order_id,
    customerName: (r) => r.customer_name,
    customerEmail: (r) => r.customer_email,
    createdAt: (r) => (r.created_at ? new Date(r.created_at).toISOString() : null),
    updatedAt: (r) => (r.updated_at ? new Date(r.updated_at).toISOString() : null),
    product: async (review, _, { pool }) => {
      return select()
        .from('product')
        .where('product_id', '=', review.product_id)
        .load(pool);
    },
    editUrl: (r) => buildUrl('reviewEdit', { id: r.uuid }),
    approveUrl: (r) => buildUrl('reviewApprove', { id: r.uuid }),
    rejectUrl: (r) => buildUrl('reviewReject', { id: r.uuid }),
    deleteUrl: (r) => buildUrl('reviewDelete', { id: r.uuid })
  },
  Query: {
    review: async (_, { id, uuid }, { pool }) => {
      let q = select().from('product_review');
      if (uuid) q = q.where('uuid', '=', uuid);
      else if (id) q = q.where('product_review_id', '=', id);
      else return null;
      return q.load(pool);
    },
    reviews: async (_, { filters = [] }, { pool }) => {
      const q = select().from('product_review');
      const cq = select().from('product_review');
      cq.select('COUNT(product_review.product_review_id)', 'total');
      const currentFilters = [];
      let page = 1;
      let limit = 20;

      for (const f of filters || []) {
        if (f.key === 'status' && f.value) {
          q.andWhere('status', '=', f.value);
          cq.andWhere('status', '=', f.value);
          currentFilters.push({ key: 'status', operation: 'eq', value: f.value });
        } else if (f.key === 'productId' && f.value) {
          q.andWhere('product_id', '=', Number(f.value));
          cq.andWhere('product_id', '=', Number(f.value));
          currentFilters.push({ key: 'productId', operation: 'eq', value: f.value });
        } else if (f.key === 'rating' && f.value) {
          q.andWhere('rating', '=', Number(f.value));
          cq.andWhere('rating', '=', Number(f.value));
          currentFilters.push({ key: 'rating', operation: 'eq', value: f.value });
        } else if (f.key === 'page' && f.value) {
          page = Math.max(1, Number(f.value));
        } else if (f.key === 'limit' && f.value) {
          limit = Math.min(100, Math.max(1, Number(f.value)));
        }
      }

      const offset = (page - 1) * limit;
      q.orderBy('created_at', 'DESC');
      q.limit(offset, limit);

      const items = await q.execute(pool);
      const totalRow = await cq.load(pool);

      return {
        items,
        currentPage: page,
        total: Number(totalRow?.total || 0),
        currentFilters
      };
    }
  }
};
