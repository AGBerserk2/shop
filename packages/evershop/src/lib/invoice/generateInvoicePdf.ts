import PDFDocument from 'pdfkit';

// Lightweight, dependency-free PDF invoice builder. Uses pdfkit primitives
// only (no Chromium / Puppeteer), produces a Buffer the email pipeline
// attaches to the order confirmation.
//
// Aesthetic carries Anroy's editorial accent: a cream paper background
// strip behind the header, deep ink headlines, hairline rules, italic
// callouts, monospace-ish tabular totals. Plus Jakarta isn't available
// in pdfkit's built-in font set so we ship with Helvetica/Helvetica-Bold
// which renders consistently on every viewer.

export interface InvoiceData {
  order: {
    order_number: string;
    grand_total: number;
    sub_total: number;
    shipping_fee_incl_tax: number;
    tax_amount: number;
    discount_amount?: number;
    coupon?: string | null;
    currency: string;
    created_at: Date | string;
    payment_method_name?: string;
    shipping_method_name?: string;
    items: Array<{
      product_name: string;
      product_sku?: string;
      qty: number;
      line_total: number;
      final_price?: number;
    }>;
  };
  customer: {
    full_name: string;
    email?: string;
    telephone?: string;
  };
  shippingAddress?: {
    full_name?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    province_name?: string;
    country_name?: string;
    postcode?: string;
    telephone?: string;
  } | null;
  billingAddress?: {
    full_name?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    province_name?: string;
    country_name?: string;
    postcode?: string;
  } | null;
  storeName?: string;
  storeAddress?: string;
}

const PALETTE = {
  ink: '#1d1d1f',
  inkSoft: '#4b4b50',
  mute: '#8e8e93',
  paper: '#fdfaf3',
  accent: '#f97316',
  accentDeep: '#c2580f',
  hairline: '#d9c9b5',
  green: '#1f8c45'
};

function formatMoney(value: number, currency = 'DOP'): string {
  const safe = Number(value || 0);
  try {
    return `${currency} ${new Intl.NumberFormat('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(safe)}`;
  } catch {
    return `${currency} ${safe.toFixed(2)}`;
  }
}

