'use server'

import { createScheduleItem, updateScheduleItem, deleteScheduleItem } from '@openpass/core'
import { auth } from '@openpass/auth'
import { headers } from 'next/headers'

async function verifyEventOwner(eventId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export async function createScheduleItemAction(data: {
  eventId: string
  title: string
  description?: string
  speaker?: string
  speakerImage?: string
  venue?: string
  proposalId?: string
  videoLink?: string
  startTime: string
  endTime: string
  type: string
}) {
  await verifyEventOwner(data.eventId)
  return await createScheduleItem({
    ...data,
    startTime: new Date(data.startTime),
    endTime: new Date(data.endTime),
  })
}

export async function updateScheduleItemAction(
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
    startTime?: string
    endTime?: string
    type?: string
  }
) {
  await verifyEventOwner(eventId)
  const updateData: any = { ...data }
  if (data.startTime) updateData.startTime = new Date(data.startTime)
  if (data.endTime) updateData.endTime = new Date(data.endTime)
  return await updateScheduleItem(itemId, eventId, updateData)
}

export async function deleteScheduleItemAction(itemId: string, eventId: string) {
  await verifyEventOwner(eventId)
  return await deleteScheduleItem(itemId, eventId)
}
