import { pool } from '../../../../../lib/postgres/connection.js';

export default {
  Query: {
    customerCohorts: async (_, { months = 6 }) => {
      const m = Math.max(1, Math.min(12, Number(months) || 6));

      // For each customer, find their first order month and the months of all
      // subsequent orders. Then group: cohort_month → set of customers, and
      // for each follow-up month_offset → set of customers who ordered then.
      //
      // We compute the calendar diff in months (year * 12 + month) so cohorts
      // bucket cleanly without timezone drift.
      const rows = await pool.query(
        `WITH first_orders AS (
           SELECT customer_id,
                  date_trunc('month', MIN(created_at)) AS first_month
           FROM "order"
           WHERE customer_id IS NOT NULL
             AND status NOT IN ('canceled')
           GROUP BY customer_id
         ),
         labeled AS (
           SELECT
             o.customer_id,
             fo.first_month,
             date_trunc('month', o.created_at) AS order_month
           FROM "order" o
           JOIN first_orders fo ON fo.customer_id = o.customer_id
           WHERE o.status NOT IN ('canceled')
         )
         SELECT
           to_char(first_month, 'YYYY-MM') AS cohort_month,
           (EXTRACT(YEAR FROM order_month) * 12 + EXTRACT(MONTH FROM order_month)
            - (EXTRACT(YEAR FROM first_month) * 12 + EXTRACT(MONTH FROM first_month)))::int
              AS month_offset,
           COUNT(DISTINCT customer_id)::int AS customers
         FROM labeled
         WHERE first_month >= NOW() - INTERVAL '12 months'
         GROUP BY cohort_month, month_offset
         ORDER BY cohort_month ASC, month_offset ASC`
      );

      // Pivot: cohortMonth → { newCustomers, [monthOffset]: count }
      const cohortMap = new Map();
      rows.rows.forEach((r) => {
        const key = r.cohort_month;
        if (!cohortMap.has(key)) {
          cohortMap.set(key, { newCustomers: 0, byOffset: new Map() });
        }
        const c = cohortMap.get(key);
        c.byOffset.set(Number(r.month_offset), Number(r.customers));
        if (Number(r.month_offset) === 0) {
          c.newCustomers = Number(r.customers);
        }
      });

      const cohorts = [...cohortMap.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => {
          const retention = [];
          for (let i = 0; i < m; i++) {
            const count = data.byOffset.get(i) || 0;
            retention.push({
              monthOffset: i,
              count,
              pct: data.newCustomers > 0 ? (count / data.newCustomers) * 100 : 0
            });
          }
          return {
            month,
            newCustomers: data.newCustomers,
            retention
          };
        });

      return {
        months: m,
        cohorts
      };
    }
  }
};
