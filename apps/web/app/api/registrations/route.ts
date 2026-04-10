import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@openpass/auth'
import { createRegistration } from '@openpass/core'
import { createRegistrationSchema } from '@openpass/types'

export async function POST(req: Request) {
  try {
    const cookieHeaders = await headers()
    const session = await auth.api.getSession({ headers: cookieHeaders })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = createRegistrationSchema.parse(body)
    const result = await createRegistration(data, session.user.id)

    return NextResponse.json(result)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('API POST /registrations error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.error },
        { status: 400 }
      )
    }

    if (error.message === 'ALREADY_REGISTERED') {
      return NextResponse.json({ error: 'Already registered' }, { status: 400 })
    }
    if (error.message === 'EVENT_NOT_FOUND') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    if (error.message === 'EVENT_FULL') {
      return NextResponse.json({ error: 'Event has reached maximum capacity' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
