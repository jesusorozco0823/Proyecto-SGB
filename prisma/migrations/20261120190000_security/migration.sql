-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'no_show';

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('waived', 'pending', 'paid');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid');
CREATE TYPE "WaitlistStatus" AS ENUM ('waiting', 'notified');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "totpSecret" TEXT,
ADD COLUMN "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "noShowCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "blockedAt" TIMESTAMP(3),
ADD COLUMN "blockReason" TEXT;

ALTER TABLE "Appointment" ADD COLUMN "depositStatus" "DepositStatus" NOT NULL DEFAULT 'waived',
ADD COLUMN "depositAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE "Order" ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending';

ALTER TABLE "LunchPolicy" ADD COLUMN "depositAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "commissionPercent" INTEGER NOT NULL DEFAULT 40,
ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;

ALTER TABLE "BarberService" ADD COLUMN "price" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Holiday" (
    "date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("date")
);

CREATE TABLE "DayOff" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    CONSTRAINT "DayOff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'waiting',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockAlert" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Session_userId_revokedAt_idx" ON "Session"("userId", "revokedAt");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE UNIQUE INDEX "DayOff_barberId_date_key" ON "DayOff"("barberId", "date");
CREATE UNIQUE INDEX "WaitlistEntry_userId_barberId_serviceId_date_key" ON "WaitlistEntry"("userId", "barberId", "serviceId", "date");
CREATE INDEX "StockAlert_seen_createdAt_idx" ON "StockAlert"("seen", "createdAt");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DayOff" ADD CONSTRAINT "DayOff_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "BarberService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
