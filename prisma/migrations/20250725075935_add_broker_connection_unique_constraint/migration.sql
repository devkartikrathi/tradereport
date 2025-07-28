/*
  Warnings:

  - A unique constraint covering the columns `[userId,broker]` on the table `BrokerConnection` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "BrokerConnection_userId_broker_idx";

-- CreateIndex
CREATE UNIQUE INDEX "BrokerConnection_userId_broker_key" ON "BrokerConnection"("userId", "broker");
