-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JobServiceOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_OrderServiceOptions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_OrderServiceOptions_A_fkey" FOREIGN KEY ("A") REFERENCES "JobServiceOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_OrderServiceOptions_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductionOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "comments" TEXT,
    "workerCanComplete" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "dueDate" DATETIME,
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
INSERT INTO "new_ProductionOrder" ("categoryId", "closedAt", "closedById", "createdAt", "createdById", "customer", "description", "dueDate", "id", "name", "number", "status", "updatedAt", "workerCanComplete") SELECT "categoryId", "closedAt", "closedById", "createdAt", "createdById", "customer", "description", "dueDate", "id", "name", "number", "status", "updatedAt", "workerCanComplete" FROM "ProductionOrder";
DROP TABLE "ProductionOrder";
ALTER TABLE "new_ProductionOrder" RENAME TO "ProductionOrder";
CREATE UNIQUE INDEX "ProductionOrder_number_key" ON "ProductionOrder"("number");
CREATE INDEX "ProductionOrder_status_idx" ON "ProductionOrder"("status");
CREATE INDEX "ProductionOrder_workflow_idx" ON "ProductionOrder"("workflow");
CREATE INDEX "ProductionOrder_dueDate_idx" ON "ProductionOrder"("dueDate");
CREATE INDEX "ProductionOrder_categoryId_idx" ON "ProductionOrder"("categoryId");
CREATE INDEX "ProductionOrder_customerId_idx" ON "ProductionOrder"("customerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_name_key" ON "Customer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "JobServiceOption_name_key" ON "JobServiceOption"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_OrderServiceOptions_AB_unique" ON "_OrderServiceOptions"("A", "B");

-- CreateIndex
CREATE INDEX "_OrderServiceOptions_B_index" ON "_OrderServiceOptions"("B");
