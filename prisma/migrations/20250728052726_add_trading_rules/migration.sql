-- CreateTable
CREATE TABLE "TradingRuleSet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "maxDailyTrades" INTEGER NOT NULL DEFAULT 10,
    "maxDailyLoss" DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    "riskRewardRatio" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingRuleSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TradingRuleSet_userId_key" ON "TradingRuleSet"("userId");

-- CreateIndex
CREATE INDEX "TradingRuleSet_userId_idx" ON "TradingRuleSet"("userId");

-- AddForeignKey
ALTER TABLE "TradingRuleSet" ADD CONSTRAINT "TradingRuleSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
