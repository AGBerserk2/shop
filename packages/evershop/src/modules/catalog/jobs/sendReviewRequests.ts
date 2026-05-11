import fs from 'fs/promises';
import path from 'path';
import { execute } from '@evershop/postgres-query-builder';
import { CONSTANTS } from '../../../lib/helpers.js';
import { debug, error } from '../../../lib/log/logger.js';
import {
  buildEmailBodyFromTemplate,
  sendEmail
} from '../../../lib/mail/emailHelper.js';
import { pool } from '../../../lib/postgres/connection.js';
import { getBaseUrl } from '../../../lib/util/getBaseUrl.js';
import { getConfig } from '../../../lib/util/getConfig.js';

const FALLBACK_TEMPLATE = `
<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;padding:24px;background:#f8f8f8">
<div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border-radius:12px">
  <h1 style="font-size:22px;color:#111">¿Cómo fue tu experiencia?</h1>
  <p style="color:#555;line-height:1.6">Tu pedido #{{orderNumber}} llegó hace unos días. Nos encantaría saber cómo te fue con los productos que compraste.</p>
  <p style="color:#555;line-height:1.6">Tu opinión ayuda a otros clientes a decidir y nos permite mejorar.</p>
  <a href="{{shopUrl}}/account/orders/{{orderNumber}}" style="display:inline-block;margin-top:16px;background:#e11d48;color:#fff;font-weight:600;padding:12px 24px;border-radius:9999px;text-decoration:none">Calificar mi compra</a>
  <p style="margin-top:32px;font-size:12px;color:#999">Gracias por confiar en {{storeName}}.</p>
</div>
</body></html>
`;

export default async function sendReviewRequests() {
  try {
    const now = new Date();
    const due = await pool.query(`SELECT review_request_id, order_id, customer_id, customer_email
       FROM review_request
       WHERE status = 'pending'
         AND send_after <= $1
       LIMIT 50`,
      [now]
    );

    if (due.rows.length === 0) {
      return;
    }
    debug(`sendReviewRequests: ${due.rows.length} request(s) to send`);

    const storeName = getConfig('shop.name', 'Anroy') || 'Anroy';
    const shopUrl = getBaseUrl();

    // Use a custom template if the merchant provided one in /templates/email/reviewRequest.html
    let template = FALLBACK_TEMPLATE;
    try {
      const customPath = path.resolve(
        CONSTANTS.ROOTPATH,
        'templates',
        'email',
        'reviewRequest.html'
      );
      const exists = await fs.stat(customPath).then(() => true).catch(() => false);
      if (exists) {
        template = await fs.readFile(customPath, 'utf8');
      }
    } catch {
      /* keep fallback */
    }

    for (const row of due.rows) {
      try {
        const orderRow = await pool.query(`SELECT order_number FROM "order" WHERE order_id = $1`,
          [row.order_id]
        );
        const orderNumber = orderRow.rows[0]?.order_number || row.order_id;

        const html = buildEmailBodyFromTemplate(template, {
          storeName,
          shopUrl,
          orderNumber
        });

        await sendEmail({
          to: row.customer_email,
          subject: `¿Cómo fue tu compra en ${storeName}?`,
          html
        });

        await pool.query(`UPDATE review_request SET status='sent', sent_at = now() WHERE review_request_id = $1`,
          [row.review_request_id]
        );
        debug(`Review invitation sent to ${row.customer_email} for order ${row.order_id}`);
      } catch (e: any) {
        error(`Failed to send review request ${row.review_request_id}: ${e?.message || e}`);
        await pool.query(`UPDATE review_request SET status='failed' WHERE review_request_id = $1`,
          [row.review_request_id]
        );
      }
    }
  } catch (e: any) {
    error(`sendReviewRequests job failed: ${e?.message || e}`);
  }
}
