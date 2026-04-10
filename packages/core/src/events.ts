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
    },
  })

  return event
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
        select: { registrations: true },
      },
    },
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
        select: { registrations: true },
      },
    },
  })
  return event
}
