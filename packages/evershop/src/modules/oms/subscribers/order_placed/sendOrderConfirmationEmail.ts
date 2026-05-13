import fs from 'fs/promises';
import path from 'path';
import { select } from '@evershop/postgres-query-builder';
import { CONSTANTS } from '../../../../lib/helpers.js';
import { countries } from '../../../../lib/locale/countries.js';
import { generateInvoicePdf } from '../../../../lib/invoice/generateInvoicePdf.js';
import { provinces } from '../../../../lib/locale/provinces.js';
import { debug, error } from '../../../../lib/log/logger.js';
import { sendEmail } from '../../../../lib/mail/emailHelper.js';
import { pool } from '../../../../lib/postgres/connection.js';
import { getBaseUrl } from '../../../../lib/util/getBaseUrl.js';
import { getConfig } from '../../../../lib/util/getConfig.js';
import { getValue } from '../../../../lib/util/registry.js';
import { getSetting } from '../../../setting/services/setting.js';
import { EventData } from '../../../../types/event.js';

// Customer order confirmation email — peach editorial layout. Uses the
// storeLogo from settings (uploaded to GCS) when available; otherwise
// renders the 'ANROY' wordmark inline.
const TEMPLATE = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="es">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Tu pedido está confirmado</title>
  </head>
  <body style="margin:0;padding:0;background:#fcf5ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;-webkit-font-smoothing:antialiased;">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">
      ¡Gracias por tu pedido en Anroy! Te enviamos los detalles acá.
    </div>

    <table align="center" width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
      style="max-width:640px;margin:0 auto;">

      <!-- Logo -->
      <tr>
        <td align="center" style="padding:34px 16px 18px;">
          {{#if storeLogoUrl}}
            <img src="{{storeLogoUrl}}" alt="Anroy" height="48"
              style="display:block;height:48px;width:auto;border:0;outline:none;text-decoration:none;" />
          {{else}}
            <div style="display:inline-block;font-weight:800;letter-spacing:0.04em;color:#1d1d1f;font-size:28px;">
              ANROY
            </div>
            <div style="font-size:10px;letter-spacing:0.32em;color:#8e8e93;margin-top:4px;text-transform:uppercase;">
              Esmaltes hechos a mano · RD
            </div>
          {{/if}}
        </td>
      </tr>

      <tr>
        <td>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
            style="background:#ffffff;border:1px solid #f0e8df;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px -28px rgba(20,14,10,0.18);">

            <!-- Hero -->
            <tr>
              <td style="padding:36px 28px 22px;background:linear-gradient(180deg,#fff5e8 0%,#ffffff 100%);">
                <div style="width:60px;height:60px;border-radius:50%;background:#d9f0e0;color:#1f8c45;display:inline-block;line-height:60px;text-align:center;margin-bottom:14px;font-size:30px;font-weight:700;">
                  ✓
                </div>
                <div style="display:inline-block;padding:4px 12px;background:#fff1e0;color:#c2580f;border-radius:9999px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">
                  Pedido confirmado
                </div>
                <h1 style="margin:14px 0 6px;font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:38px;line-height:1.05;letter-spacing:-0.02em;color:#1d1d1f;">
                  ¡Gracias{{#if customerFirstName}}, <em style="font-style:italic;color:#c2580f;">{{customerFirstName}}</em>{{/if}}!
                </h1>
                <p style="margin:0;font-size:15px;color:#4b4b50;line-height:1.55;">
                  Tu pedido <strong style="color:#1d1d1f;">está confirmado</strong>. Lo preparamos a mano y te avisamos apenas salga en camino. Te adjuntamos la factura en PDF con todos los detalles.
                </p>
                <div style="display:inline-block;margin-top:18px;padding:8px 16px;background:#f7f3eb;border:1px solid #f0e8df;border-radius:9999px;">
                  <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#8e8e93;margin-right:8px;">Pedido</span>
                  <span style="font-size:14px;font-weight:700;color:#1d1d1f;">#{{order.order_number}}</span>
                  <span style="display:inline-block;width:1px;height:10px;background:#d9c9b5;margin:0 10px;vertical-align:middle;"></span>
                  <span style="font-size:12px;color:#4b4b50;">{{date order.created_at}}</span>
                </div>
              </td>
            </tr>

            {{#if shippingAddress}}
            <!-- Shipping -->
            <tr>
              <td style="padding:14px 28px 0;">
                <div style="border:1px solid #f0e8df;border-radius:18px;background:#fdfaf3;padding:16px 18px;">
                  <div style="font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8e8e93;margin-bottom:6px;">Enviar a</div>
                  <div style="font-size:14px;color:#1d1d1f;font-weight:600;margin-bottom:4px;">{{shippingAddress.full_name}}</div>
                  <div style="font-size:13px;color:#4b4b50;line-height:1.55;">
                    {{shippingAddress.address_1}}{{#if shippingAddress.address_2}}, {{shippingAddress.address_2}}{{/if}}<br />
                    {{shippingAddress.city}}{{#if shippingAddress.province_name}}, {{shippingAddress.province_name}}{{/if}} {{shippingAddress.postcode}}<br />
                    {{shippingAddress.country_name}}
                  </div>
                </div>
              </td>
            </tr>
            {{/if}}

            <!-- Items -->
            <tr>
              <td style="padding:20px 28px 0;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8e8e93;margin-bottom:12px;">Lo que viene</div>
                <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                  {{#each order.items}}
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px dashed #f0e8df;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>
                        {{#if this.thumbnail}}
                        <td valign="middle" style="width:60px;padding-right:14px;">
                          <img alt="{{this.product_name}}" src="{{this.thumbnail}}" width="60" height="60"
                            style="display:block;border-radius:14px;border:1px solid #f0e8df;background:#fff1e0;object-fit:cover;" />
                        </td>
                        {{/if}}
                        <td valign="middle">
                          <div style="font-size:14px;font-weight:600;color:#1d1d1f;line-height:1.35;">
                            {{this.product_name}}
                          </div>
                          <div style="font-size:12px;color:#8e8e93;margin-top:2px;">
                            ×{{this.qty}} · {{currency this.final_price}}
                          </div>
                        </td>
                        <td valign="middle" align="right" style="white-space:nowrap;font-weight:700;color:#1d1d1f;font-size:14px;">
                          {{currency this.line_total}}
                        </td>
                      </tr></table>
                    </td>
                  </tr>
                  {{/each}}
                </table>
              </td>
            </tr>

            <!-- Totals -->
            <tr>
              <td style="padding:18px 28px 8px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                  <tr>
                    <td style="font-size:13px;color:#4b4b50;padding:6px 0;">Subtotal</td>
                    <td align="right" style="font-size:13px;color:#1d1d1f;padding:6px 0;font-weight:600;">{{currency order.sub_total}}</td>
                  </tr>
                  {{#if order.discount_amount}}
                  <tr>
                    <td style="font-size:13px;color:#4b4b50;padding:6px 0;">Descuento</td>
                    <td align="right" style="font-size:13px;color:#c2580f;padding:6px 0;font-weight:600;">- {{currency order.discount_amount}}</td>
                  </tr>
                  {{/if}}
                  <tr>
                    <td style="font-size:13px;color:#4b4b50;padding:6px 0;">Envío</td>
                    <td align="right" style="font-size:13px;color:#1d1d1f;padding:6px 0;font-weight:600;">{{currency order.shipping_fee_incl_tax}}</td>
                  </tr>
                  {{#if order.tax_amount}}
                  <tr>
                    <td style="font-size:13px;color:#4b4b50;padding:6px 0;">Impuestos</td>
                    <td align="right" style="font-size:13px;color:#1d1d1f;padding:6px 0;font-weight:600;">{{currency order.tax_amount}}</td>
                  </tr>
                  {{/if}}
                  <tr><td colspan="2" style="border-top:1px solid #f0e8df;padding-top:14px;">&nbsp;</td></tr>
                  <tr>
                    <td style="font-size:16px;font-weight:800;color:#1d1d1f;padding-bottom:14px;">Total</td>
                    <td align="right" style="font-size:22px;font-weight:800;color:#1d1d1f;letter-spacing:-0.01em;padding-bottom:14px;">{{currency order.grand_total}}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td align="center" style="padding:0 28px 30px;">
                <a href="{{baseUrl}}/account/orders"
                  style="display:inline-block;background:#1d1d1f;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:14px;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">
                  Ver mis pedidos
                </a>
                <div style="margin-top:14px;font-size:12px;color:#8e8e93;">
                  Te avisamos por correo apenas tu pedido salga en camino.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Reassurance row -->
      <tr>
        <td style="padding:18px 16px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td align="center" style="padding:6px 8px;font-size:12px;color:#4b4b50;">🚚&nbsp; Envío a toda RD</td>
              <td align="center" style="padding:6px 8px;font-size:12px;color:#4b4b50;">🛡️&nbsp; Pago protegido</td>
              <td align="center" style="padding:6px 8px;font-size:12px;color:#4b4b50;">✨&nbsp; Hecho a mano</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:14px 16px 36px;text-align:center;">
          <div style="font-size:12px;color:#8e8e93;line-height:1.6;">
            ¿Alguna pregunta? Respondé este correo y te ayudamos.<br />
            Anroy · Esmaltes hechos a mano · Santo Domingo, RD
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export default async function sendOrderConfirmationEmail(
  data: EventData<'order_placed'>
) {
  try {
    const config = getConfig('system.notification_emails.order_confirmation', {
      enabled: true
    });

    if (config?.enabled === false) {
      return;
    }
    const orderId = data.order_id;
    const order = await select()
      .from('order')
      .where('order_id', '=', orderId)
      .load(pool);

    if (!order) {
      return;
    }

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
    const shippingAddress = await select()
      .from('order_address')
      .where('order_address_id', '=', order.shipping_address_id)
      .load(pool);
    if (!data.no_shipping_required && shippingAddress) {
      shippingAddress.country_name =
        countries.find((c) => c.code === shippingAddress.country)?.name || '';
      shippingAddress.province_name =
        provinces.find((p) => p.code === shippingAddress.province)?.name || '';
    }

    const billingAddress = await select()
      .from('order_address')
      .where('order_address_id', '=', order.billing_address_id)
      .load(pool);
    if (billingAddress) {
      billingAddress.country_name =
        countries.find((c) => c.code === billingAddress.country)?.name || '';
      billingAddress.province_name =
        provinces.find((p) => p.code === billingAddress.province)?.name || '';
    }

    let template;
    if (config?.templatePath) {
      const filePath = path.join(CONSTANTS.ROOTPATH, config.templatePath);
      try {
        await fs.access(filePath);
        template = await fs.readFile(filePath, 'utf8');
      } catch (e) {
        debug(
          `Order confirmation email template not found at: ${filePath}. Using default.`
        );
        template = TEMPLATE;
      }
    } else {
      template = TEMPLATE;
    }

    const customerName =
      order.customer_full_name ||
      shippingAddress?.full_name ||
      billingAddress?.full_name ||
      '';
    const customerFirstName = customerName.trim().split(/\s+/)[0] || '';

    // Pull the operator's uploaded logo from settings. The setting holds
    // an absolute URL when uploaded via /admin/setting (e.g. served from
    // GCS), so it works straight out of the box in email clients.
    let storeLogoUrl = '';
    try {
      storeLogoUrl = (await getSetting('storeLogo', '')) as string;
    } catch {
      storeLogoUrl = '';
    }

    const dynamicData = await getValue('orderConfirmationEmailData', {
      order,
      shippingAddress,
      billingAddress,
      customerFirstName,
      storeLogoUrl,
      baseUrl
    });

    // Build the invoice PDF attachment.
    let invoiceBuffer: Buffer | null = null;
    try {
      invoiceBuffer = await generateInvoicePdf({
        order: {
          ...order,
          items: items.map((it: any) => ({
            ...it,
            qty: Number(it.qty || 0),
            final_price: Number(it.final_price || it.product_price || 0),
            line_total: Number(it.line_total || 0)
          }))
        } as any,
        customer: {
          full_name: customerName,
          email: order.customer_email || data.customer_email,
          telephone: shippingAddress?.telephone || ''
        },
        shippingAddress,
        billingAddress,
        storeName: 'Anroy'
      });
    } catch (e) {
      // Never let a PDF generation hiccup block the confirmation email.
      error(e);
      invoiceBuffer = null;
    }

    const subject = `✨ Tu pedido en Anroy está confirmado · #${order.order_number}`;
    if (data.customer_email) {
      const args = await getValue(
        'orderConfirmationEmailArguments',
        {
          to: data.customer_email,
          subject,
          template,
          data: dynamicData,
          ...(invoiceBuffer
            ? {
                attachments: [
                  {
                    filename: `Anroy-Factura-${order.order_number}.pdf`,
                    content: invoiceBuffer,
                    contentType: 'application/pdf'
                  }
                ]
              }
            : {})
        },
        { order }
      );
      await sendEmail('order_confirmation', args);
    }
  } catch (e) {
    error(e);
  }
}
