-- CreateTable
CREATE TABLE "ClientPhoto" (
    "clientId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientPhoto_pkey" PRIMARY KEY ("clientId")
);

-- AddForeignKey
ALTER TABLE "ClientPhoto" ADD CONSTRAINT "ClientPhoto_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
