-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NUEVO', 'CONTACTADO', 'AGENDADO', 'DESCARTADO', 'CONVERTIDO');

-- CreateTable
CREATE TABLE "TrialRequest" (
    "id" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "babyName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NUEVO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrialRequest_pkey" PRIMARY KEY ("id")
);
