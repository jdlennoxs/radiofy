-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlaybackContext" (
    "stationId" TEXT NOT NULL,
    "trackId" TEXT,
    "startTime" INTEGER,
    "finished" BOOLEAN,
    CONSTRAINT "PlaybackContext_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlaybackContext_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PlaybackContext" ("finished", "startTime", "stationId", "trackId") SELECT "finished", "startTime", "stationId", "trackId" FROM "PlaybackContext";
DROP TABLE "PlaybackContext";
ALTER TABLE "new_PlaybackContext" RENAME TO "PlaybackContext";
CREATE UNIQUE INDEX "PlaybackContext_stationId_key" ON "PlaybackContext"("stationId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
