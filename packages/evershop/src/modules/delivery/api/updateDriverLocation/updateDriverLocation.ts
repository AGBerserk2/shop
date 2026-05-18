import { error } from '../../../../lib/log/logger.js';
import {
  INTERNAL_SERVER_ERROR,
  INVALID_PAYLOAD,
  OK
} from '../../../../lib/util/httpStatus.js';
import { EvershopRequest } from '../../../../types/request.js';
import { EvershopResponse } from '../../../../types/response.js';
import { updateDeliveryLocation } from '../../services/updateDeliveryLocation.js';

// Public endpoint — the driver page posts GPS here. The per-delivery
// token in the body is the credential.
export default async (
  request: EvershopRequest,
  response: EvershopResponse,
  next
) => {
  try {
    const body = (request.body || {}) as Record<string, unknown>;
    const token = body.token as string;
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    if (!token || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          status: INVALID_PAYLOAD,
          message: 'Datos de ubicación inválidos'
        }
      });
      return;
    }

    await updateDeliveryLocation(token, latitude, longitude);

    response.status(OK);
    response.$body = { data: { success: true } };
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
