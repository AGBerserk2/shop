import { insert, select, update } from '@evershop/postgres-query-builder';
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

// Single auth endpoint for every Firebase-issued ID token, whether the
// user authenticated with email/password, Google, or any other provider.
// The frontend always exchanges the credential here once Firebase has
// confirmed it; the server then upserts a customer row keyed by
// firebase_uid (preferred) or email and starts the EverShop session.
export default async (
  request: EvershopRequest,
  response: EvershopResponse,
  next
) => {
  try {
    const { credential, fullName } = (request.body || {}) as {
      credential?: string;
      fullName?: string;
    };
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

    const decoded = await getFirebaseAuth().verifyIdToken(credential, true);
    if (!decoded.email) {
      throw new Error('La cuenta no expone un correo');
    }
    const provider = (decoded.firebase as any)?.sign_in_provider as
      | string
      | undefined;
    // For federated providers Firebase guarantees email ownership; for
    // email/password we trust the credential since the user controls it.
    if (
      provider &&
      provider !== 'password' &&
      decoded.email_verified === false
    ) {
      throw new Error('El correo del proveedor no está verificado');
    }

    const email = decoded.email.toLowerCase();
    const uid = decoded.uid;
    const tokenName =
      (decoded.name as string | undefined) ||
      ((decoded as any).given_name && (decoded as any).family_name
        ? `${(decoded as any).given_name} ${(decoded as any).family_name}`
        : undefined);
    const resolvedFullName =
      (fullName && fullName.trim()) ||
      tokenName ||
      email.split('@')[0];
    const photoUrl =
      ((decoded as any).picture as string | undefined) || null;

    // 1) Lookup by firebase_uid first (stable across email changes).
    let customer = (await select()
      .from('customer')
      .where('firebase_uid', '=', uid)
      .load(pool)) as CustomerRow | null;

    // 2) Fallback to email (handles users created before Firebase).
    if (!customer) {
      customer = (await select()
        .from('customer')
        .where('email', 'ILIKE', email.replace(/%/g, '\\%'))
        .load(pool)) as CustomerRow | null;
      if (customer && !(customer as any).firebase_uid) {
        await update('customer')
          .given({ firebase_uid: uid })
          .where('customer_id', '=', customer.customer_id)
          .execute(pool);
      }
    }

    // Keep photo_url in sync with whatever Firebase has for the user —
    // they might change their Google avatar between logins.
    if (customer && photoUrl && (customer as any).photo_url !== photoUrl) {
      await update('customer')
        .given({ photo_url: photoUrl })
        .where('customer_id', '=', customer.customer_id)
        .execute(pool);
      (customer as any).photo_url = photoUrl;
    }

    // 3) Brand new account — provision a customer row.
    if (!customer) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const inserted = (await insert('customer')
        .given({
          email,
          full_name: resolvedFullName,
          password: hashPassword(randomPassword),
          status: 1,
          group_id: 1,
          is_google_login: provider === 'google.com',
          firebase_uid: uid,
          photo_url: photoUrl
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
      data: { sid: request.sessionID }
    };
    next();
  } catch (error: any) {
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        status: INTERNAL_SERVER_ERROR,
        message: error?.message || translate('Error de autenticación')
      }
    });
  }
};
