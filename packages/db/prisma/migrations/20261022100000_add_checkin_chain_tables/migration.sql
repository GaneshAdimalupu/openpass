-- CreateTable
CREATE TABLE "CheckinChainSession" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "startedById" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckinChainSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckinChainNode" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "parentNodeId" TEXT,
    "issuedTicketId" TEXT,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckinChainNode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckinChainSession_eventId_idx" ON "CheckinChainSession"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckinChainNode_parentNodeId_key" ON "CheckinChainNode"("parentNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckinChainNode_sessionId_issuedTicketId_key" ON "CheckinChainNode"("sessionId", "issuedTicketId");

-- CreateIndex
CREATE INDEX "CheckinChainNode_sessionId_idx" ON "CheckinChainNode"("sessionId");

-- AddForeignKey
ALTER TABLE "CheckinChainSession" ADD CONSTRAINT "CheckinChainSession_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckinChainNode" ADD CONSTRAINT "CheckinChainNode_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CheckinChainSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckinChainNode" ADD CONSTRAINT "CheckinChainNode_parentNodeId_fkey" FOREIGN KEY ("parentNodeId") REFERENCES "CheckinChainNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckinChainNode" ADD CONSTRAINT "CheckinChainNode_issuedTicketId_fkey" FOREIGN KEY ("issuedTicketId") REFERENCES "IssuedTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
