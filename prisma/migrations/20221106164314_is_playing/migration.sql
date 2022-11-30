/*
  Warnings:

  - You are about to drop the column `finished` on the `PlaybackContext` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlaybackContext" (
    "stationId" TEXT NOT NULL,
    "trackId" TEXT,
    "startTime" INTEGER,
    "isPlaying" BOOLEAN,
    CONSTRAINT "PlaybackContext_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlaybackContext_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PlaybackContext" ("startTime", "stationId", "trackId") SELECT "startTime", "stationId", "trackId" FROM "PlaybackContext";
DROP TABLE "PlaybackContext";
ALTER TABLE "new_PlaybackContext" RENAME TO "PlaybackContext";
CREATE UNIQUE INDEX "PlaybackContext_stationId_key" ON "PlaybackContext"("stationId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
