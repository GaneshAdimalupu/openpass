import { Resend } from 'resend'
import QRCode from 'qrcode'
import { render } from '@react-email/render'
import { TicketConfirmationEmail, WaitlistEmail } from '@openpass/email'

// Lazily initialise the client so module-level import does not throw
// when RESEND_API_KEY is absent in local dev.
let _resend: Resend | null = null
function getResendClient(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${fmt(start)} – ${fmt(end)}`
}

export async function sendTicketConfirmationEmail({
  to,
  userName,
  eventTitle,
  eventStartAt,
  eventEndAt,
  eventVenue,
  qrCode,
  registrationId,
}: {
  to: string
  userName: string
  eventTitle: string
  eventStartAt: Date
  eventEndAt: Date
  eventVenue: string | null
  qrCode: string
  registrationId: string
}) {
  const qrCodeDataUrl = await QRCode.toDataURL(qrCode, {
    width: 400,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
  })

  const html = await render(
    TicketConfirmationEmail({
      userName,
      eventTitle,
      eventDate: formatDate(eventStartAt),
      eventTime: formatTime(eventStartAt, eventEndAt),
      eventVenue,
      qrCodeDataUrl,
      registrationId,
    })
  )

  const { error } = await getResendClient().emails.send({
    from: process.env.EMAIL_FROM ?? 'OpenPass <tickets@openpass.app>',
    to,
    subject: `Your ticket for ${eventTitle} ✓`,
    html,
  })

  if (error) {
    console.error('[sendTicketConfirmation] Resend error:', error)
  }
}

export async function sendWaitlistEmail({
  to,
  userName,
  eventTitle,
  eventStartAt,
  eventEndAt,
  eventVenue,
}: {
  to: string
  userName: string
  eventTitle: string
  eventStartAt: Date
  eventEndAt: Date
  eventVenue: string | null
}) {
  const html = await render(
    WaitlistEmail({
      userName,
      eventTitle,
      eventDate: formatDate(eventStartAt),
      eventTime: formatTime(eventStartAt, eventEndAt),
      eventVenue,
    })
  )

  const { error } = await getResendClient().emails.send({
    from: process.env.EMAIL_FROM ?? 'OpenPass <tickets@openpass.app>',
    to,
    subject: `You're on the waitlist for ${eventTitle} ✓`,
    html,
  })

  if (error) {
    console.error('[sendWaitlistEmail] Resend error:', error)
  }
}
