-- CreateEnum
CREATE TYPE "SwimLevel" AS ENUM ('EXPLORACION', 'DESARROLLO', 'EXPERTOS', 'EGRESADO');

-- AlterTable
ALTER TABLE "ProgramSubscription" ADD COLUMN "swimLevel" "SwimLevel" NOT NULL DEFAULT 'EXPLORACION';
ALTER TABLE "ProgramSubscription" ADD COLUMN "swimChecklist" JSONB NOT NULL DEFAULT '{}';
