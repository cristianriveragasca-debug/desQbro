/*
  Warnings:

  - You are about to drop the column `sport` on the `Client` table. All the data in the column will be lost.
  - Added the required column `dueDate` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentDate` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planType` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `program` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Made the column `birthDate` on table `Client` required. This step will fail if there are existing NULL values in that column.
  - Made the column `guardianName` on table `Client` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Program" AS ENUM ('DESQBRO_BEBES', 'DESQBRO_AQUA', 'GUAGUAS_SOCCER');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('MENSUAL', 'TRIMESTRAL', 'SEMESTRAL');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('TOTAL', 'CUOTAS');

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "sport",
ADD COLUMN     "dueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "installments" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "paymentDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "paymentMode" "PaymentMode" NOT NULL DEFAULT 'TOTAL',
ADD COLUMN     "planType" "PlanType" NOT NULL,
ADD COLUMN     "program" "Program" NOT NULL,
ALTER COLUMN "birthDate" SET NOT NULL,
ALTER COLUMN "guardianName" SET NOT NULL;
