import { prisma, Prisma } from '@openpass/db'
import { CreateRegistrationInput } from '@openpass/types'
import qrcode from 'qrcode'
import crypto from 'crypto'

export async function createRegistration(data: CreateRegistrationInput, userId: string) {
  // Check if duplicate
  const existing = await prisma.registration.findFirst({
    where: { eventId: data.eventId, userId: userId, deletedAt: null },
  })

  if (existing) {
    throw new Error('ALREADY_REGISTERED')
  }

  const qrCodeRaw = crypto.randomUUID()
  const qrCodeDataUrl = await qrcode.toDataURL(qrCodeRaw)

  // Execute a Prisma Transaction to safely check capacity dynamically
  const registration = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const event = await tx.event.findFirst({
      where: { id: data.eventId, deletedAt: null },
      include: { _count: { select: { registrations: true } } },
    })

    if (!event) throw new Error('EVENT_NOT_FOUND')

    if (event.capacity && event._count.registrations >= event.capacity) {
      throw new Error('EVENT_FULL')
    }

    return await tx.registration.create({
      data: {
        eventId: data.eventId,
        userId: userId,
        formData: data.formData || {},
        qrCode: qrCodeRaw,
      },
    })
  })

  return { registration, qrImage: qrCodeDataUrl }
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
