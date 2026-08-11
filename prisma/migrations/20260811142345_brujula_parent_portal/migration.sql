-- CreateEnum
CREATE TYPE "ProgressLevel" AS ENUM ('INICIACION', 'BASICO', 'INTERMEDIO', 'AVANZADO', 'EXPERTO');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "parentAccountId" TEXT;

-- AlterTable
ALTER TABLE "ProgramSubscription" ADD COLUMN     "progressLevel" "ProgressLevel" NOT NULL DEFAULT 'INICIACION';

-- CreateTable
CREATE TABLE "ParentAccount" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachNote" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "program" "Program",
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParentAccount_phone_key" ON "ParentAccount"("phone");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_parentAccountId_fkey" FOREIGN KEY ("parentAccountId") REFERENCES "ParentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachNote" ADD CONSTRAINT "CoachNote_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "ProgramSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
