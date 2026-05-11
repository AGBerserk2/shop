import { execute } from '@evershop/postgres-query-builder';
import { pool } from '../../../../lib/postgres/connection.js';
import {
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  OK
} from '../../../../lib/util/httpStatus.js';

export default async (request, response, next) => {
  try {
    const uuid = request.params.id;
    const r = await pool.query(`DELETE FROM product_review WHERE uuid = $1 RETURNING product_review_id`,
      [uuid]
    );
    if (r.rows.length === 0) {
      response.status(NOT_FOUND);
      response.json({ error: { message: 'Reseña no encontrada', status: NOT_FOUND } });
      return;
    }
    response.status(OK);
    response.json({ data: { ok: true } });
  } catch (e: any) {
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: { message: e?.message || 'Error', status: INTERNAL_SERVER_ERROR }
    });
  }
};
