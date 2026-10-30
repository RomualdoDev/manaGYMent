-- CreateTable
CREATE TABLE "SmsNotification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientCpf" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "providerMessageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "SmsNotification_clientCpf_dueDate_key" ON "SmsNotification"("clientCpf", "dueDate");
