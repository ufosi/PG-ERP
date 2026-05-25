-- CreateTable
CREATE TABLE "_OrderAssignees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_OrderAssignees_A_fkey" FOREIGN KEY ("A") REFERENCES "ProductionOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_OrderAssignees_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_OrderAssignees_AB_unique" ON "_OrderAssignees"("A", "B");

-- CreateIndex
CREATE INDEX "_OrderAssignees_B_index" ON "_OrderAssignees"("B");
