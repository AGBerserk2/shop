import { select } from '@evershop/postgres-query-builder';
import { error, info } from '../../../../lib/log/logger.js';
import { sendEmail } from '../../../../lib/mail/emailHelper.js';
import { pool } from '../../../../lib/postgres/connection.js';
import { getBaseUrl } from '../../../../lib/util/getBaseUrl.js';
import { getSetting } from '../../../setting/services/setting.js';
import { EventData } from '../../../../types/event.js';

const TEMPLATE = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tu pedido fue entregado</title>
</head>
<body style="margin:0;padding:0;background:#fcf5ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;">
  <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">
    Tu pedido ya está en tus manos. ¡Gracias por elegir Anroy!
  </div>
  <table align="center" width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
    style="max-width:640px;margin:0 auto;">
    <tr>
      <td align="center" style="padding:34px 16px 18px;">
        {{#if storeLogoUrl}}
          <img src="{{storeLogoUrl}}" alt="Anroy" height="48"
            style="display:block;height:48px;width:auto;border:0;outline:none;text-decoration:none;" />
        {{else}}
          <div style="display:inline-block;font-weight:800;letter-spacing:0.04em;color:#1d1d1f;font-size:28px;">ANROY</div>
        {{/if}}
      </td>
    </tr>
    <tr>
      <td>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
          style="background:#ffffff;border:1px solid #f0e8df;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px -28px rgba(20,14,10,0.18);">
          <tr>
            <td style="padding:36px 28px 22px;background:linear-gradient(180deg,#fff5e8 0%,#ffffff 100%);">
              <div style="width:60px;height:60px;border-radius:50%;background:#d9f0e0;color:#1f8c45;display:inline-block;line-height:60px;text-align:center;margin-bottom:14px;font-size:30px;font-weight:700;">✓</div>
              <div style="display:inline-block;padding:4px 12px;background:#fff1e0;color:#c2580f;border-radius:9999px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">Pedido entregado</div>
              <h1 style="margin:14px 0 6px;font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:36px;line-height:1.05;letter-spacing:-0.02em;color:#1d1d1f;">
                ¡Llegó{{#if customerFirstName}}, <em style="font-style:italic;color:#c2580f;">{{customerFirstName}}</em>{{/if}}!
              </h1>
              <p style="margin:0;font-size:15px;color:#4b4b50;line-height:1.55;">
                Tu pedido <strong style="color:#1d1d1f;">#{{order.order_number}}</strong> ya está en tus manos. Esperamos que disfrutes cada detalle — está hecho a mano y con mucho cariño desde Santo Domingo.
              </p>
              <div style="display:inline-block;margin-top:18px;padding:8px 16px;background:#f7f3eb;border:1px solid #f0e8df;border-radius:9999px;">
                <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#8e8e93;margin-right:8px;">Entregado</span>
                <span style="font-size:14px;font-weight:700;color:#1d1d1f;">#{{order.order_number}}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 6px;">
              <div style="border:1px solid #f0e8df;border-radius:18px;background:#fdfaf3;padding:18px 20px;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8e8e93;margin-bottom:6px;">¿Qué te pareció?</div>
                <div style="font-size:14px;color:#1d1d1f;line-height:1.55;">
                  Nos encantaría saber tu opinión sobre tu pedido. Tu reseña ayuda a otras clientas a descubrirnos y a nosotras a seguir mejorando.
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 28px 30px;">
              <a href="{{baseUrl}}/account/orders"
                style="display:inline-block;background:#1d1d1f;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:14px;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">
                Ver mi pedido
              </a>
              <div style="margin-top:14px;font-size:12px;color:#8e8e93;">
                Volvé cuando quieras — siempre hay tonos nuevos en camino.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 16px 36px;text-align:center;">
        <div style="font-size:12px;color:#8e8e93;line-height:1.6;">
          ¿Algo no estuvo bien? Respondé este correo y lo resolvemos.<br />
          Anroy · Esmaltes hechos a mano · Santo Domingo, RD
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

export default async function sendDeliveredEmail(
  data: EventData<'order_delivered'>
) {
  try {
    const order = await select()
      .from('order')
      .where('order_id', '=', data.order_id)
      .load(pool);
    if (!order) return;

    const recipient = data.customer_email || order.customer_email;
    if (!recipient) return;

    const customerName =
      data.customer_full_name || order.customer_full_name || '';
    const customerFirstName = customerName.trim().split(/\s+/)[0] || '';

    let storeLogoUrl = '';
    try {
      storeLogoUrl = (await getSetting('storeLogo', '')) as string;
    } catch {
      storeLogoUrl = '';
    }

    await sendEmail('order_delivered', {
      to: recipient,
      subject: `🎉 Tu pedido #${order.order_number} ya está en tus manos`,
      template: TEMPLATE,
      data: {
        order,
        customerFirstName,
        storeLogoUrl,
        baseUrl: getBaseUrl()
      }
    });

    info(
      `[order_delivered] customer notification sent for order #${order.order_number} to ${recipient}`
    );
  } catch (e) {
    error(e);
  }
}
