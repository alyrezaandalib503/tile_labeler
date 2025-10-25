/*
  Warnings:

  - You are about to drop the `DesignLabelValue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "DesignLabelValue_designId_labelValueId_key";

-- DropIndex
DROP INDEX "DesignLabelValue_labelValueId_idx";

-- DropIndex
DROP INDEX "DesignLabelValue_designId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DesignLabelValue";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Design" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "faceCount" INTEGER NOT NULL,
    "mainImage" TEXT NOT NULL,
    "labelsJson" JSONB NOT NULL DEFAULT [],
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Design" ("code", "createdAt", "faceCount", "id", "mainImage", "name", "size", "updatedAt") SELECT "code", "createdAt", "faceCount", "id", "mainImage", "name", "size", "updatedAt" FROM "Design";
DROP TABLE "Design";
ALTER TABLE "new_Design" RENAME TO "Design";
CREATE UNIQUE INDEX "Design_name_key" ON "Design"("name");
CREATE UNIQUE INDEX "Design_code_key" ON "Design"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
