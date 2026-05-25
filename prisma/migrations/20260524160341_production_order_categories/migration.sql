-- CreateTable
CREATE TABLE "ProductionOrderCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductionOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customer" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "workerCanComplete" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "closedAt" DATETIME,
    "closedById" TEXT,
    CONSTRAINT "ProductionOrder_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductionOrderCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductionOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductionOrder_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProductionOrder" ("closedAt", "closedById", "createdAt", "createdById", "customer", "description", "dueDate", "id", "name", "number", "status", "updatedAt", "workerCanComplete") SELECT "closedAt", "closedById", "createdAt", "createdById", "customer", "description", "dueDate", "id", "name", "number", "status", "updatedAt", "workerCanComplete" FROM "ProductionOrder";
DROP TABLE "ProductionOrder";
ALTER TABLE "new_ProductionOrder" RENAME TO "ProductionOrder";
CREATE UNIQUE INDEX "ProductionOrder_number_key" ON "ProductionOrder"("number");
CREATE INDEX "ProductionOrder_status_idx" ON "ProductionOrder"("status");
CREATE INDEX "ProductionOrder_dueDate_idx" ON "ProductionOrder"("dueDate");
CREATE INDEX "ProductionOrder_categoryId_idx" ON "ProductionOrder"("categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrderCategory_name_key" ON "ProductionOrderCategory"("name");
