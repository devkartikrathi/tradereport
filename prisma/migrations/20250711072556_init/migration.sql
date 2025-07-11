-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "tradeType" TEXT NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "exitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profitLoss" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalNetProfitLoss" DOUBLE PRECISION NOT NULL,
    "grossProfit" DOUBLE PRECISION NOT NULL,
    "grossLoss" DOUBLE PRECISION NOT NULL,
    "totalTrades" INTEGER NOT NULL,
    "winningTrades" INTEGER NOT NULL,
    "losingTrades" INTEGER NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL,
    "lossRate" DOUBLE PRECISION NOT NULL,
    "profitFactor" DOUBLE PRECISION NOT NULL,
    "avgProfitPerWin" DOUBLE PRECISION NOT NULL,
    "avgLossPerLoss" DOUBLE PRECISION NOT NULL,
    "avgProfitLossPerTrade" DOUBLE PRECISION NOT NULL,
    "maxDrawdown" DOUBLE PRECISION NOT NULL,
    "maxDrawdownPercent" DOUBLE PRECISION NOT NULL,
    "avgDrawdown" DOUBLE PRECISION NOT NULL,
    "longestWinStreak" INTEGER NOT NULL,
    "longestLossStreak" INTEGER NOT NULL,
    "profitableDays" INTEGER NOT NULL,
    "lossDays" INTEGER NOT NULL,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Trade_userId_idx" ON "Trade"("userId");

-- CreateIndex
CREATE INDEX "Trade_date_idx" ON "Trade"("date");

-- CreateIndex
CREATE INDEX "Trade_symbol_idx" ON "Trade"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Analytics_userId_key" ON "Analytics"("userId");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
