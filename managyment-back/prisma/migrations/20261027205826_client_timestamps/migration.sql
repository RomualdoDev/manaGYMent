-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "cpf" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "age" INTEGER,
    "size" INTEGER,
    "phoneNumber" TEXT,
    "email" TEXT,
    "beginDate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Client" ("age", "beginDate", "cpf", "email", "name", "phoneNumber", "size") SELECT "age", "beginDate", "cpf", "email", "name", "phoneNumber", "size" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
