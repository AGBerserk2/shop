import { select } from '@evershop/postgres-query-builder';
import { emit } from '../../../../lib/event/emitter.js';
import { pool } from '../../../../lib/postgres/connection.js';
import { INTERNAL_SERVER_ERROR, OK } from '../../../../lib/util/httpStatus.js';
import cancelOrder from '../../services/cancelOrder.js';

export default async (request, response, next) => {
  try {
    const { reason } = request.body;
    await cancelOrder(request.params.id, reason);

    // After the cancel transaction commits, hand off to subscribers so
    // the customer-facing cancellation email can go out.
    const order = await select()
      .from('order')
      .where('uuid', '=', request.params.id)
      .load(pool);
    if (order) {
      await emit('order_canceled', {
        order_id: order.order_id,
        uuid: order.uuid,
        customer_email: order.customer_email,
        customer_full_name: order.customer_full_name,
        order_number: order.order_number,
        reason: reason || null
      });
    }

    response.status(OK);
    response.json({
      data: {}
    });
  } catch (err) {
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        status: INTERNAL_SERVER_ERROR,
        message: err.message
      }
    });
  }
};
