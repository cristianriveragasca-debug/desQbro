-- AlterTable
ALTER TABLE "SpecialEvent" ADD COLUMN "isMatch" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "EventCallUp" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventCallUp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventCallUp_eventId_clientId_key" ON "EventCallUp"("eventId", "clientId");

-- AddForeignKey
ALTER TABLE "EventCallUp" ADD CONSTRAINT "EventCallUp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SpecialEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCallUp" ADD CONSTRAINT "EventCallUp_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
