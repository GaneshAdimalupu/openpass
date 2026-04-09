import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@openpass/auth'
import { checkInRegistration } from '@openpass/core'

export async function POST(req: Request) {
  try {
    const cookieHeaders = await headers()
    const session = await auth.api.getSession({ headers: cookieHeaders })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { qrCode } = await req.json()
    if (!qrCode) {
      return NextResponse.json({ error: 'QR Code is required' }, { status: 400 })
    }

    const updated = await checkInRegistration(qrCode, session.user.id)
    return NextResponse.json({ success: true, registration: updated })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('API POST /registrations/checkin error:', error)

    if (error.message === 'INVALID_QR_CODE') {
      return NextResponse.json({ error: 'Invalid QR Code' }, { status: 404 })
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error.message === 'ALREADY_CHECKED_IN') {
      return NextResponse.json({ error: 'Already checked in' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
