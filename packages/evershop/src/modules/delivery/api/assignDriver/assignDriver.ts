import { error } from '../../../../lib/log/logger.js';
import { getBaseUrl } from '../../../../lib/util/getBaseUrl.js';
import {
  INTERNAL_SERVER_ERROR,
  INVALID_PAYLOAD,
  OK
} from '../../../../lib/util/httpStatus.js';
import { EvershopRequest } from '../../../../types/request.js';
import { EvershopResponse } from '../../../../types/response.js';
import { createDelivery } from '../../services/createDelivery.js';

export default async (
  request: EvershopRequest,
  response: EvershopResponse,
  next
) => {
  try {
    const { order_id, driver_name, driver_phone } = (request.body ||
      {}) as Record<string, string>;
    if (!order_id || !driver_name) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          status: INVALID_PAYLOAD,
          message: 'Faltan el pedido o el nombre del repartidor'
        }
      });
      return;
    }

    const delivery = await createDelivery(
      order_id,
      driver_name,
      driver_phone || null
    );

    response.status(OK);
    response.$body = {
      data: {
        uuid: delivery.uuid,
        status: delivery.status,
        accessToken: delivery.access_token,
        driverUrl: `${getBaseUrl()}/entrega/${delivery.access_token}`
      }
    };
    next();
  } catch (e) {
    error(e);
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        status: INTERNAL_SERVER_ERROR,
        message: e.message
      }
    });
  }
};
