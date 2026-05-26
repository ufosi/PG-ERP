/*
  Warnings:

  - You are about to drop the column `comments` on the `ProductionOrder` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductionOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customer" TEXT,
    "customerId" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "workflow" TEXT NOT NULL DEFAULT 'EXTENDED',
    "color" TEXT,
    "photos" TEXT,
    "price" REAL,
    "materialCost" REAL,
    "projectDetails" TEXT,
    "productionComments" TEXT,
    "officeComments" TEXT,
    "workerCanComplete" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "dueDate" DATETIME,
    "receivedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "closedAt" DATETIME,
    "closedById" TEXT,
    CONSTRAINT "ProductionOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductionOrder_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductionOrderCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductionOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductionOrder_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProductionOrder" ("categoryId", "closedAt", "closedById", "color", "createdAt", "createdById", "customer", "customerId", "description", "dueDate", "id", "materialCost", "name", "number", "photos", "price", "projectDetails", "status", "updatedAt", "workerCanComplete", "workflow") SELECT "categoryId", "closedAt", "closedById", "color", "createdAt", "createdById", "customer", "customerId", "description", "dueDate", "id", "materialCost", "name", "number", "photos", "price", "projectDetails", "status", "updatedAt", "workerCanComplete", "workflow" FROM "ProductionOrder";
DROP TABLE "ProductionOrder";
ALTER TABLE "new_ProductionOrder" RENAME TO "ProductionOrder";
CREATE UNIQUE INDEX "ProductionOrder_number_key" ON "ProductionOrder"("number");
CREATE INDEX "ProductionOrder_status_idx" ON "ProductionOrder"("status");
CREATE INDEX "ProductionOrder_workflow_idx" ON "ProductionOrder"("workflow");
CREATE INDEX "ProductionOrder_dueDate_idx" ON "ProductionOrder"("dueDate");
CREATE INDEX "ProductionOrder_categoryId_idx" ON "ProductionOrder"("categoryId");
CREATE INDEX "ProductionOrder_customerId_idx" ON "ProductionOrder"("customerId");
CREATE INDEX "ProductionOrder_receivedDate_idx" ON "ProductionOrder"("receivedDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
