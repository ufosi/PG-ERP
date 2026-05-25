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
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "ProductionOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProductionOrder" ("createdAt", "createdById", "customer", "description", "dueDate", "id", "name", "number", "status", "updatedAt") SELECT "createdAt", "createdById", "customer", "description", "dueDate", "id", "name", "number", "status", "updatedAt" FROM "ProductionOrder";
DROP TABLE "ProductionOrder";
ALTER TABLE "new_ProductionOrder" RENAME TO "ProductionOrder";
CREATE UNIQUE INDEX "ProductionOrder_number_key" ON "ProductionOrder"("number");
CREATE INDEX "ProductionOrder_status_idx" ON "ProductionOrder"("status");
CREATE INDEX "ProductionOrder_dueDate_idx" ON "ProductionOrder"("dueDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
