/*
  Warnings:

  - A unique constraint covering the columns `[trackingCode]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "deviceToken" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "trackingCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_trackingCode_key" ON "Appointment"("trackingCode");
