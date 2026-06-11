-- CreateTable
CREATE TABLE "Seller" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sellerCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sellerId" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "product" TEXT NOT NULL,
    "description" TEXT,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "saleDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sale_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Seller_sellerCode_key" ON "Seller"("sellerCode");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_whatsapp_key" ON "Seller"("whatsapp");
