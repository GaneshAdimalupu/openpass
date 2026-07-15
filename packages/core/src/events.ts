import { prisma } from '@openpass/db'
import { CreateEventInput } from '@openpass/types'

export async function createEvent(data: CreateEventInput, userId: string) {
  const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`

  const startAt = new Date(`${data.startDate}T${data.startTime}`)
  const endAt = new Date(`${data.endDate}T${data.endTime}`)

  const registrationDeadline = data.registrationDeadline
    ? new Date(data.registrationDeadline)
    : null

  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      slug: slug,
      startAt: startAt,
      endAt: endAt,
      venue: data.location?.address || data.venue,
      latitude: data.location?.lat,
      longitude: data.location?.lng,
      category: data.category,
      organization: data.organization,
      capacity: data.capacity,
      requireApproval: data.requireApproval,
      registrationDeadline,
      formSchema: data.formSchema,
      websiteUrl: data.websiteUrl,
      twitterHandle: data.twitterHandle,
      tags: data.tags,
      organiserId: userId,
      isPublished: true,
      isFlagship: data.isFlagship || false,
    },
  })

  return event
}

export async function updateEvent(id: string, data: Partial<CreateEventInput>, userId: string) {
  // Verify ownership
  const event = await prisma.event.findFirst({
    where: { id, organiserId: userId, deletedAt: null },
  })
  if (!event) throw new Error('Event not found or unauthorized')

  const updateData: any = {
    title: data.title,
    description: data.description,
    venue: data.location?.address || data.venue,
    latitude: data.location?.lat,
    longitude: data.location?.lng,
    category: data.category,
    organization: data.organization,
    capacity: data.capacity,
    requireApproval: data.requireApproval,
    formSchema: data.formSchema,
    websiteUrl: data.websiteUrl,
    twitterHandle: data.twitterHandle,
    tags: data.tags,
    scheduleHalls: data.scheduleHalls,
    scheduleDates: data.scheduleDates,
    showSchedule: data.showSchedule,
    isFlagship: data.isFlagship,
  }

  if (data.startDate && data.startTime) {
    updateData.startAt = new Date(`${data.startDate}T${data.startTime}`)
  }
  if (data.endDate && data.endTime) {
    updateData.endAt = new Date(`${data.endDate}T${data.endTime}`)
  }
  if (data.registrationDeadline) {
    updateData.registrationDeadline = new Date(data.registrationDeadline)
  }

  // Remove undefined fields
  Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key])

  const updatedEvent = await prisma.event.update({
    where: { id },
    data: updateData,
  })

  return updatedEvent
}

export async function getEvents(skip: number = 0, take: number = 10) {
  const events = await prisma.event.findMany({
    where: {
      isPublished: true,
      deletedAt: null,
    },
    orderBy: {
      startAt: 'asc',
    },
    skip,
    take,
    include: {
      organiser: {
        select: { name: true, image: true },
      },
      _count: {
        select: {
          registrations: {
            where: { status: 'CONFIRMED', deletedAt: null },
          },
        },
      },
    },
  })
  return events
}

/**
 * Lightweight query for the interactive world map.
 * Only returns events that have geographic coordinates.
 */
export async function getEventsForMap() {
  const events = await prisma.event.findMany({
    where: {
      isPublished: true,
      deletedAt: null,
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      venue: true,
      category: true,
      startAt: true,
      endAt: true,
      latitude: true,
      longitude: true,
      _count: {
        select: { registrations: true },
      },
    },
    orderBy: { startAt: 'asc' },
  })
  return events
}

export async function getEventBySlug(slug: string) {
  const event = await prisma.event.findFirst({
    where: {
      slug: slug,
      deletedAt: null,
    },
    include: {
      organiser: {
        select: { name: true, image: true },
      },
      _count: {
        select: {
          registrations: {
            where: { status: 'CONFIRMED', deletedAt: null },
          },
        },
      },
    },
  })
  return event
}
