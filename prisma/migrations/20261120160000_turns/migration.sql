-- CreateEnum
CREATE TYPE "TurnStatus" AS ENUM ('open', 'booked');

-- CreateTable
CREATE TABLE "LunchPolicy" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "durationMinutes" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LunchPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarberService" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "description" TEXT,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BarberService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayPlan" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openMin" INTEGER NOT NULL,
    "closeMin" INTEGER NOT NULL,
    "lunchStartMin" INTEGER NOT NULL,
    "effectiveCloseMin" INTEGER NOT NULL,

    CONSTRAINT "DayPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurnTemplate" (
    "id" TEXT NOT NULL,
    "dayPlanId" TEXT NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "serviceId" TEXT,
    "isExtra" BOOLEAN NOT NULL DEFAULT false,
    "placedByBarber" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TurnTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayTurn" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "templateId" TEXT,
    "date" DATE NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "serviceId" TEXT,
    "status" "TurnStatus" NOT NULL DEFAULT 'open',
    "isExtra" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DayTurn_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "barberServiceId" TEXT,
ADD COLUMN "dayTurnId" TEXT;

-- CreateIndex
CREATE INDEX "BarberService_barberId_active_idx" ON "BarberService"("barberId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DayPlan_barberId_dayOfWeek_key" ON "DayPlan"("barberId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "TurnTemplate_dayPlanId_startMin_idx" ON "TurnTemplate"("dayPlanId", "startMin");

-- CreateIndex
CREATE INDEX "DayTurn_barberId_date_status_idx" ON "DayTurn"("barberId", "date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DayTurn_barberId_date_startMin_key" ON "DayTurn"("barberId", "date", "startMin");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_dayTurnId_key" ON "Appointment"("dayTurnId");

-- AddForeignKey
ALTER TABLE "BarberService" ADD CONSTRAINT "BarberService_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayPlan" ADD CONSTRAINT "DayPlan_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnTemplate" ADD CONSTRAINT "TurnTemplate_dayPlanId_fkey" FOREIGN KEY ("dayPlanId") REFERENCES "DayPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnTemplate" ADD CONSTRAINT "TurnTemplate_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "BarberService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayTurn" ADD CONSTRAINT "DayTurn_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayTurn" ADD CONSTRAINT "DayTurn_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TurnTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayTurn" ADD CONSTRAINT "DayTurn_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "BarberService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_barberServiceId_fkey" FOREIGN KEY ("barberServiceId") REFERENCES "BarberService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_dayTurnId_fkey" FOREIGN KEY ("dayTurnId") REFERENCES "DayTurn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
