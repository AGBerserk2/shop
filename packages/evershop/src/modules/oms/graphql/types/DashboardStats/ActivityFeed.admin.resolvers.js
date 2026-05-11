import { pool } from '../../../../../lib/postgres/connection.js';
import { buildUrl } from '../../../../../lib/router/buildUrl.js';
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

async function tableExists(name) {
  const r = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1
     LIMIT 1`,
    [name]
  );
  return r.rows.length > 0;
}

export default {
  Query: {
    activityFeed: async (_, { limit = 20 }) => {
      const lim = Math.max(1, Math.min(50, Number(limit) || 20));
      const currency = getConfig('shop.currency', 'USD');

      // Pull recent rows from a few candidate tables. We over-fetch a bit and
      // then sort + slice in JS so the feed merges chronologically without
      // a heavy single SQL UNION.
      const perTable = Math.max(5, Math.ceil(lim / 2));

      const reviewsTableExists = await tableExists('product_review');

      const [orders, customers, reviews] = await Promise.all([
        pool
          .query(
            `SELECT
               'order' AS type,
               uuid,
               order_number,
               grand_total::float AS amount,
               COALESCE(customer_full_name, customer_email, 'Invitado') AS who,
               status,
               created_at
             FROM "order"
             ORDER BY created_at DESC
             LIMIT $1`,
            [perTable]
          )
          .catch(() => ({ rows: [] })),
        pool
          .query(
            `SELECT
               'customer' AS type,
               uuid,
               COALESCE(full_name, email) AS who,
               email,
               created_at
             FROM customer
             ORDER BY created_at DESC
             LIMIT $1`,
            [perTable]
          )
          .catch(() => ({ rows: [] })),
        reviewsTableExists
          ? pool
              .query(
                `SELECT
                   'review' AS type,
                   pr.uuid,
                   pr.product_id,
                   pr.rating,
                   pr.status,
                   pr.title,
                   pr.customer_name,
                   pd.name AS product_name,
                   pr.created_at
                 FROM product_review pr
                 LEFT JOIN product_description pd
                   ON pd.product_description_product_id = pr.product_id
                 ORDER BY pr.created_at DESC
                 LIMIT $1`,
                [perTable]
              )
              .catch(() => ({ rows: [] }))
          : Promise.resolve({ rows: [] })
      ]);

      const items = [];

      orders.rows.forEach((r) => {
        items.push({
          id: `order:${r.uuid}`,
          type: 'order',
          timestamp: new Date(r.created_at).toISOString(),
          title: `Pedido #${r.order_number}`,
          subtitle: r.who,
          href: buildUrl('orderEdit', { id: r.uuid }),
          amount: format(r.amount, currency)
        });
      });

      customers.rows.forEach((r) => {
        items.push({
          id: `customer:${r.uuid}`,
          type: 'customer',
          timestamp: new Date(r.created_at).toISOString(),
          title: 'Nuevo cliente registrado',
          subtitle: r.who,
          href: buildUrl('customerEdit', { id: r.uuid }),
          amount: null
        });
      });

      reviews.rows.forEach((r) => {
        const stars = '★'.repeat(Number(r.rating || 0));
        items.push({
          id: `review:${r.uuid}`,
          type: 'review',
          timestamp: new Date(r.created_at).toISOString(),
          title: `${stars} ${r.title || 'Reseña sin título'}`,
          subtitle: `${r.customer_name || 'Anónimo'}${
            r.product_name ? ' · ' + r.product_name : ''
          }${r.status === 'pending' ? ' (pendiente)' : ''}`,
          href: '/admin/reviews?status=' + (r.status || 'pending'),
          amount: null
        });
      });

      items.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

      return {
        items: items.slice(0, lim)
      };
    }
  }
};
