-- AlterTable
ALTER TABLE "ProgramSubscription" ADD COLUMN "babySkills" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "ProgramSubscription" ADD COLUMN "babyBadges" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "ProgramSubscription" ADD COLUMN "specialistNotes" TEXT;
