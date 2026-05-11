import { execute } from '@evershop/postgres-query-builder';
import { debug, error } from '../../../../lib/log/logger.js';
import { pool } from '../../../../lib/postgres/connection.js';
import { getConfig } from '../../../../lib/util/getConfig.js';
import { EventData } from '../../../../types/event.js';

// When an order transitions into a "delivered/completed" status, schedule a
// review-invitation email to go out N days later (default 7). The cron job
// sends them; we just enqueue here.
export default async (data: EventData) => {
  try {
    const orderId = (data as any)?.data?.orderId;
    const after = (data as any)?.data?.after;
    if (!orderId || !after) return;
    if (!['completed', 'closed', 'delivered'].includes(after)) return;

    const delayDays = Number(getConfig('review.invitationDelayDays', 7)) || 7;
    const sendAfter = new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000);

    const order = await pool.query(`SELECT order_id, customer_id, customer_email FROM "order" WHERE order_id = $1`,
      [orderId]
    );
    if (order.rows.length === 0) return;
    const o = order.rows[0];
    if (!o.customer_email) return;

    await pool.query(`INSERT INTO review_request (order_id, customer_id, customer_email, send_after, status)
       VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT (order_id) DO NOTHING`,
      [o.order_id, o.customer_id, o.customer_email, sendAfter]
    );

    debug(`Review invitation queued for order ${orderId}, sending after ${sendAfter.toISOString()}`);
  } catch (e: any) {
    error(`scheduleReviewRequest failed: ${e?.message || e}`);
  }
};
