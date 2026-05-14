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
  <title>Tu pedido fue cancelado</title>
</head>
<body style="margin:0;padding:0;background:#fcf5ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;">
  <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">
    Tu pedido en Anroy fue cancelado.
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
            <td style="padding:36px 28px 22px;background:linear-gradient(180deg,#fbe9e7 0%,#ffffff 100%);">
              <div style="width:60px;height:60px;border-radius:50%;background:#f5d6d2;color:#a4332a;display:inline-block;line-height:60px;text-align:center;margin-bottom:14px;font-size:30px;font-weight:700;">×</div>
              <div style="display:inline-block;padding:4px 12px;background:#fbe1de;color:#a4332a;border-radius:9999px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">Pedido cancelado</div>
              <h1 style="margin:14px 0 6px;font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:36px;line-height:1.05;letter-spacing:-0.02em;color:#1d1d1f;">
                {{#if customerFirstName}}<em style="font-style:italic;color:#a4332a;">{{customerFirstName}}</em>, {{/if}}cancelamos tu pedido
              </h1>
              <p style="margin:0;font-size:15px;color:#4b4b50;line-height:1.55;">
                Tu pedido <strong style="color:#1d1d1f;">#{{order.order_number}}</strong> fue cancelado. Si el pago se procesó, vamos a reembolsarte por la misma vía en los próximos días hábiles.
              </p>
            </td>
          </tr>
          {{#if reason}}
          <tr>
            <td style="padding:8px 28px 0;">
              <div style="border:1px solid #f0e8df;border-radius:18px;background:#fdfaf3;padding:16px 18px;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8e8e93;margin-bottom:6px;">Motivo</div>
                <div style="font-size:14px;color:#1d1d1f;line-height:1.55;">{{reason}}</div>
              </div>
            </td>
          </tr>
          {{/if}}
          <tr>
            <td align="center" style="padding:22px 28px 30px;">
              <a href="{{baseUrl}}/account/orders"
                style="display:inline-block;background:#1d1d1f;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:14px;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">
                Ver mis pedidos
              </a>
              <div style="margin-top:14px;font-size:12px;color:#8e8e93;">
                ¿Querés intentar de nuevo? Estamos para ayudarte.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 16px 36px;text-align:center;">
        <div style="font-size:12px;color:#8e8e93;line-height:1.6;">
          ¿Tenés dudas con la cancelación? Respondé este correo y lo resolvemos.<br />
          Anroy · Esmaltes hechos a mano · Santo Domingo, RD
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

export default async function sendCanceledEmail(
  data: EventData<'order_canceled'>
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

    await sendEmail('order_canceled', {
      to: recipient,
      subject: `Tu pedido #${order.order_number} fue cancelado`,
      template: TEMPLATE,
      data: {
        order,
        customerFirstName,
        storeLogoUrl,
        baseUrl: getBaseUrl(),
        reason: data.reason || ''
      }
    });

    info(
      `[order_canceled] customer notification sent for order #${order.order_number} to ${recipient}`
    );
  } catch (e) {
    error(e);
  }
}
