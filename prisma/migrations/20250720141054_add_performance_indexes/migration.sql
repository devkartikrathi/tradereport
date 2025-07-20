-- CreateIndex
CREATE INDEX "MatchedTrade_sellDate_idx" ON "MatchedTrade"("sellDate");

-- CreateIndex
CREATE INDEX "MatchedTrade_userId_sellDate_idx" ON "MatchedTrade"("userId", "sellDate");

-- CreateIndex
CREATE INDEX "MatchedTrade_userId_symbol_idx" ON "MatchedTrade"("userId", "symbol");

-- CreateIndex
CREATE INDEX "MatchedTrade_profit_idx" ON "MatchedTrade"("profit");

-- CreateIndex
CREATE INDEX "MatchedTrade_sellDate_profit_idx" ON "MatchedTrade"("sellDate", "profit");

-- CreateIndex
CREATE INDEX "OpenPosition_userId_symbol_idx" ON "OpenPosition"("userId", "symbol");

-- CreateIndex
CREATE INDEX "OpenPosition_userId_type_idx" ON "OpenPosition"("userId", "type");

-- CreateIndex
CREATE INDEX "OpenPosition_date_idx" ON "OpenPosition"("date");

-- CreateIndex
CREATE INDEX "Trade_userId_date_idx" ON "Trade"("userId", "date");

-- CreateIndex
CREATE INDEX "Trade_userId_symbol_idx" ON "Trade"("userId", "symbol");

-- CreateIndex
CREATE INDEX "Trade_tradeType_idx" ON "Trade"("tradeType");

-- CreateIndex
CREATE INDEX "Trade_createdAt_idx" ON "Trade"("createdAt");
