/*
  Warnings:

  - Added the required column `code` to the `Design` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `Design` table without a default value. This is not possible if the table is not empty.

*/
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Design" ("createdAt", "faceCount", "id", "mainImage", "name", "updatedAt") SELECT "createdAt", "faceCount", "id", "mainImage", "name", "updatedAt" FROM "Design";
DROP TABLE "Design";
ALTER TABLE "new_Design" RENAME TO "Design";
CREATE UNIQUE INDEX "Design_name_key" ON "Design"("name");
CREATE UNIQUE INDEX "Design_code_key" ON "Design"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
