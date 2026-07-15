import { prisma } from '@openpass/db'

export async function getScheduleItems(eventId: string) {
  return await prisma.scheduleItem.findMany({
    where: {
      eventId,
    },
    orderBy: {
      startTime: 'asc',
    },
  })
}

export async function createScheduleItem(data: {
  eventId: string
  title: string
  description?: string
  speaker?: string
  speakerImage?: string
  venue?: string
  proposalId?: string
  videoLink?: string
  startTime: Date
  endTime: Date
  type: string
}) {
  return await prisma.scheduleItem.create({
    data: {
      eventId: data.eventId,
      title: data.title,
      description: data.description || null,
      speaker: data.speaker || null,
      speakerImage: data.speakerImage || null,
      venue: data.venue || null,
      proposalId: data.proposalId || null,
      videoLink: data.videoLink || null,
      startTime: data.startTime,
      endTime: data.endTime,
      type: data.type,
    },
  })
}

export async function updateScheduleItem(
  itemId: string,
  eventId: string,
  data: {
    title?: string
    description?: string
    speaker?: string
    speakerImage?: string
    venue?: string
    proposalId?: string
    videoLink?: string
    startTime?: Date
    endTime?: Date
    type?: string
  }
) {
  return await prisma.scheduleItem.update({
    where: {
      id: itemId,
      eventId: eventId,
    },
    data,
  })
}

export async function deleteScheduleItem(itemId: string, eventId: string) {
  return await prisma.scheduleItem.delete({
    where: {
      id: itemId,
      eventId: eventId,
    },
  })
}
