-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatMessage_userId_timestamp_idx" ON "ChatMessage"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
