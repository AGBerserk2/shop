import { insert, select, update } from '@evershop/postgres-query-builder';
import crypto from 'node:crypto';
import { translate } from '../../../../../lib/locale/translate/translate.js';
import { error as logError } from '../../../../../lib/log/logger.js';
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

// Cache whether the photo_url column has been confirmed present so we
// don't ask Postgres on every login. We assume it exists until a query
// proves otherwise (then we flip this and skip future writes).
let photoUrlSupported = true;

function isMissingColumnError(e: any, col: string): boolean {
  const msg = (e?.message || '').toLowerCase();
  return (
    e?.code === '42703' ||
    msg.includes(`column "${col}" of relation`) ||
    msg.includes(`column "${col}" does not exist`) ||
    msg.includes(`"${col}" does not exist`)
  );
}

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
    // they might change their Google avatar between logins. If the
    // photo_url column doesn't exist yet (migration 1.0.6 hasn't run
    // on this DB), swallow the error and move on so the login still
    // succeeds.
    if (
      photoUrlSupported &&
      customer &&
      photoUrl &&
      (customer as any).photo_url !== photoUrl
    ) {
      try {
        await update('customer')
          .given({ photo_url: photoUrl })
          .where('customer_id', '=', customer.customer_id)
          .execute(pool);
        (customer as any).photo_url = photoUrl;
      } catch (e: any) {
        if (isMissingColumnError(e, 'photo_url')) {
          photoUrlSupported = false;
        } else {
          throw e;
        }
      }
    }

    // 3) Brand new account — provision a customer row.
    if (!customer) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const baseRow: Record<string, any> = {
        email,
        full_name: resolvedFullName,
        password: hashPassword(randomPassword),
        status: 1,
        group_id: 1,
        is_google_login: provider === 'google.com',
        firebase_uid: uid
      };
      if (photoUrlSupported && photoUrl) baseRow.photo_url = photoUrl;
      try {
        customer = (await insert('customer')
          .given(baseRow)
          .execute(pool)) as CustomerRow;
      } catch (e: any) {
        if (isMissingColumnError(e, 'photo_url')) {
          photoUrlSupported = false;
          delete baseRow.photo_url;
          customer = (await insert('customer')
            .given(baseRow)
            .execute(pool)) as CustomerRow;
        } else {
          throw e;
        }
      }
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
  } catch (err: any) {
    // Log full stack server-side so the operator can see what blew up,
    // but only return the high-level message to the client.
    logError(err);
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        status: INTERNAL_SERVER_ERROR,
        message: err?.message || translate('Error de autenticación'),
        code: err?.code
      }
    });
  }
};
