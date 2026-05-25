-- CreateTable
CREATE TABLE "ProductionOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customer" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "ProductionOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "note" TEXT,
    CONSTRAINT "WorkLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrder_number_key" ON "ProductionOrder"("number");

-- CreateIndex
CREATE INDEX "ProductionOrder_status_idx" ON "ProductionOrder"("status");

-- CreateIndex
CREATE INDEX "ProductionOrder_dueDate_idx" ON "ProductionOrder"("dueDate");

-- CreateIndex
CREATE INDEX "WorkLog_orderId_idx" ON "WorkLog"("orderId");

-- CreateIndex
CREATE INDEX "WorkLog_userId_idx" ON "WorkLog"("userId");

-- CreateIndex
CREATE INDEX "WorkLog_startedAt_idx" ON "WorkLog"("startedAt");
