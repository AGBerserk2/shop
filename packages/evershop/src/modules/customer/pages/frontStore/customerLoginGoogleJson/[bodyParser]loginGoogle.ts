import { insert, select } from '@evershop/postgres-query-builder';
import crypto from 'node:crypto';
import { translate } from '../../../../../lib/locale/translate/translate.js';
import { pool } from '../../../../../lib/postgres/connection.js';
import { hashPassword } from '../../../../../lib/util/passwordHelper.js';
import {
  INTERNAL_SERVER_ERROR,
  INVALID_PAYLOAD,
  OK
} from '../../../../../lib/util/httpStatus.js';
import { getFirebaseAuth } from '../../../../../lib/firebase/admin.js';
import { EvershopRequest } from '../../../../../types/request.js';
import { EvershopResponse } from '../../../../../types/response.js';
import { CustomerRow } from '../../../../../types/db/index.js';
import { buildCustomerPayload } from '../../../services/customer/buildCustomerPayload.js';

export default async (
  request: EvershopRequest,
  response: EvershopResponse,
  next
) => {
  try {
    const { credential } = (request.body || {}) as { credential?: string };
    if (!credential) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          status: INVALID_PAYLOAD,
          message: translate('Credential is required')
        }
      });
      return;
    }

    // Verify the Firebase ID token. This both validates the signature
    // against Firebase's rotating public keys and checks expiration,
    // audience (== project id), and issuer.
    const decoded = await getFirebaseAuth().verifyIdToken(credential, true);

    if (!decoded.email) {
      throw new Error('La cuenta de Google no expone un correo');
    }
    if (decoded.email_verified === false) {
      throw new Error('El correo de Google no está verificado');
    }

    const email = decoded.email.toLowerCase();
    const fullName =
      (decoded.name as string | undefined) ||
      ((decoded as any).given_name && (decoded as any).family_name
        ? `${(decoded as any).given_name} ${(decoded as any).family_name}`
        : undefined) ||
      email.split('@')[0];

    // Look up an existing customer by email
    let customer = (await select()
      .from('customer')
      .where('email', 'ILIKE', email.replace(/%/g, '\\%'))
      .load(pool)) as CustomerRow | null;

    if (!customer) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const inserted = (await insert('customer')
        .given({
          email,
          full_name: fullName,
          password: hashPassword(randomPassword),
          status: 1,
          group_id: 1,
          is_google_login: true
        })
        .execute(pool)) as CustomerRow;
      customer = inserted;
    } else if (Number(customer.status) !== 1) {
      response.status(INTERNAL_SERVER_ERROR);
      response.json({
        error: {
          status: INTERNAL_SERVER_ERROR,
          message: translate('La cuenta está deshabilitada')
        }
      });
      return;
    }

    if (request.session) {
      (request.session as any).customerID = customer.customer_id;
    }
    request.locals.customer = buildCustomerPayload(customer);

    response.status(OK);
    response.$body = {
      data: {
        sid: request.sessionID
      }
    };
    next();
  } catch (error: any) {
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        status: INTERNAL_SERVER_ERROR,
        message:
          error?.message || translate('Error de autenticación con Google')
      }
    });
  }
};
