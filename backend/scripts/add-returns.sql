CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'EXCHANGED');
CREATE TYPE "ReturnType" AS ENUM ('REFUND', 'EXCHANGE');

CREATE TABLE IF NOT EXISTS "returns" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "returnNumber" SERIAL,
  "orderId"      TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "type"         "ReturnType" NOT NULL DEFAULT 'REFUND',
  "status"       "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
  "reason"       TEXT NOT NULL,
  "adminNote"    TEXT DEFAULT '',
  "refundAmount" DOUBLE PRECISION,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "returns_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "returns_returnNumber_key" UNIQUE ("returnNumber"),
  CONSTRAINT "returns_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id"),
  CONSTRAINT "returns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id")
);

CREATE TABLE IF NOT EXISTS "return_items" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "returnId"    TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "quantity"    INTEGER NOT NULL,
  CONSTRAINT "return_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "return_items_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "returns"("id") ON DELETE CASCADE,
  CONSTRAINT "return_items_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id")
);
