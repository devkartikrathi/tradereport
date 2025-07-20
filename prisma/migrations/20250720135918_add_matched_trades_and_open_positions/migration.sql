-- CreateTable
CREATE TABLE "MatchedTrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "buyDate" TIMESTAMP(3) NOT NULL,
    "sellDate" TIMESTAMP(3) NOT NULL,
    "buyTime" TEXT,
    "sellTime" TEXT,
    "quantity" INTEGER NOT NULL,
    "buyPrice" DOUBLE PRECISION NOT NULL,
    "sellPrice" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "buyTradeId" TEXT,
    "sellTradeId" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchedTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenPosition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "remainingQuantity" INTEGER NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tradeId" TEXT,
    "currentValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpenPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchedTrade_userId_idx" ON "MatchedTrade"("userId");

-- CreateIndex
CREATE INDEX "MatchedTrade_symbol_idx" ON "MatchedTrade"("symbol");

-- CreateIndex
CREATE INDEX "MatchedTrade_buyDate_idx" ON "MatchedTrade"("buyDate");

-- CreateIndex
CREATE INDEX "OpenPosition_userId_idx" ON "OpenPosition"("userId");

-- CreateIndex
CREATE INDEX "OpenPosition_symbol_idx" ON "OpenPosition"("symbol");

-- CreateIndex
CREATE INDEX "OpenPosition_type_idx" ON "OpenPosition"("type");

-- AddForeignKey
ALTER TABLE "MatchedTrade" ADD CONSTRAINT "MatchedTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenPosition" ADD CONSTRAINT "OpenPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
