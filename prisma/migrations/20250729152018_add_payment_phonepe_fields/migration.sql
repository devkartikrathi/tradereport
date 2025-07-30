/*
  Warnings:

  - A unique constraint covering the columns `[phonePeTransactionId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phonePeTransactionId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "paymentUrl" TEXT,
ADD COLUMN     "phonePeTransactionId" TEXT NOT NULL,
ADD COLUMN     "planId" TEXT NOT NULL,
ADD COLUMN     "signature" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "subscriptionId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_phonePeTransactionId_key" ON "Payment"("phonePeTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_planId_idx" ON "Payment"("planId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_phonePeTransactionId_idx" ON "Payment"("phonePeTransactionId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
