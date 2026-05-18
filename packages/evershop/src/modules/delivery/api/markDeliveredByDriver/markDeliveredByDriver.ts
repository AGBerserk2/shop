import {
  commit,
  rollback,
  select,
  startTransaction,
  update
} from '@evershop/postgres-query-builder';
import { emit } from '../../../../lib/event/emitter.js';
import { error } from '../../../../lib/log/logger.js';
import { getConnection, pool } from '../../../../lib/postgres/connection.js';
import {
  INTERNAL_SERVER_ERROR,
  INVALID_PAYLOAD,
  OK
} from '../../../../lib/util/httpStatus.js';
import { EvershopRequest } from '../../../../types/request.js';
import { EvershopResponse } from '../../../../types/response.js';
import addOrderActivityLog from '../../../oms/services/addOrderActivityLog.js';
import { updateShipmentStatus } from '../../../oms/services/updateShipmentStatus.js';

// Public endpoint — the driver taps "Entregado". Marks the delivery done
// and runs the order's delivered flow (reusing the OMS services), so the
// customer gets the existing order_delivered email.
export default async (
  request: EvershopRequest,
  response: EvershopResponse,
  next
) => {
  try {
    const { token } = (request.body || {}) as Record<string, string>;
    if (!token) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: { status: INVALID_PAYLOAD, message: 'Falta el token de la entrega' }
      });
      return;
    }

    const delivery = await select()
      .from('delivery')
      .where('access_token', '=', token)
      .load(pool);
    if (!delivery) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: { status: INVALID_PAYLOAD, message: 'Entrega no encontrada' }
      });
      return;
    }
    if (delivery.status === 'delivered') {
      response.status(OK);
      response.$body = { data: { success: true, alreadyDelivered: true } };
      next();
      return;
    }

    const order = await select()
      .from('order')
      .where('order_id', '=', delivery.delivery_order_id)
      .load(pool);
    if (!order) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: { status: INVALID_PAYLOAD, message: 'Pedido no encontrado' }
      });
      return;
    }

    const connection = await getConnection();
    try {
      await startTransaction(connection);
      await updateShipmentStatus(order.order_id, 'delivered', connection);
      await addOrderActivityLog(
        order.order_id,
        'Pedido entregado por el repartidor',
        true,
        connection
      );
      await update('delivery')
        .given({ status: 'delivered', updated_at: new Date() })
        .where('delivery_id', '=', delivery.delivery_id)
        .execute(connection);
      await commit(connection);
    } catch (txErr) {
      await rollback(connection);
      throw txErr;
    }

    // Fire after commit — the customer-facing sendDeliveredEmail listens.
    await emit('order_delivered', {
      order_id: order.order_id,
      uuid: order.uuid,
      customer_email: order.customer_email,
      customer_full_name: order.customer_full_name,
      order_number: order.order_number
    });

    response.status(OK);
    response.$body = { data: { success: true } };
    next();
  } catch (e) {
    error(e);
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: { status: INTERNAL_SERVER_ERROR, message: e.message }
    });
  }
};
