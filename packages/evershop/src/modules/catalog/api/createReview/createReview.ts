import {
  execute,
  insert,
  select
} from '@evershop/postgres-query-builder';
import { pool } from '../../../../lib/postgres/connection.js';
import {
  CREATED,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  INVALID_PAYLOAD,
  UNAUTHORIZED
} from '../../../../lib/util/httpStatus.js';

interface ReviewBody {
  productId?: number | string;
  rating?: number | string;
  title?: string;
  comment?: string;
}

export default async (request, response, next) => {
  try {
    const customer = request.locals?.customer || (request as any).customer;
    if (!customer || !customer.customer_id) {
      response.status(UNAUTHORIZED);
      response.json({
        error: {
          message: 'Debes iniciar sesión para dejar una reseña.',
          status: UNAUTHORIZED
        }
      });
      return;
    }

    const body: ReviewBody = request.body || {};
    const productId = Number(body.productId);
    const rating = Number(body.rating);
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : null;
    const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 2000) : null;

    if (!Number.isInteger(productId) || productId <= 0) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: { message: 'productId inválido', status: INVALID_PAYLOAD }
      });
      return;
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: { message: 'La calificación debe ser entre 1 y 5.', status: INVALID_PAYLOAD }
      });
      return;
    }

    // Verify customer purchased this product on a completed/processing/closed order.
    const purchased = await pool.query(`SELECT o.order_id
       FROM "order_item" oi
       JOIN "order" o ON o.order_id = oi.order_item_order_id
       WHERE oi.product_id = $1
         AND o.customer_id = $2
         AND o.status IN ('completed', 'closed', 'processing')
       ORDER BY o.created_at DESC
       LIMIT 1`,
      [productId, customer.customer_id]
    );
    if (purchased.rows.length === 0) {
      response.status(FORBIDDEN);
      response.json({
        error: {
          message: 'Solo puedes reseñar productos que hayas comprado.',
          status: FORBIDDEN
        }
      });
      return;
    }
    const orderId = purchased.rows[0].order_id;

    // Already reviewed?
    const eq = select().from('product_review');
    eq.where('product_id', '=', productId);
    eq.andWhere('customer_id', '=', customer.customer_id);
    const existing = await eq.load(pool);
    if (existing) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          message: 'Ya dejaste una reseña para este producto.',
          status: INVALID_PAYLOAD
        }
      });
      return;
    }

    const customerName =
      customer.full_name ||
      [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
      customer.email ||
      null;

    const inserted = await insert('product_review')
      .given({
        product_id: productId,
        customer_id: customer.customer_id,
        order_id: orderId,
        rating,
        title,
        comment,
        customer_name: customerName,
        customer_email: customer.email,
        status: 'pending'
      })
      .execute(pool);

    response.status(CREATED);
    response.json({
      data: {
        reviewId: (inserted as any)?.insertId,
        message: 'Reseña enviada. La revisaremos antes de publicarla.'
      }
    });
  } catch (e: any) {
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        message: e?.message || 'Error guardando la reseña',
        status: INTERNAL_SERVER_ERROR
      }
    });
  }
};
