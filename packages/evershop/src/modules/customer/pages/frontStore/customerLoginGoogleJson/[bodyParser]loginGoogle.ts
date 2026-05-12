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
import { EvershopRequest } from '../../../../../types/request.js';
import { EvershopResponse } from '../../../../../types/response.js';
import { CustomerRow } from '../../../../../types/db/index.js';
import { buildCustomerPayload } from '../../../services/customer/buildCustomerPayload.js';

// Verifies a Google Identity Services ID token using Google's public
// tokeninfo endpoint. Returns the verified payload (email, sub, name, etc.)
// or throws if the token is invalid or its audience does not match the
// configured GOOGLE_CLIENT_ID.
async function verifyGoogleToken(idToken: string): Promise<{
  sub: string;
  email: string;
  email_verified: string | boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  aud: string;
  iss: string;
  exp: string | number;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google login no está configurado en el servidor');
  }

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!res.ok) {
    throw new Error('No se pudo verificar el token de Google');
  }
  const payload = (await res.json()) as any;

  const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
  if (!validIssuers.includes(payload.iss)) {
    throw new Error('Emisor de Google inválido');
  }
  if (payload.aud !== clientId) {
    throw new Error('La audiencia del token no coincide');
  }
  const now = Math.floor(Date.now() / 1000);
  if (Number(payload.exp) <= now) {
    throw new Error('El token de Google ha expirado');
  }
  if (
    payload.email_verified !== true &&
    payload.email_verified !== 'true'
  ) {
    throw new Error('El correo de Google no está verificado');
  }
  if (!payload.email) {
    throw new Error('Google no retornó un correo electrónico');
  }
  return payload;
}

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

    const payload = await verifyGoogleToken(credential);
    const email = payload.email.toLowerCase();
    const fullName =
      payload.name ||
      [payload.given_name, payload.family_name].filter(Boolean).join(' ') ||
      email.split('@')[0];

    // Look up an existing customer by email
    let customer = (await select()
      .from('customer')
      .where('email', 'ILIKE', email.replace(/%/g, '\\%'))
      .load(pool)) as CustomerRow | null;

    // If no account exists, create one on the fly. We don't have a real
    // password from Google so we store a strong random one — the user will
    // sign in via Google going forward, or reset their password to use the
    // email/password form.
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
        message: error?.message || translate('Error de autenticación con Google')
      }
    });
  }
};
