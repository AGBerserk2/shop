import {
  commit,
  rollback,
  select,
  startTransaction
} from '@evershop/postgres-query-builder';
import { emit } from '../../../../lib/event/emitter.js';
import { getConnection } from '../../../../lib/postgres/connection.js';
import {
  INTERNAL_SERVER_ERROR,
  INVALID_PAYLOAD,
  OK
} from '../../../../lib/util/httpStatus.js';
import { EvershopRequest } from '../../../../types/request.js';
import { EvershopResponse } from '../../../../types/response.js';
import addOrderActivityLog from '../../services/addOrderActivityLog.js';
import { updateShipmentStatus } from '../../services/updateShipmentStatus.js';

export default async (
  request: EvershopRequest,
  response: EvershopResponse,
  next
) => {
  const connection = await getConnection();
  await startTransaction(connection);
  const { order_id } = request.body;
  try {
    const order = await select()
      .from('order')
      .where('order_id', '=', order_id)
      .load(connection);

    if (!order) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          status: INVALID_PAYLOAD,
          message: 'Invalid order id'
        }
      });
      return;
    }
    const shipment = await select()
      .from('shipment')
      .where('shipment_order_id', '=', order_id)
      .load(connection);

    if (!shipment) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          status: INVALID_PAYLOAD,
          message: 'Shipment was not created'
        }
      });
      return;
    }

    await updateShipmentStatus(order_id, 'delivered', connection);
    /* Add an activity log message — customer-visible, so Spanish. */
    await addOrderActivityLog(
      order.order_id,
      'Pedido entregado',
      true,
      connection
    );
    await commit(connection);

    // Fire after the transaction commits so subscribers see the fresh
    // row state. The customer-facing sendDeliveredEmail subscriber
    // listens for this event.
    await emit('order_delivered', {
      order_id: order.order_id,
      uuid: order.uuid,
      customer_email: order.customer_email,
      customer_full_name: order.customer_full_name,
      order_number: order.order_number
    });

    response.status(OK);
    response.$body = {
      data: {
        order_id: order.order_id,
        shipment_id: shipment.shipment_id
      }
    };
    next();
  } catch (e) {
    await rollback(connection);
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        status: INTERNAL_SERVER_ERROR,
        message: e.message
      }
    });
  }
};
