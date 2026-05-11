import { execute } from '@evershop/postgres-query-builder';

export default async (connection) => {
  // Reviews dejadas por clientes que compraron productos. Moderadas vía status.
  // Una review por (customer, product) — un cliente puede actualizar la suya
  // pero no dejar varias. Reviews de invitados (sin customer_id) son posibles
  // si en el futuro se habilita.
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "product_review" (
      "product_review_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
      "product_id" INT NOT NULL,
      "customer_id" INT DEFAULT NULL,
      "order_id" INT DEFAULT NULL,
      "rating" SMALLINT NOT NULL,
      "title" varchar DEFAULT NULL,
      "comment" text DEFAULT NULL,
      "customer_name" varchar DEFAULT NULL,
      "customer_email" varchar DEFAULT NULL,
      "status" varchar NOT NULL DEFAULT 'pending',
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PRODUCT_REVIEW_UUID_UNIQUE" UNIQUE ("uuid"),
      CONSTRAINT "PRODUCT_REVIEW_RATING_RANGE" CHECK (rating BETWEEN 1 AND 5),
      CONSTRAINT "PRODUCT_REVIEW_STATUS_VALID" CHECK (status IN ('pending', 'approved', 'rejected')),
      CONSTRAINT "FK_PRODUCT_REVIEW_PRODUCT" FOREIGN KEY ("product_id") REFERENCES "product" ("product_id") ON DELETE CASCADE,
      CONSTRAINT "FK_PRODUCT_REVIEW_CUSTOMER" FOREIGN KEY ("customer_id") REFERENCES "customer" ("customer_id") ON DELETE SET NULL,
      CONSTRAINT "FK_PRODUCT_REVIEW_ORDER" FOREIGN KEY ("order_id") REFERENCES "order" ("order_id") ON DELETE SET NULL,
      CONSTRAINT "UNIQUE_REVIEW_PER_CUSTOMER_PRODUCT" UNIQUE ("customer_id", "product_id")
    );`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_product_review_product_status" ON "product_review" ("product_id", "status");`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_product_review_customer" ON "product_review" ("customer_id");`
  );

  // Tracker de emails de invitación a calificar — soporta el cron de Fase C.
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "review_request" (
      "review_request_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
      "order_id" INT NOT NULL,
      "customer_id" INT DEFAULT NULL,
      "customer_email" varchar NOT NULL,
      "send_after" TIMESTAMP WITH TIME ZONE NOT NULL,
      "status" varchar NOT NULL DEFAULT 'pending',
      "sent_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "REVIEW_REQUEST_UUID_UNIQUE" UNIQUE ("uuid"),
      CONSTRAINT "REVIEW_REQUEST_STATUS_VALID" CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
      CONSTRAINT "FK_REVIEW_REQUEST_ORDER" FOREIGN KEY ("order_id") REFERENCES "order" ("order_id") ON DELETE CASCADE,
      CONSTRAINT "UNIQUE_REVIEW_REQUEST_PER_ORDER" UNIQUE ("order_id")
    );`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_review_request_pending" ON "review_request" ("status", "send_after");`
  );
};
