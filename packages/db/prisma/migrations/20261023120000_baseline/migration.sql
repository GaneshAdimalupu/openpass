-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('CONFIRMED', 'WAITLISTED', 'DROPPED', 'TRANSFERRED', 'CHECKED_IN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'COORDINATOR', 'VOLUNTEER', 'VIEWER', 'DEVICE');

-- CreateEnum
CREATE TYPE "IdentityProvider" AS ENUM ('MAKEMYEVENT', 'OPENEVENTS', 'GOOGLE', 'GITHUB');

-- CreateEnum
CREATE TYPE "OrganizerType" AS ENUM ('personal', 'education', 'community', 'professional', 'venue', 'public_sector');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('draft', 'published', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "passwordHash" TEXT,
    "emailVerified" TIMESTAMP(3),
    "timeZone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "identityProvider" "IdentityProvider" NOT NULL DEFAULT 'MAKEMYEVENT',
    "whatsapp" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "linkedin" TEXT,
    "facebook" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "deviceId" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "deviceType" TEXT DEFAULT 'DESKTOP',
    "ipAddress" TEXT,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Organizer" (
    "id" TEXT NOT NULL,
    "type" "OrganizerType" NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'individual_host',
    "name" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "website" TEXT,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organizer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizerMember" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "MemberRole" NOT NULL DEFAULT 'VOLUNTEER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizerMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "category" TEXT DEFAULT 'tech',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMember" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "MemberRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "bannerUrl" TEXT,
    "format" TEXT NOT NULL DEFAULT 'meetup',
    "topic" TEXT NOT NULL DEFAULT 'technology',
    "tags" TEXT[],
    "status" "EventStatus" NOT NULL DEFAULT 'draft',
    "shortDescription" TEXT,
    "showSpeakers" BOOLEAN NOT NULL DEFAULT true,
    "eventStart" TIMESTAMP(3) NOT NULL,
    "eventEnd" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "registrationStart" TIMESTAMP(3),
    "registrationEnd" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "onlineLink" TEXT,
    "recordingLink" TEXT,
    "mapLink" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "ticketDescription" TEXT,
    "showRsvp" BOOLEAN NOT NULL DEFAULT false,
    "showSchedule" BOOLEAN NOT NULL DEFAULT true,
    "showPartners" BOOLEAN NOT NULL DEFAULT true,
    "capacity" INTEGER,
    "seriesId" TEXT,
    "organizerId" TEXT NOT NULL,
    "communityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "quantity" INTEGER,
    "maxPerOrder" INTEGER NOT NULL DEFAULT 1,
    "salesStart" TIMESTAMP(3),
    "salesEnd" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "allowWaitlist" BOOLEAN NOT NULL DEFAULT true,
    "allowTransfer" BOOLEAN NOT NULL DEFAULT true,
    "allowDrop" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssuedTicket" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "ticketCode" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "attendeeName" TEXT NOT NULL,
    "attendeeEmail" TEXT NOT NULL,
    "attendeePhone" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'CONFIRMED',
    "waitlistOrder" INTEGER,
    "checkedInAt" TIMESTAMP(3),
    "answers" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssuedTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketTransfer" (
    "id" TEXT NOT NULL,
    "issuedTicketId" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "transferToken" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TicketTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RsvpForm" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "allowEdit" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "maxRsvpCount" INTEGER NOT NULL DEFAULT 100,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RsvpForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomQuestion" (
    "id" TEXT NOT NULL,
    "rsvpFormId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RsvpSubmission" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "confirmAttendance" BOOLEAN NOT NULL DEFAULT false,
    "answers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RsvpSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RsvpCheckIn" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RsvpCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestTicketToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "issuedTicketId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestTicketToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CfpForm" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "allowEdit" BOOLEAN NOT NULL DEFAULT true,
    "anonymiseProposals" BOOLEAN NOT NULL DEFAULT false,
    "hideReviews" BOOLEAN NOT NULL DEFAULT false,
    "onlyWorkshops" BOOLEAN NOT NULL DEFAULT false,
    "onlyTalks" BOOLEAN NOT NULL DEFAULT false,
    "deadline" TIMESTAMP(3),
    "publicCustomResponses" BOOLEAN NOT NULL DEFAULT false,
    "guidelines" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CfpForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CfpCustomQuestion" (
    "id" TEXT NOT NULL,
    "cfpFormId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CfpCustomQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CfpSubmission" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "cfpFormId" TEXT NOT NULL,
    "speakerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'talk',
    "abstract" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL DEFAULT 'all',
    "duration" INTEGER NOT NULL DEFAULT 30,
    "speakerBio" TEXT,
    "slidesUrl" TEXT,
    "answers" JSONB,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CfpSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CfpReview" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "score" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CfpReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleItem" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledDate" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "stage" TEXT,
    "type" TEXT NOT NULL DEFAULT 'talk',
    "speakerName" TEXT,
    "linkedCfpSubmissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPartner" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT,
    "customTier" TEXT,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventVolunteer" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Volunteer',
    "customRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventVolunteer_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_deviceId_idx" ON "Session"("userId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_slug_key" ON "Organizer"("slug");

-- CreateIndex
CREATE INDEX "Organizer_ownerId_idx" ON "Organizer"("ownerId");

-- CreateIndex
CREATE INDEX "Organizer_type_idx" ON "Organizer"("type");

-- CreateIndex
CREATE INDEX "Organizer_category_idx" ON "Organizer"("category");

-- CreateIndex
CREATE INDEX "OrganizerMember_organizerId_idx" ON "OrganizerMember"("organizerId");

-- CreateIndex
CREATE INDEX "OrganizerMember_userId_idx" ON "OrganizerMember"("userId");

-- CreateIndex
CREATE INDEX "OrganizerMember_email_idx" ON "OrganizerMember"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerMember_organizerId_email_key" ON "OrganizerMember"("organizerId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Community_slug_key" ON "Community"("slug");

-- CreateIndex
CREATE INDEX "Community_organizerId_idx" ON "Community"("organizerId");

-- CreateIndex
CREATE INDEX "Community_slug_idx" ON "Community"("slug");

-- CreateIndex
CREATE INDEX "CommunityMember_communityId_idx" ON "CommunityMember"("communityId");

-- CreateIndex
CREATE INDEX "CommunityMember_userId_idx" ON "CommunityMember"("userId");

-- CreateIndex
CREATE INDEX "CommunityMember_email_idx" ON "CommunityMember"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityMember_communityId_email_key" ON "CommunityMember"("communityId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");

-- CreateIndex
CREATE INDEX "Event_communityId_idx" ON "Event"("communityId");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_format_idx" ON "Event"("format");

-- CreateIndex
CREATE INDEX "Event_topic_idx" ON "Event"("topic");

-- CreateIndex
CREATE INDEX "Event_eventStart_idx" ON "Event"("eventStart");

-- CreateIndex
CREATE INDEX "Ticket_eventId_idx" ON "Ticket"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "IssuedTicket_ticketCode_key" ON "IssuedTicket"("ticketCode");

-- CreateIndex
CREATE UNIQUE INDEX "IssuedTicket_qrToken_key" ON "IssuedTicket"("qrToken");

-- CreateIndex
CREATE INDEX "IssuedTicket_eventId_idx" ON "IssuedTicket"("eventId");

-- CreateIndex
CREATE INDEX "IssuedTicket_ticketId_idx" ON "IssuedTicket"("ticketId");

-- CreateIndex
CREATE INDEX "IssuedTicket_userId_idx" ON "IssuedTicket"("userId");

-- CreateIndex
CREATE INDEX "IssuedTicket_attendeeEmail_idx" ON "IssuedTicket"("attendeeEmail");

-- CreateIndex
CREATE INDEX "IssuedTicket_status_idx" ON "IssuedTicket"("status");

-- CreateIndex
CREATE INDEX "IssuedTicket_ticketCode_idx" ON "IssuedTicket"("ticketCode");

-- CreateIndex
CREATE INDEX "IssuedTicket_qrToken_idx" ON "IssuedTicket"("qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "TicketTransfer_transferToken_key" ON "TicketTransfer"("transferToken");

-- CreateIndex
CREATE INDEX "TicketTransfer_issuedTicketId_idx" ON "TicketTransfer"("issuedTicketId");

-- CreateIndex
CREATE INDEX "TicketTransfer_transferToken_idx" ON "TicketTransfer"("transferToken");

-- CreateIndex
CREATE UNIQUE INDEX "RsvpForm_eventId_key" ON "RsvpForm"("eventId");

-- CreateIndex
CREATE INDEX "RsvpForm_eventId_idx" ON "RsvpForm"("eventId");

-- CreateIndex
CREATE INDEX "CustomQuestion_rsvpFormId_idx" ON "CustomQuestion"("rsvpFormId");

-- CreateIndex
CREATE UNIQUE INDEX "RsvpSubmission_eventId_userId_key" ON "RsvpSubmission"("eventId", "userId");

-- CreateIndex
CREATE INDEX "RsvpCheckIn_submissionId_idx" ON "RsvpCheckIn"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestTicketToken_tokenHash_key" ON "GuestTicketToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "GuestTicketToken_issuedTicketId_key" ON "GuestTicketToken"("issuedTicketId");

-- CreateIndex
CREATE INDEX "GuestTicketToken_tokenHash_idx" ON "GuestTicketToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "CfpForm_eventId_key" ON "CfpForm"("eventId");

-- CreateIndex
CREATE INDEX "CfpForm_eventId_idx" ON "CfpForm"("eventId");

-- CreateIndex
CREATE INDEX "CfpCustomQuestion_cfpFormId_idx" ON "CfpCustomQuestion"("cfpFormId");

-- CreateIndex
CREATE INDEX "CfpSubmission_eventId_idx" ON "CfpSubmission"("eventId");

-- CreateIndex
CREATE INDEX "CfpSubmission_cfpFormId_idx" ON "CfpSubmission"("cfpFormId");

-- CreateIndex
CREATE INDEX "CfpSubmission_speakerId_idx" ON "CfpSubmission"("speakerId");

-- CreateIndex
CREATE INDEX "CfpSubmission_status_idx" ON "CfpSubmission"("status");

-- CreateIndex
CREATE INDEX "CfpReview_submissionId_idx" ON "CfpReview"("submissionId");

-- CreateIndex
CREATE INDEX "CfpReview_reviewerId_idx" ON "CfpReview"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "CfpReview_submissionId_reviewerId_key" ON "CfpReview"("submissionId", "reviewerId");

-- CreateIndex
CREATE INDEX "ScheduleItem_eventId_idx" ON "ScheduleItem"("eventId");

-- CreateIndex
CREATE INDEX "ScheduleItem_scheduledDate_idx" ON "ScheduleItem"("scheduledDate");

-- CreateIndex
CREATE INDEX "ScheduleItem_linkedCfpSubmissionId_idx" ON "ScheduleItem"("linkedCfpSubmissionId");

-- CreateIndex
CREATE INDEX "EventPartner_eventId_idx" ON "EventPartner"("eventId");

-- CreateIndex
CREATE INDEX "EventPartner_type_idx" ON "EventPartner"("type");

-- CreateIndex
CREATE INDEX "EventVolunteer_eventId_idx" ON "EventVolunteer"("eventId");

-- CreateIndex
CREATE INDEX "EventVolunteer_userId_idx" ON "EventVolunteer"("userId");

-- CreateIndex
CREATE INDEX "EventVolunteer_email_idx" ON "EventVolunteer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EventVolunteer_eventId_email_key" ON "EventVolunteer"("eventId", "email");

-- CreateIndex
CREATE INDEX "CheckinChainSession_eventId_idx" ON "CheckinChainSession"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckinChainNode_parentNodeId_key" ON "CheckinChainNode"("parentNodeId");

-- CreateIndex
CREATE INDEX "CheckinChainNode_sessionId_idx" ON "CheckinChainNode"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckinChainNode_sessionId_issuedTicketId_key" ON "CheckinChainNode"("sessionId", "issuedTicketId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organizer" ADD CONSTRAINT "Organizer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerMember" ADD CONSTRAINT "OrganizerMember_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerMember" ADD CONSTRAINT "OrganizerMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuedTicket" ADD CONSTRAINT "IssuedTicket_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuedTicket" ADD CONSTRAINT "IssuedTicket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuedTicket" ADD CONSTRAINT "IssuedTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTransfer" ADD CONSTRAINT "TicketTransfer_issuedTicketId_fkey" FOREIGN KEY ("issuedTicketId") REFERENCES "IssuedTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RsvpForm" ADD CONSTRAINT "RsvpForm_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomQuestion" ADD CONSTRAINT "CustomQuestion_rsvpFormId_fkey" FOREIGN KEY ("rsvpFormId") REFERENCES "RsvpForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RsvpSubmission" ADD CONSTRAINT "RsvpSubmission_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RsvpSubmission" ADD CONSTRAINT "RsvpSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RsvpCheckIn" ADD CONSTRAINT "RsvpCheckIn_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "RsvpSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestTicketToken" ADD CONSTRAINT "GuestTicketToken_issuedTicketId_fkey" FOREIGN KEY ("issuedTicketId") REFERENCES "IssuedTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CfpForm" ADD CONSTRAINT "CfpForm_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CfpCustomQuestion" ADD CONSTRAINT "CfpCustomQuestion_cfpFormId_fkey" FOREIGN KEY ("cfpFormId") REFERENCES "CfpForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CfpSubmission" ADD CONSTRAINT "CfpSubmission_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CfpSubmission" ADD CONSTRAINT "CfpSubmission_cfpFormId_fkey" FOREIGN KEY ("cfpFormId") REFERENCES "CfpForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CfpSubmission" ADD CONSTRAINT "CfpSubmission_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CfpReview" ADD CONSTRAINT "CfpReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "CfpSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CfpReview" ADD CONSTRAINT "CfpReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleItem" ADD CONSTRAINT "ScheduleItem_linkedCfpSubmissionId_fkey" FOREIGN KEY ("linkedCfpSubmissionId") REFERENCES "CfpSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleItem" ADD CONSTRAINT "ScheduleItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPartner" ADD CONSTRAINT "EventPartner_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVolunteer" ADD CONSTRAINT "EventVolunteer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVolunteer" ADD CONSTRAINT "EventVolunteer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckinChainSession" ADD CONSTRAINT "CheckinChainSession_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckinChainNode" ADD CONSTRAINT "CheckinChainNode_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CheckinChainSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckinChainNode" ADD CONSTRAINT "CheckinChainNode_parentNodeId_fkey" FOREIGN KEY ("parentNodeId") REFERENCES "CheckinChainNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckinChainNode" ADD CONSTRAINT "CheckinChainNode_issuedTicketId_fkey" FOREIGN KEY ("issuedTicketId") REFERENCES "IssuedTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

