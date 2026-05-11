import { pool } from '../../../../../lib/postgres/connection.js';
import { buildUrl } from '../../../../../lib/router/buildUrl.js';

async function listByQty(productPool, comparator, threshold, limit) {
  // Join product_inventory → product → product_description → product_image.
  // Order ascending by qty so the most urgent (negatives first) show up top.
  const r = await productPool.query(
    `SELECT
       pi.product_inventory_product_id AS product_id,
       p.uuid                          AS uuid,
       pd.name                         AS name,
       p.sku                           AS sku,
       pi.qty                          AS qty,
       (
         SELECT origin_image
         FROM product_image
         WHERE product_image_product_id = p.product_id
         ORDER BY product_image_id ASC
         LIMIT 1
       ) AS image_url
     FROM product_inventory pi
     JOIN product p ON p.product_id = pi.product_inventory_product_id
     LEFT JOIN product_description pd
       ON pd.product_description_product_id = p.product_id
     WHERE pi.manage_stock = true
       AND pi.qty ${comparator} $1
     ORDER BY pi.qty ASC, p.product_id DESC
     LIMIT $2`,
    [threshold, limit]
  );
  return r.rows.map((row) => ({
    productId: Number(row.product_id),
    uuid: row.uuid,
    name: row.name,
    sku: row.sku,
    qty: Number(row.qty),
    imageUrl: row.image_url,
    editUrl: buildUrl('productEdit', { id: row.uuid })
  }));
}

async function countByQty(comparator, threshold) {
  const r = await pool.query(
    `SELECT COUNT(*)::int AS n
     FROM product_inventory
     WHERE manage_stock = true
       AND qty ${comparator} $1`,
    [threshold]
  );
  return Number(r.rows[0]?.n || 0);
}

export default {
  Query: {
    inventoryHealth: async (_, { threshold = 5, limit = 10 }) => {
      const t = Math.max(0, Number(threshold) || 5);
      const l = Math.max(1, Math.min(50, Number(limit) || 10));
      const [outOfStock, lowStock, outTotal, lowTotal] = await Promise.all([
        listByQty(pool, '<=', 0, l),
        // low stock = (0, threshold]; we do that with two separate predicates
        pool.query(
          `SELECT
             pi.product_inventory_product_id AS product_id,
             p.uuid                          AS uuid,
             pd.name                         AS name,
             p.sku                           AS sku,
             pi.qty                          AS qty,
             (
               SELECT origin_image
               FROM product_image
               WHERE product_image_product_id = p.product_id
               ORDER BY product_image_id ASC
               LIMIT 1
             ) AS image_url
           FROM product_inventory pi
           JOIN product p ON p.product_id = pi.product_inventory_product_id
           LEFT JOIN product_description pd
             ON pd.product_description_product_id = p.product_id
           WHERE pi.manage_stock = true
             AND pi.qty > 0
             AND pi.qty <= $1
           ORDER BY pi.qty ASC, p.product_id DESC
           LIMIT $2`,
          [t, l]
        ),
        countByQty('<=', 0),
        // count low stock with the (0, threshold] range
        pool.query(
          `SELECT COUNT(*)::int AS n
           FROM product_inventory
           WHERE manage_stock = true AND qty > 0 AND qty <= $1`,
          [t]
        )
      ]);

      const lowStockItems = lowStock.rows.map((row) => ({
        productId: Number(row.product_id),
        uuid: row.uuid,
        name: row.name,
        sku: row.sku,
        qty: Number(row.qty),
        imageUrl: row.image_url,
        editUrl: buildUrl('productEdit', { id: row.uuid })
      }));

      return {
        outOfStockTotal: outTotal,
        lowStockTotal: Number(lowTotal.rows[0]?.n || 0),
        threshold: t,
        outOfStock,
        lowStock: lowStockItems
      };
    }
  }
};
