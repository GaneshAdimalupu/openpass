'use server'

import { createVolunteer, updateVolunteerRole, deleteVolunteer } from '@openpass/core'
import { auth } from '@openpass/auth'
import { headers } from 'next/headers'

async function verifyEventOwner(eventId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user) throw new Error('Unauthorized')

  // Basic check - in production you would verify if this user owns this specific event
  return session.user
}

export async function createVolunteerAction(data: {
  eventId: string
  name: string
  email: string
  role: string
  imageUrl?: string
}) {
  await verifyEventOwner(data.eventId)
  return await createVolunteer(data)
}

export async function updateVolunteerRoleAction(
  volunteerId: string,
  eventId: string,
  role: string
) {
  await verifyEventOwner(eventId)
  return await updateVolunteerRole(volunteerId, eventId, role)
}

export async function deleteVolunteerAction(volunteerId: string, eventId: string) {
  await verifyEventOwner(eventId)
  return await deleteVolunteer(volunteerId, eventId)
}
