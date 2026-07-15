import { prisma } from '@openpass/db'

export async function getVolunteers(eventId: string) {
  return await prisma.volunteer.findMany({
    where: {
      eventId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function createVolunteer(data: {
  eventId: string
  name: string
  email: string
  role: string
  imageUrl?: string
}) {
  return await prisma.volunteer.create({
    data: {
      eventId: data.eventId,
      name: data.name,
      email: data.email,
      role: data.role,
      imageUrl: data.imageUrl || null,
    },
  })
}

export async function updateVolunteerRole(volunteerId: string, eventId: string, role: string) {
  return await prisma.volunteer.update({
    where: {
      id: volunteerId,
      eventId: eventId, // ensure it belongs to the event
    },
    data: {
      role,
    },
  })
}

export async function deleteVolunteer(volunteerId: string, eventId: string) {
  return await prisma.volunteer.delete({
    where: {
      id: volunteerId,
      eventId: eventId, // ensure it belongs to the event
    },
  })
}
