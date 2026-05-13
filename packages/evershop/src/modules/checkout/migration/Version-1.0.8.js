import { execute } from '@evershop/postgres-query-builder';

// Seed a default Dominican Republic shipping zone with one method
// ("Envío estándar", 150 DOP fixed) so the checkout flow has something
// to offer on a fresh deploy. Operators can edit / disable / extend
// these from /admin/setting/shipping at any time.
//
// Idempotent: every step is no-op when the row already exists.
export default async (connection) => {
  // 1) Zone for Dominican Republic
  await execute(
    connection,
    `INSERT INTO shipping_zone (name, country)
       SELECT 'República Dominicana', 'DO'
       WHERE NOT EXISTS (
         SELECT 1 FROM shipping_zone WHERE country = 'DO'
       )`
  );

  // 2) "Envío estándar" method
  await execute(
    connection,
    `INSERT INTO shipping_method (name)
       SELECT 'Envío estándar'
       WHERE NOT EXISTS (
         SELECT 1 FROM shipping_method WHERE name = 'Envío estándar'
       )`
  );

  // 3) Link the method to the zone with a fixed cost. Skip if already
  //    linked so re-runs are safe.
  await execute(
    connection,
    `INSERT INTO shipping_zone_method (zone_id, method_id, is_enabled, cost)
       SELECT z.shipping_zone_id, m.shipping_method_id, TRUE, 150.0000
       FROM shipping_zone z
       CROSS JOIN shipping_method m
       WHERE z.country = 'DO'
         AND m.name = 'Envío estándar'
         AND NOT EXISTS (
           SELECT 1 FROM shipping_zone_method zm
            WHERE zm.zone_id = z.shipping_zone_id
              AND zm.method_id = m.shipping_method_id
         )`
  );
};