function formatDate(value: Date | string): string {
  try {
    return new Date(value)
      .toLocaleDateString('es-DO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      .replace('.', '');
  } catch {
    return String(value);
  }
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 56, bottom: 56, left: 56, right: 56 },
        info: {
          Title: `Factura Anroy #${data.order.order_number}`,
          Author: 'Anroy',
          Subject: `Pedido #${data.order.order_number}`
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const margin = 56;
      const contentWidth = pageWidth - margin * 2;
      const currency = data.order.currency || 'DOP';

      // ── Header strip ─────────────────────────────────────────
      doc
        .rect(0, 0, pageWidth, 110)
        .fill(PALETTE.paper);

      // ANROY wordmark
      doc
        .fillColor(PALETTE.ink)
        .font('Helvetica-Bold')
        .fontSize(22)
        .text('ANROY', margin, 36, { characterSpacing: 1.5 });

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(PALETTE.mute)
        .text('ESMALTES HECHOS A MANO · RD', margin, 64, {
          characterSpacing: 2
        });

      // Right-side meta
      const rightBlockX = margin + contentWidth - 220;
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(PALETTE.mute)
        .text('FACTURA', rightBlockX, 36, {
          width: 220,
          align: 'right',
          characterSpacing: 2
        });
      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor(PALETTE.ink)
        .text(`#${data.order.order_number}`, rightBlockX, 50, {
          width: 220,
          align: 'right'
        });
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(PALETTE.inkSoft)
        .text(formatDate(data.order.created_at), rightBlockX, 80, {
          width: 220,
          align: 'right'
        });

      // ── Body start ───────────────────────────────────────────
      doc.y = 140;

      // ── Customer + shipping cards (two cols) ─────────────────
      const colGap = 16;
      const colWidth = (contentWidth - colGap) / 2;
      const cardTop = doc.y;

      const drawCard = (
        x: number,
        y: number,
        w: number,
        title: string,
        lines: string[]
      ) => {
        const padding = 14;
        const lineHeight = 13;
        const titleHeight = 14;
        const cardHeight =
          padding * 2 + titleHeight + lines.length * lineHeight + 4;
        doc
          .roundedRect(x, y, w, cardHeight, 10)
          .lineWidth(1)
          .strokeColor(PALETTE.hairline)
          .stroke();

        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor(PALETTE.mute)
          .text(title.toUpperCase(), x + padding, y + padding, {
            characterSpacing: 2,
            width: w - padding * 2
          });

        let cursorY = y + padding + titleHeight + 4;
        doc.font('Helvetica').fontSize(9.5).fillColor(PALETTE.ink);
        for (const line of lines) {
          doc.text(line, x + padding, cursorY, {
            width: w - padding * 2,
            lineBreak: false
          });
          cursorY += lineHeight;
        }
        return cardHeight;
      };

      // Customer card
      const customerLines = [
        data.customer.full_name || '—',
        ...(data.customer.email ? [data.customer.email] : []),
        ...(data.customer.telephone ? [data.customer.telephone] : [])
      ];

      // Shipping card
      const sa = data.shippingAddress;
      const shippingLines = sa
        ? [
            sa.full_name || '',
            sa.address_1 || '',
            ...(sa.address_2 ? [sa.address_2] : []),
            [sa.city, sa.province_name, sa.postcode].filter(Boolean).join(', '),
            sa.country_name || '',
            ...(sa.telephone ? [`Tel: ${sa.telephone}`] : [])
          ].filter(Boolean)
        : ['Sin envío'];

      const customerCardH = drawCard(
        margin,
        cardTop,
        colWidth,
        'Cliente',
        customerLines
      );
      const shippingCardH = drawCard(
        margin + colWidth + colGap,
        cardTop,
        colWidth,
        'Enviar a',
        shippingLines
      );

      doc.y = cardTop + Math.max(customerCardH, shippingCardH) + 24;

      // ── Items table ──────────────────────────────────────────
      const tableTop = doc.y;
      const colDescX = margin;
      const colQtyX = margin + contentWidth - 220;
      const colPriceX = margin + contentWidth - 130;
      const colTotalX = margin + contentWidth - 80;
      const colTotalWidth = 80;

      // Table header
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(PALETTE.mute)
        .text('PRODUCTO', colDescX, tableTop, { characterSpacing: 2 })
        .text('CANT', colQtyX, tableTop, {
          width: 50,
          align: 'right',
          characterSpacing: 2
        })
        .text('PRECIO', colPriceX, tableTop, {
          width: 50,
          align: 'right',
          characterSpacing: 2
        })
        .text('TOTAL', colTotalX, tableTop, {
          width: colTotalWidth,
          align: 'right',
          characterSpacing: 2
        });

      doc
        .moveTo(margin, tableTop + 14)
        .lineTo(margin + contentWidth, tableTop + 14)
        .lineWidth(1)
        .strokeColor(PALETTE.ink)
        .stroke();

      let rowY = tableTop + 22;
      for (const item of data.order.items) {
        const productLines: string[] = [item.product_name || ''];
        if (item.product_sku) productLines.push(`SKU: ${item.product_sku}`);

        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(PALETTE.ink)
          .text(productLines[0], colDescX, rowY, {
            width: colQtyX - colDescX - 12,
            lineBreak: false,
            ellipsis: true
          });
        if (productLines[1]) {
          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor(PALETTE.mute)
            .text(productLines[1], colDescX, rowY + 14, {
              width: colQtyX - colDescX - 12
            });
        }

        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor(PALETTE.ink)
          .text(String(item.qty), colQtyX, rowY, {
            width: 50,
            align: 'right'
          })
          .text(formatMoney(item.final_price || 0, currency), colPriceX, rowY, {
            width: 50,
            align: 'right'
          })
          .text(formatMoney(item.line_total, currency), colTotalX, rowY, {
            width: colTotalWidth,
            align: 'right'
          });

        rowY += productLines.length > 1 ? 30 : 22;
        doc
          .moveTo(margin, rowY - 6)
          .lineTo(margin + contentWidth, rowY - 6)
          .lineWidth(0.5)
          .strokeColor(PALETTE.hairline)
          .stroke();
      }

      // ── Totals block ─────────────────────────────────────────
      const totalsX = margin + contentWidth - 230;
      const totalsLabelW = 110;
      const totalsValueW = 120;
      let totalsY = rowY + 14;

      const drawTotalRow = (
        label: string,
        value: string,
        opts: { bold?: boolean; size?: number; color?: string } = {}
      ) => {
        const { bold, size = 10, color = PALETTE.ink } = opts;
        doc
          .font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(size)
          .fillColor(bold ? PALETTE.ink : PALETTE.inkSoft)
          .text(label, totalsX, totalsY, {
            width: totalsLabelW,
            align: 'left'
          });
        doc
          .font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(size)
          .fillColor(color)
          .text(value, totalsX + totalsLabelW, totalsY, {
            width: totalsValueW,
            align: 'right'
          });
        totalsY += size + 6;
      };

      drawTotalRow('Subtotal', formatMoney(data.order.sub_total, currency));

      if (data.order.discount_amount && Number(data.order.discount_amount) > 0) {
        drawTotalRow(
          `Descuento${data.order.coupon ? ` (${data.order.coupon})` : ''}`,
          `- ${formatMoney(Number(data.order.discount_amount), currency)}`,
          { color: PALETTE.accentDeep }
        );
      }

      drawTotalRow(
        'Envío',
        formatMoney(Number(data.order.shipping_fee_incl_tax || 0), currency)
      );
      if (data.order.tax_amount && Number(data.order.tax_amount) > 0) {
        drawTotalRow(
          'Impuestos',
          formatMoney(Number(data.order.tax_amount), currency)
        );
      }

      // Divider before grand total
      doc
        .moveTo(totalsX, totalsY + 2)
        .lineTo(totalsX + totalsLabelW + totalsValueW, totalsY + 2)
        .lineWidth(1)
        .strokeColor(PALETTE.ink)
        .stroke();
      totalsY += 10;

      drawTotalRow('TOTAL', formatMoney(data.order.grand_total, currency), {
        bold: true,
        size: 14
      });

      // ── Payment + shipping method footer ─────────────────────
      const footerTop = totalsY + 22;
      doc
        .roundedRect(margin, footerTop, contentWidth, 50, 10)
        .fillColor(PALETTE.paper)
        .fill();
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(PALETTE.mute)
        .text('FORMA DE PAGO', margin + 18, footerTop + 12, {
          characterSpacing: 2
        });
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(PALETTE.ink)
        .text(
          data.order.payment_method_name || '—',
          margin + 18,
          footerTop + 26,
          { width: contentWidth / 2 - 36 }
        );
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(PALETTE.mute)
        .text(
          'MÉTODO DE ENVÍO',
          margin + contentWidth / 2 + 6,
          footerTop + 12,
          { characterSpacing: 2 }
        );
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(PALETTE.ink)
        .text(
          data.order.shipping_method_name || '—',
          margin + contentWidth / 2 + 6,
          footerTop + 26,
          { width: contentWidth / 2 - 24 }
        );

      // ── Bottom signature ─────────────────────────────────────
      doc
        .font('Helvetica-Oblique')
        .fontSize(9)
        .fillColor(PALETTE.mute)
        .text(
          '¡Gracias por elegir Anroy! Esmaltes hechos a mano · Santo Domingo, República Dominicana',
          margin,
          doc.page.height - margin - 14,
          { width: contentWidth, align: 'center' }
        );

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
