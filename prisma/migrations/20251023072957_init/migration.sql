-- CreateTable
CREATE TABLE "Design" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "faceCount" INTEGER NOT NULL,
    "mainImage" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DesignImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "designId" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    CONSTRAINT "DesignImage_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DesignLabelValue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "designId" INTEGER NOT NULL,
    "labelValueId" INTEGER NOT NULL,
    CONSTRAINT "DesignLabelValue_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DesignLabelValue_labelValueId_fkey" FOREIGN KEY ("labelValueId") REFERENCES "LabelValue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Design_name_key" ON "Design"("name");

-- CreateIndex
CREATE INDEX "DesignImage_designId_idx" ON "DesignImage"("designId");

-- CreateIndex
CREATE UNIQUE INDEX "DesignImage_designId_index_key" ON "DesignImage"("designId", "index");

-- CreateIndex
CREATE INDEX "DesignLabelValue_designId_idx" ON "DesignLabelValue"("designId");

-- CreateIndex
CREATE INDEX "DesignLabelValue_labelValueId_idx" ON "DesignLabelValue"("labelValueId");

-- CreateIndex
CREATE UNIQUE INDEX "DesignLabelValue_designId_labelValueId_key" ON "DesignLabelValue"("designId", "labelValueId");
