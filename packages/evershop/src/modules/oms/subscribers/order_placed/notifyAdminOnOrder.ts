import { select } from '@evershop/postgres-query-builder';
import { countries } from '../../../../lib/locale/countries.js';
import { provinces } from '../../../../lib/locale/provinces.js';
import { error, info } from '../../../../lib/log/logger.js';
import { sendEmail } from '../../../../lib/mail/emailHelper.js';
import { pool } from '../../../../lib/postgres/connection.js';
import { getBaseUrl } from '../../../../lib/util/getBaseUrl.js';
import { getValueSync } from '../../../../lib/util/registry.js';
import { getSetting } from '../../../setting/services/setting.js';
import { EventData } from '../../../../types/event.js';

// Notification email sent to the store admin every time an order is
// placed. Goes to ADMIN_NOTIFICATION_EMAIL (env var) when set, otherwise
// falls back to the storeEmail setting. Skips silently if neither is
// configured so the email pipeline stays optional.

const TEMPLATE = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Nuevo pedido</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fcf5ec;color:#1d1d1f;padding:24px;">
  <table align="center" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #f0e8df;border-radius:18px;overflow:hidden;">
    <tr>
      <td style="background:#1d1d1f;color:#fff;padding:14px 22px;font-weight:700;letter-spacing:0.18em;font-size:12px;text-transform:uppercase;">
        Anroy · Pedido nuevo
      </td>
    </tr>
    <tr>
      <td style="padding:24px 22px 12px;">
        <div style="display:inline-block;padding:4px 12px;background:#fff1e0;color:#c2580f;border-radius:9999px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">Acción requerida</div>
        <h1 style="font-family:'Cormorant Garamond',serif;font-weight:500;font-size:30px;margin:14px 0 8px;color:#1d1d1f;letter-spacing:-0.02em;">
          Nuevo pedido <em style="font-style:italic;">#{{order.order_number}}</em>
        </h1>
        <p style="margin:0;color:#4b4b50;font-size:14px;line-height:1.5;">
          {{customer.full_name}}{{#if customer.email}} · {{customer.email}}{{/if}}{{#if customer.telephone}} · {{customer.telephone}}{{/if}}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 22px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="border:1px solid #f0e8df;border-radius:14px;padding:14px 16px;background:#fdfaf3;">
              <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8e8e93;font-weight:700;margin-bottom:6px;">Total</div>
              <div style="font-size:26px;font-weight:800;color:#1d1d1f;letter-spacing:-0.02em;">{{currency order.grand_total}}</div>
              <div style="margin-top:6px;font-size:13px;color:#4b4b50;">
                {{#if order.payment_method_name}}{{order.payment_method_name}}{{/if}}
                {{#if order.shipping_method_name}} · {{order.shipping_method_name}}{{/if}}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 22px 0;">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8e8e93;font-weight:700;margin-bottom:8px;">Productos</div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          {{#each order.items}}
          <tr>
            <td style="padding:8px 0;border-bottom:1px dashed #f0e8df;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                {{#if this.thumbnail}}
                <td valign="middle" style="width:56px;padding-right:12px;">
                  <img src="{{this.thumbnail}}" alt="{{this.product_name}}" width="56" height="56"
                    style="display:block;border-radius:12px;border:1px solid #f0e8df;object-fit:cover;" />
                </td>
                {{/if}}
                <td valign="middle">
                  <div style="font-size:14px;font-weight:600;color:#1d1d1f;">{{this.product_name}}</div>
                  <div style="font-size:12px;color:#8e8e93;">SKU {{this.product_sku}} · ×{{this.qty}}</div>
                </td>
                <td valign="middle" align="right" style="font-weight:700;color:#1d1d1f;font-size:14px;white-space:nowrap;">
                  {{currency this.line_total}}
                </td>
              </tr></table>
            </td>
          </tr>
          {{/each}}
        </table>
      </td>
    </tr>
    {{#if shippingAddress}}
    <tr>
      <td style="padding:18px 22px 0;">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8e8e93;font-weight:700;margin-bottom:6px;">Envío</div>
        <div style="font-size:13px;color:#1d1d1f;line-height:1.5;">
          <strong>{{shippingAddress.full_name}}</strong><br />
          {{shippingAddress.address_1}}{{#if shippingAddress.address_2}}, {{shippingAddress.address_2}}{{/if}}<br />
          {{shippingAddress.city}}{{#if shippingAddress.province_name}}, {{shippingAddress.province_name}}{{/if}} {{shippingAddress.postcode}}<br />
          {{shippingAddress.country_name}}<br />
          Tel: {{shippingAddress.telephone}}
        </div>
      </td>
    </tr>
    {{/if}}
    <tr>
      <td style="padding:22px;">
        <a href="{{adminUrl}}"
          style="display:inline-block;background:#1d1d1f;color:#fff;text-decoration:none;font-weight:700;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;padding:14px 22px;border-radius:14px;">
          Ver pedido en el admin
        </a>
      </td>
    </tr>
    <tr>
      <td style="background:#fdfaf3;color:#8e8e93;font-size:11px;padding:14px 22px;text-align:center;">
        Recibís este correo porque administrás Anroy. Modificá el destinatario con la env var ADMIN_NOTIFICATION_EMAIL.
      </td>
    </tr>
  </table>
</body>
</html>`;

export default async function notifyAdminOnOrder(
  data: EventData<'order_placed'>
) {
  try {
    const recipient =
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      (await getSetting('storeEmail', '')) ||
      process.env.SMTP_USER ||
      '';
    if (!recipient) {
      // No place to send to — bail out quietly so a missing setting
      // never blocks order placement.
      return;
    }

    const orderId = data.order_id;
    const order = await select()
      .from('order')
      .where('order_id', '=', orderId)
      .load(pool);
    if (!order) return;

    const items = await select()
      .from('order_item')
      .where('order_item_order_id', '=', order.order_id)
      .execute(pool);
    const baseUrl = getBaseUrl();
    order.items = items.map((item) => {
      if (item.thumbnail) {
        item.thumbnail = `${baseUrl}${item.thumbnail}`;
      }
      return item;
    });

    let shippingAddress: any = null;
    if (!data.no_shipping_required && order.shipping_address_id) {
      shippingAddress = await select()
        .from('order_address')
        .where('order_address_id', '=', order.shipping_address_id)
        .load(pool);
      if (shippingAddress) {
        shippingAddress.country_name =
          countries.find((c) => c.code === shippingAddress.country)?.name || '';
        shippingAddress.province_name =
          provinces.find((p) => p.code === shippingAddress.province)?.name || '';
      }
    }

    const customer = {
      full_name:
        order.customer_full_name ||
        shippingAddress?.full_name ||
        'Cliente sin nombre',
      email: order.customer_email || data.customer_email || '',
      telephone: shippingAddress?.telephone || ''
    };

    const dynamicData = getValueSync(
      'adminOrderEmailData',
      {
        order,
        customer,
        shippingAddress,
        adminUrl: `${baseUrl}/admin/orders/${order.uuid}`
      },
      {}
    );

    const subject = `Nuevo pedido #${order.order_number} · ${customer.full_name}`;

    await sendEmail('admin_order_notification', {
      to: recipient,
      subject,
      template: TEMPLATE,
      data: dynamicData
    });

    info(
      `[order_placed] admin notification sent for order #${order.order_number} to ${recipient}`
    );
  } catch (e) {
    // Never let a failed admin email block the order pipeline.
    error(e);
  }
}
