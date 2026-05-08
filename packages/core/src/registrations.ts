import { prisma, Prisma, RegistrationStatus } from '@openpass/db'
import { CreateRegistrationInput } from '@openpass/types'
import qrcode from 'qrcode'
import crypto from 'crypto'
import { sendTicketConfirmationEmail, sendWaitlistEmail } from './email'

export async function createRegistration(data: CreateRegistrationInput, userId: string) {
  // Check if already registered
  const existing = await prisma.registration.findFirst({
    where: { eventId: data.eventId, userId, deletedAt: null },
  })

  if (existing) {
    throw new Error('ALREADY_REGISTERED')
  }

  const qrCodeRaw = crypto.randomUUID()
  // Generate the data URL for the UI (email.ts independently renders its own copy from qrCodeRaw)
  const qrCodeDataUrl = await qrcode.toDataURL(qrCodeRaw)

  const { registration, event } = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const event = await tx.event.findFirst({
        where: { id: data.eventId, deletedAt: null },
        include: { _count: { select: { registrations: true } } },
      })

      if (!event) throw new Error('EVENT_NOT_FOUND')

      const confirmedCount = await tx.registration.count({
        where: {
          eventId: data.eventId,
          deletedAt: null,
          status: RegistrationStatus.CONFIRMED,
        },
      })
      const isFull =
        event.capacity !== null && event.capacity !== undefined && confirmedCount >= event.capacity

      const registration = await tx.registration.create({
        data: {
          eventId: data.eventId,
          userId,
          formData: data.formData || {},
          qrCode: qrCodeRaw,
          status: isFull ? RegistrationStatus.WAITLISTED : RegistrationStatus.CONFIRMED,
        },
      })

      return { registration, event }
    }
  )

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (user?.email && event) {
    if (registration.status === RegistrationStatus.CONFIRMED) {
      await sendTicketConfirmationEmail({
        to: user.email,
        userName: user.name ?? user.email,
        eventTitle: event.title,
        eventStartAt: event.startAt,
        eventEndAt: event.endAt,
        eventVenue: event.venue,
        qrCode: qrCodeRaw,
        registrationId: registration.id,
      }).catch((err) => {
        console.error('[EMAIL ERROR]', err)
      })
    } else {
      await sendWaitlistEmail({
        to: user.email,
        userName: user.name ?? user.email,
        eventTitle: event.title,
        eventStartAt: event.startAt,
        eventEndAt: event.endAt,
        eventVenue: event.venue,
      })
    }
  }

  return {
    registration,
    qrImage: registration.status === RegistrationStatus.CONFIRMED ? qrCodeDataUrl : null,
    message:
      registration.status === RegistrationStatus.WAITLISTED
        ? 'Event is full. You have been added to the waitlist.'
        : 'Registration successful',
  }
}

export async function checkInRegistration(qrCode: string, checkerUserId: string) {
  const reg = await prisma.registration.findFirst({
    where: { qrCode: qrCode, deletedAt: null },
    include: { event: true, user: true },
  })

  if (!reg) {
    throw new Error('INVALID_QR_CODE')
  }

  // Role-based Access Control: Confirm the checker actually owns the event
  if (reg.event.organiserId !== checkerUserId) {
    throw new Error('FORBIDDEN')
  }

  if (reg.checkedIn) {
    throw new Error('ALREADY_CHECKED_IN')
  }

  const updated = await prisma.registration.update({
    where: { id: reg.id },
    data: { checkedIn: true, checkedInAt: new Date() },
  })

  return updated
}

export async function getRegistrationByUserId(eventId: string, userId: string) {
  return await prisma.registration.findFirst({
    where: { eventId, userId, deletedAt: null },
  })
}
