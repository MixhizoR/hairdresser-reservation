-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'BARBER',
    "name" TEXT,
    "phone" TEXT,
    "photoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "level" TEXT NOT NULL DEFAULT 'SENIOR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "notificationSoundUrl" TEXT,
    "notificationSoundName" TEXT
);
INSERT INTO "new_User" ("createdAt", "id", "isActive", "name", "notificationSoundName", "notificationSoundUrl", "password", "phone", "photoUrl", "role", "updatedAt", "username") SELECT "createdAt", "id", "isActive", "name", "notificationSoundName", "notificationSoundUrl", "password", "phone", "photoUrl", "role", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
