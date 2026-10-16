-- CreateTable
CREATE TABLE "GuestTicketToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "issuedTicketId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestTicketToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuestTicketToken_tokenHash_key" ON "GuestTicketToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "GuestTicketToken_issuedTicketId_key" ON "GuestTicketToken"("issuedTicketId");

-- CreateIndex
CREATE INDEX "GuestTicketToken_tokenHash_idx" ON "GuestTicketToken"("tokenHash");

-- AddForeignKey
ALTER TABLE "GuestTicketToken" ADD CONSTRAINT "GuestTicketToken_issuedTicketId_fkey" FOREIGN KEY ("issuedTicketId") REFERENCES "IssuedTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
