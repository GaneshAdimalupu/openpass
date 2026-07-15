import { prisma } from '@openpass/db'
import { getEventBySlug } from './events'

export async function getPartners(eventId: string) {
  return await prisma.partner.findMany({
    where: {
      eventId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
}

export async function createPartner(data: {
  eventId: string
  name: string
  logoUrl?: string
  tier: string
  website?: string
}) {
  return await prisma.partner.create({
    data: {
      eventId: data.eventId,
      name: data.name,
      logoUrl: data.logoUrl || null,
      tier: data.tier,
      website: data.website || null,
    },
  })
}

export async function deletePartner(partnerId: string, eventId: string) {
  // Ensure the partner belongs to the event before deleting
  return await prisma.partner.delete({
    where: {
      id: partnerId,
      eventId: eventId,
    },
  })
}
