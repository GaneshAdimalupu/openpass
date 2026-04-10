'use server'

import { headers } from 'next/headers'
import { auth } from '@openpass/auth'
import { redirect } from 'next/navigation'
import { createEvent, getEvents } from '@openpass/core'
import { CreateEventInput } from '@openpass/types'

export async function createEventAction(data: CreateEventInput) {
  const cookieHeaders = await headers()
  const session = await auth.api.getSession({ headers: cookieHeaders })

  if (!session?.user) {
    throw new Error('You must be logged in to create an event.')
  }

  const event = await createEvent(data, session.user.id)

  redirect(`/events/${event.slug}`)
}

export async function getEventsAction(skip: number = 0, take: number = 10) {
  return await getEvents(skip, take)
}
