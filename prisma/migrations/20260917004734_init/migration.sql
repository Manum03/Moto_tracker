-- CreateTable
CREATE TABLE "Motorcycle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plate" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "displacementCc" INTEGER NOT NULL,
    "purchaseDate" DATETIME NOT NULL,
    "currentOdometer" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OdometerLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "motorcycleId" TEXT NOT NULL,
    "km" INTEGER NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OdometerLog_motorcycleId_fkey" FOREIGN KEY ("motorcycleId") REFERENCES "Motorcycle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "motorcycleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" TEXT,
    "issueDate" DATETIME,
    "expiryDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_motorcycleId_fkey" FOREIGN KEY ("motorcycleId") REFERENCES "Motorcycle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "motorcycleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "intervalKm" INTEGER,
    "intervalDays" INTEGER,
    "lastDoneKm" INTEGER,
    "lastDoneDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceRule_motorcycleId_fkey" FOREIGN KEY ("motorcycleId") REFERENCES "Motorcycle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "motorcycleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "km" INTEGER NOT NULL,
    "cost" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaintenanceLog_motorcycleId_fkey" FOREIGN KEY ("motorcycleId") REFERENCES "Motorcycle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Credit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "motorcycleId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "installmentsCount" INTEGER NOT NULL,
    "installmentAmount" REAL NOT NULL,
    "cutoffDay" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Credit_motorcycleId_fkey" FOREIGN KEY ("motorcycleId") REFERENCES "Motorcycle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creditId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Installment_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "Credit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Motorcycle_plate_key" ON "Motorcycle"("plate");

-- CreateIndex
CREATE INDEX "OdometerLog_motorcycleId_idx" ON "OdometerLog"("motorcycleId");

-- CreateIndex
CREATE INDEX "Document_motorcycleId_idx" ON "Document"("motorcycleId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRule_motorcycleId_type_key" ON "MaintenanceRule"("motorcycleId", "type");

-- CreateIndex
CREATE INDEX "MaintenanceLog_motorcycleId_idx" ON "MaintenanceLog"("motorcycleId");

-- CreateIndex
CREATE INDEX "Credit_motorcycleId_idx" ON "Credit"("motorcycleId");

-- CreateIndex
CREATE INDEX "Installment_creditId_idx" ON "Installment"("creditId");

-- CreateIndex
CREATE UNIQUE INDEX "Installment_creditId_number_key" ON "Installment"("creditId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLog_type_refId_level_key" ON "NotificationLog"("type", "refId", "level");
