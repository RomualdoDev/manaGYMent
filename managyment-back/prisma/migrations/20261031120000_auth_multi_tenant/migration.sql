-- Multi-tenant + auth. Existing data goes to a default gym (id 1) so nothing is lost.

-- CreateTable
CREATE TABLE "Gym" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "gymId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Default gym for the data that already exists
INSERT INTO "Gym" ("id", "name") VALUES (1, 'Academia padrão');

-- RedefineTable: Client gets gymId and the key becomes (gymId, cpf)
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Client" (
    "gymId" INTEGER NOT NULL,
    "cpf" TEXT NOT NULL,
    "name" TEXT,
    "age" INTEGER,
    "size" INTEGER,
    "phoneNumber" TEXT,
    "email" TEXT,
    "beginDate" REAL,
    "billingDay" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("gymId", "cpf"),
    CONSTRAINT "Client_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Client" ("gymId", "cpf", "name", "age", "size", "phoneNumber", "email", "beginDate", "billingDay", "createdAt", "updatedAt")
SELECT 1, "cpf", "name", "age", "size", "phoneNumber", "email", "beginDate", "billingDay", "createdAt", "updatedAt" FROM "Client";

DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";

-- RedefineTable: SmsNotification gets gymId, the unique key includes it
CREATE TABLE "new_SmsNotification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gymId" INTEGER NOT NULL,
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

INSERT INTO "new_SmsNotification" ("id", "gymId", "clientCpf", "dueDate", "phoneNumber", "message", "status", "error", "providerMessageId", "createdAt", "updatedAt")
SELECT "id", 1, "clientCpf", "dueDate", "phoneNumber", "message", "status", "error", "providerMessageId", "createdAt", "updatedAt" FROM "SmsNotification";

DROP TABLE "SmsNotification";
ALTER TABLE "new_SmsNotification" RENAME TO "SmsNotification";

-- CreateIndex
CREATE UNIQUE INDEX "SmsNotification_gymId_clientCpf_dueDate_key" ON "SmsNotification"("gymId", "clientCpf", "dueDate");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
