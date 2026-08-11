-- AlterTable
ALTER TABLE "ProgramSubscription" ADD COLUMN "soccerBadges" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "ProgramSubscription" ADD COLUMN "closingLetter" TEXT;

-- CreateTable
CREATE TABLE "MonthlyEvaluation" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "skills" JSONB NOT NULL,
    "sessionsAttended" INTEGER NOT NULL,
    "sessionsTotal" INTEGER NOT NULL,
    "strength" TEXT NOT NULL,
    "focusArea" TEXT NOT NULL,
    "specialNote" TEXT,
    "nextGoal" TEXT NOT NULL,
    "parentPhrase" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioMoment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioMoment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyEvaluation_subscriptionId_month_key" ON "MonthlyEvaluation"("subscriptionId", "month");

-- AddForeignKey
ALTER TABLE "MonthlyEvaluation" ADD CONSTRAINT "MonthlyEvaluation_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "ProgramSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioMoment" ADD CONSTRAINT "PortfolioMoment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "ProgramSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
