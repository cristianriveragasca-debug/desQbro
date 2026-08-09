-- Split Client into (Client = child identity) + (ProgramSubscription = one plan per program),
-- so a child can be enrolled in more than one program without duplicating the client record.

-- CreateTable
CREATE TABLE "ProgramSubscription" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "program" "Program" NOT NULL,
    "planType" "PlanType" NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'TOTAL',
    "installments" INTEGER NOT NULL DEFAULT 1,
    "customAmount" DECIMAL(10,2),
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramSubscription_pkey" PRIMARY KEY ("id")
);

-- Migrate existing per-client program/plan data into one subscription per client
INSERT INTO "ProgramSubscription"
  (id, "clientId", program, "planType", "paymentMode", installments, "customAmount", "paymentDate", "dueDate", status, "createdAt", "updatedAt")
SELECT
  id || '-sub1', id, program, "planType", "paymentMode", installments, "customAmount", "paymentDate", "dueDate", status, "createdAt", "updatedAt"
FROM "Client";

-- CreateIndex
CREATE UNIQUE INDEX "ProgramSubscription_clientId_program_key" ON "ProgramSubscription"("clientId", "program");

-- AddForeignKey
ALTER TABLE "ProgramSubscription" ADD CONSTRAINT "ProgramSubscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Point Payment at the subscription instead of the client directly
ALTER TABLE "Payment" ADD COLUMN "subscriptionId" TEXT;
UPDATE "Payment" SET "subscriptionId" = "clientId" || '-sub1';
ALTER TABLE "Payment" ALTER COLUMN "subscriptionId" SET NOT NULL;

ALTER TABLE "Payment" DROP CONSTRAINT "Payment_clientId_fkey";
ALTER TABLE "Payment" DROP COLUMN "clientId";
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "ProgramSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Client no longer carries program/plan/payment fields directly
ALTER TABLE "Client" DROP COLUMN "program";
ALTER TABLE "Client" DROP COLUMN "planType";
ALTER TABLE "Client" DROP COLUMN "paymentMode";
ALTER TABLE "Client" DROP COLUMN "installments";
ALTER TABLE "Client" DROP COLUMN "customAmount";
ALTER TABLE "Client" DROP COLUMN "paymentDate";
ALTER TABLE "Client" DROP COLUMN "dueDate";
ALTER TABLE "Client" DROP COLUMN "status";
