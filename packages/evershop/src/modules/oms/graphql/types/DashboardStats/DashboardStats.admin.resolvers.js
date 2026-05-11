import { pool } from '../../../../../lib/postgres/connection.js';
import { getConfig } from '../../../../../lib/util/getConfig.js';

function display(value, currency) {
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

function pct(curr, prev) {
  if (prev == null || prev === 0) {
    if (curr === 0) return 0;
    return null; // sin base de comparación
  }
  return ((curr - prev) / prev) * 100;
}

async function sumRevenue(pool_, fromISO, toISO) {
  const r = await pool_.query(
    `SELECT COALESCE(SUM(grand_total)::float, 0) AS total
     FROM "order"
     WHERE created_at >= $1 AND created_at < $2
       AND status NOT IN ('canceled', 'closed')`,
    [fromISO, toISO]
  );
  return Number(r.rows[0]?.total || 0);
}

async function countOrders(pool_, fromISO, toISO) {
  const r = await pool_.query(
    `SELECT COUNT(*)::int AS n
     FROM "order"
     WHERE created_at >= $1 AND created_at < $2`,
    [fromISO, toISO]
  );
  return Number(r.rows[0]?.n || 0);
}

async function countNewCustomers(pool_, fromISO, toISO) {
  const r = await pool_.query(
    `SELECT COUNT(*)::int AS n
     FROM customer
     WHERE created_at >= $1 AND created_at < $2`,
    [fromISO, toISO]
  );
  return Number(r.rows[0]?.n || 0);
}

async function countPendingFulfillment(pool_) {
  const r = await pool_.query(
    `SELECT COUNT(*)::int AS n
     FROM "order"
     WHERE shipment_status IN ('pending', 'unfulfilled')
       AND status NOT IN ('canceled', 'closed')`
  );
  return Number(r.rows[0]?.n || 0);
}

async function countUnpaidOrders(pool_) {
  const r = await pool_.query(
    `SELECT COUNT(*)::int AS n
     FROM "order"
     WHERE payment_status IN ('pending', 'unpaid', 'failed')
       AND status NOT IN ('canceled', 'closed')`
  );
  return Number(r.rows[0]?.n || 0);
}

async function countPendingReviews(pool_) {
  // product_review may not exist on older DBs; swallow that case gracefully.
  try {
    const r = await pool_.query(
      `SELECT COUNT(*)::int AS n FROM product_review WHERE status = 'pending'`
    );
    return Number(r.rows[0]?.n || 0);
  } catch {
    return 0;
  }
}

async function countOutOfStock(pool_) {
  const r = await pool_.query(
    `SELECT COUNT(*)::int AS n
     FROM product_inventory
     WHERE manage_stock = true AND qty <= 0`
  );
  return Number(r.rows[0]?.n || 0);
}

async function countLowStock(pool_, threshold = 5) {
  const r = await pool_.query(
    `SELECT COUNT(*)::int AS n
     FROM product_inventory
     WHERE manage_stock = true AND qty > 0 AND qty <= $1`,
    [threshold]
  );
  return Number(r.rows[0]?.n || 0);
}

function parseRange(from, to) {
  const now = new Date();
  let fromD = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let toD = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (Number.isNaN(fromD.getTime())) fromD = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (Number.isNaN(toD.getTime())) toD = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (toD <= fromD) {
    toD = new Date(fromD.getTime() + 24 * 60 * 60 * 1000);
  }
  // Previous period of equal length immediately before `from`.
  const length = toD.getTime() - fromD.getTime();
  const prevTo = new Date(fromD.getTime());
  const prevFrom = new Date(fromD.getTime() - length);
  return {
    from: fromD.toISOString(),
    to: toD.toISOString(),
    prevFrom: prevFrom.toISOString(),
    prevTo: prevTo.toISOString()
  };
}

export default {
  Query: {
    dashboardStats: async (_, { from, to }) => {
      const range = parseRange(from, to);
      const currency = getConfig('shop.currency', 'USD');

      const [
        revenueNow,
        revenuePrev,
        ordersNow,
        ordersPrev,
        newCustNow,
        newCustPrev,
        pendingFulfillment,
        unpaidOrders,
        pendingReviews,
        outOfStock,
        lowStock
      ] = await Promise.all([
        sumRevenue(pool, range.from, range.to),
        sumRevenue(pool, range.prevFrom, range.prevTo),
        countOrders(pool, range.from, range.to),
        countOrders(pool, range.prevFrom, range.prevTo),
        countNewCustomers(pool, range.from, range.to),
        countNewCustomers(pool, range.prevFrom, range.prevTo),
        countPendingFulfillment(pool),
        countUnpaidOrders(pool),
        countPendingReviews(pool),
        countOutOfStock(pool),
        countLowStock(pool, 5)
      ]);

      const aovNow = ordersNow > 0 ? revenueNow / ordersNow : 0;
      const aovPrev = ordersPrev > 0 ? revenuePrev / ordersPrev : 0;

      return {
        revenue: {
          value: revenueNow,
          text: display(revenueNow, currency),
          previousValue: revenuePrev,
          changePct: pct(revenueNow, revenuePrev)
        },
        orderCount: {
          value: ordersNow,
          previousValue: ordersPrev,
          changePct: pct(ordersNow, ordersPrev)
        },
        averageOrderValue: {
          value: aovNow,
          text: display(aovNow, currency),
          previousValue: aovPrev,
          changePct: pct(aovNow, aovPrev)
        },
        pendingFulfillment,
        unpaidOrders,
        pendingReviews,
        outOfStockProducts: outOfStock,
        lowStockProducts: lowStock,
        newCustomers: newCustNow,
        _prevNewCustomers: newCustPrev
      };
    }
  }
};
