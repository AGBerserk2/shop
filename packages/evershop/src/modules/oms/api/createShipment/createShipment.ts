import { select } from '@evershop/postgres-query-builder';
import { emit } from '../../../../lib/event/emitter.js';
import { debug, error } from '../../../../lib/log/logger.js';
import { pool } from '../../../../lib/postgres/connection.js';
import { INTERNAL_SERVER_ERROR, OK } from '../../../../lib/util/httpStatus.js';
import { EvershopRequest } from '../../../../types/request.js';
import { EvershopResponse } from '../../../../types/response.js';
import createShipment from '../../services/createShipment.js';

export default async (
  request: EvershopRequest,
  response: EvershopResponse,
  next
) => {
  const { id } = Array.isArray(request.params.id)
    ? { id: request.params.id[0] }
    : { id: request.params.id };
  // The grid bulk-action posts with no body. Default to an empty object
  // so destructuring doesn't blow up on undefined.
  const body = (request.body as Record<string, unknown>) || {};
  const carrier = (body.carrier as string | null) ?? null;
  const trackingNumber = (body.tracking_number as string | null) ?? null;
  try {
    // Make this endpoint idempotent. The grid bulk-action hits it for
    // every selected order regardless of state; the single-order
    // ShipButton can also be clicked twice if the page didn't reload.
    // If a shipment already exists, just no-op and report success — the
    // customer notification went out the first time so we don't re-emit.
    const order = await select()
      .from('order')
      .where('uuid', '=', id)
      .load(pool);
    if (!order) {
      response.status(INTERNAL_SERVER_ERROR);
      response.json({
        error: {
          status: INTERNAL_SERVER_ERROR,
          message: 'Pedido no encontrado'
        }
      });
      return;
    }
    const existing = await select()
      .from('shipment')
      .where('shipment_order_id', '=', order.order_id)
      .load(pool);
    if (existing) {
      response.status(OK);
      response.$body = { data: existing };
      next();
      return;
    }

    const shipment = await createShipment(id, carrier, trackingNumber);

    // Hand off to subscribers. Errors swallowed so a flaky SMTP doesn't
    // turn into a 500 — the shipment already committed inside the
    // service.
    try {
      await emit('order_shipped', {
        order_id: order.order_id,
        uuid: order.uuid,
        customer_email: order.customer_email,
        customer_full_name: order.customer_full_name,
        order_number: order.order_number,
        carrier,
        tracking_number: trackingNumber
      });
    } catch (subErr) {
      error(subErr);
    }

    response.status(OK);
    response.$body = {
      data: shipment
    };
    next();
  } catch (e) {
    debug(e);
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        status: INTERNAL_SERVER_ERROR,
        message: e.message
      }
    });
  }
};
