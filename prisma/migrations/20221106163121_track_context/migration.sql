/*
  Warnings:

  - You are about to drop the column `isLive` on the `Station` table. All the data in the column will be lost.
  - You are about to drop the column `lastPlayed` on the `Station` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "PlaybackContext" (
    "stationId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "startTime" INTEGER NOT NULL,
    "finished" BOOLEAN NOT NULL,
    CONSTRAINT "PlaybackContext_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlaybackContext_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Station" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Station_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Station" ("id", "name", "userId") SELECT "id", "name", "userId" FROM "Station";
DROP TABLE "Station";
ALTER TABLE "new_Station" RENAME TO "Station";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "PlaybackContext_stationId_key" ON "PlaybackContext"("stationId");
