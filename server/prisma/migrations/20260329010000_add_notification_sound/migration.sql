-- AlterTable: Add notification sound preference to User table
ALTER TABLE "User" ADD COLUMN "notificationSoundUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "notificationSoundName" TEXT;
