-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('NOMINA', 'ARRIENDO', 'SERVICIOS_PUBLICOS', 'IMPLEMENTOS', 'MARKETING', 'MANTENIMIENTO', 'ADMINISTRATIVO', 'OTROS');

-- CreateEnum
CREATE TYPE "ExpenseMethod" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'OTRO');

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "concept" TEXT NOT NULL,
    "provider" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "ExpenseMethod" NOT NULL DEFAULT 'TRANSFERENCIA',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);
