import { execute } from '@evershop/postgres-query-builder';

export default async (connection) => {
  await execute(
    connection,
    `CREATE TABLE "delivery" (
  "delivery_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
  "uuid" UUID NOT NULL DEFAULT gen_random_uuid (),
  "delivery_order_id" INT NOT NULL,
  "driver_name" varchar NOT NULL,
  "driver_phone" varchar DEFAULT NULL,
  "access_token" varchar NOT NULL,
  "status" varchar NOT NULL DEFAULT 'assigned',
  "driver_latitude" numeric(10, 7) DEFAULT NULL,
  "driver_longitude" numeric(10, 7) DEFAULT NULL,
  "dest_latitude" numeric(10, 7) DEFAULT NULL,
  "dest_longitude" numeric(10, 7) DEFAULT NULL,
  "location_updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DELIVERY_UUID_UNIQUE" UNIQUE ("uuid"),
  CONSTRAINT "DELIVERY_ACCESS_TOKEN_UNIQUE" UNIQUE ("access_token"),
  CONSTRAINT "FK_ORDER_DELIVERY" FOREIGN KEY ("delivery_order_id") REFERENCES "order" ("order_id") ON DELETE CASCADE
)`
  );

  await execute(
    connection,
    `CREATE INDEX "FK_ORDER_DELIVERY" ON "delivery" ("delivery_order_id")`
  );
};
