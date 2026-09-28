-- CreateEnum
CREATE TYPE "MovimienteStatus" AS ENUM ('PENDIENTE_PAGO', 'PAGADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "MovimienteRegistration" (
    "id" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "eps" TEXT,
    "medicalNotes" TEXT,
    "imageConsent" BOOLEAN NOT NULL DEFAULT false,
    "status" "MovimienteStatus" NOT NULL DEFAULT 'PENDIENTE_PAGO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimienteRegistration_pkey" PRIMARY KEY ("id")
);
