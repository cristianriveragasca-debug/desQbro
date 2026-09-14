-- CreateEnum
CREATE TYPE "ProgramEventType" AS ENUM ('ALTA', 'BAJA');

-- CreateTable
CREATE TABLE "ProgramHistoryEvent" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "program" "Program" NOT NULL,
    "eventType" "ProgramEventType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramHistoryEvent_pkey" PRIMARY KEY ("id")
);
