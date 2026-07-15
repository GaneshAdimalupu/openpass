import { prisma } from '@openpass/db'

export async function getProjects(eventId: string) {
  return await prisma.project.findMany({
    where: {
      eventId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function createProject(data: {
  eventId: string
  userId: string
  title: string
  description: string
  demoUrl?: string
  logoUrl?: string
}) {
  return await prisma.project.create({
    data: {
      eventId: data.eventId,
      userId: data.userId,
      title: data.title,
      description: data.description,
      demoUrl: data.demoUrl || null,
      logoUrl: data.logoUrl || null,
    },
  })
}

export async function deleteProject(projectId: string, eventId: string) {
  // Ensure the project belongs to the event before deleting
  return await prisma.project.delete({
    where: {
      id: projectId,
      eventId: eventId,
    },
  })
}
