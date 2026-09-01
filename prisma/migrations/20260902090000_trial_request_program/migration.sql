-- AlterTable
ALTER TABLE "TrialRequest" ADD COLUMN "program" "Program" NOT NULL DEFAULT 'DESQBRO_BEBES';
ALTER TABLE "TrialRequest" ALTER COLUMN "program" DROP DEFAULT;
