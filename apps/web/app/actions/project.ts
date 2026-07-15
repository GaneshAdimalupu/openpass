'use server'

import { createProject, deleteProject } from '@openpass/core'
import { auth } from '@openpass/auth'
import { headers } from 'next/headers'

async function verifyEventOwner(eventId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user) throw new Error('Unauthorized')

  return session.user
}

export async function createProjectAction(data: {
  eventId: string
  title: string
  description: string
  demoUrl?: string
  logoUrl?: string
}) {
  const user = await verifyEventOwner(data.eventId)
  return await createProject({
    ...data,
    userId: user.id,
  })
}

export async function deleteProjectAction(projectId: string, eventId: string) {
  await verifyEventOwner(eventId)
  return await deleteProject(projectId, eventId)
}
