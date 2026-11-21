-- CreateEnum
CREATE TYPE "CreditKind" AS ENUM ('owed', 'prepaid');

-- CreateEnum
CREATE TYPE "CreditMeasure" AS ENUM ('cuts', 'budget');

-- CreateEnum
CREATE TYPE "CreditStatus" AS ENUM ('pending_barber', 'barber_rejected', 'pending_admin', 'admin_rejected', 'active', 'closed');

-- CreateTable
CREATE TABLE "CreditRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "kind" "CreditKind" NOT NULL,
    "note" TEXT,
    "status" "CreditStatus" NOT NULL DEFAULT 'pending_barber',
    "measure" "CreditMeasure",
    "limitCuts" INTEGER,
    "limitAmount" DECIMAL(10,2),
    "usedCuts" INTEGER NOT NULL DEFAULT 0,
    "usedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "adminUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditUse" (
    "id" TEXT NOT NULL,
    "creditId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "cuts" INTEGER NOT NULL DEFAULT 0,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditUse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreditRequest_clientId_barberId_status_idx" ON "CreditRequest"("clientId", "barberId", "status");

-- CreateIndex
CREATE INDEX "CreditRequest_barberId_status_idx" ON "CreditRequest"("barberId", "status");

-- CreateIndex
CREATE INDEX "CreditRequest_status_createdAt_idx" ON "CreditRequest"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreditUse_appointmentId_key" ON "CreditUse"("appointmentId");

-- AddForeignKey
ALTER TABLE "CreditRequest" ADD CONSTRAINT "CreditRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditRequest" ADD CONSTRAINT "CreditRequest_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditUse" ADD CONSTRAINT "CreditUse_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "CreditRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditUse" ADD CONSTRAINT "CreditUse_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
