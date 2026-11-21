-- CreateEnum
CREATE TYPE "Attendance" AS ENUM ('pending', 'confirmed', 'declined');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "attendance" "Attendance" NOT NULL DEFAULT 'pending';
