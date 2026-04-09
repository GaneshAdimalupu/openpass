import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@openpass/auth'
import { createEvent, getEvents } from '@openpass/core'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const skip = parseInt(searchParams.get('skip') || '0')
    const take = parseInt(searchParams.get('take') || '10')

    const events = await getEvents(skip, take)
    return NextResponse.json(events)
  } catch (error) {
    console.error('API GET /events error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const cookieHeaders = await headers()
    const session = await auth.api.getSession({ headers: cookieHeaders })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const newEvent = await createEvent(body, session.user.id)

    return NextResponse.json(newEvent, { status: 201 })
  } catch (error) {
    console.error('API POST /events error:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
