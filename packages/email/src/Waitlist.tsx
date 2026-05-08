import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'

interface WaitlistEmailProps {
  userName: string
  eventTitle: string
  eventDate: string
  eventTime: string
  eventVenue: string | null
}

export function WaitlistEmail({
  userName,
  eventTitle,
  eventDate,
  eventTime,
  eventVenue,
}: WaitlistEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You're on the waitlist for {eventTitle}</Preview>

      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>OpenPass</Heading>
          </Section>

          {/* Hero */}
          <Section style={hero}>
            <Heading style={heroTitle}>You're on the waitlist ⏳</Heading>
            <Text style={heroSubtitle}>
              Hi {userName}, the event <strong>{eventTitle}</strong> is currently full, but you've
              been added to the waitlist.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Event Details */}
          <Section style={section}>
            <Heading as="h3" style={sectionTitle}>
              Event Details
            </Heading>

            <Text style={label}>Event</Text>
            <Text style={value}>{eventTitle}</Text>

            <Text style={label}>Date & Time</Text>
            <Text style={value}>
              {eventDate} — {eventTime}
            </Text>

            {eventVenue && (
              <>
                <Text style={label}>Venue</Text>
                <Text style={value}>{eventVenue}</Text>
              </>
            )}
          </Section>

          <Hr style={divider} />

          {/* Info Section */}
          <Section style={section}>
            <Heading as="h3" style={sectionTitle}>
              What happens next?
            </Heading>

            <Text style={value}>
              If a spot becomes available, you'll automatically be moved from the waitlist and
              receive a confirmation email with your ticket.
            </Text>

            <Text style={value}>
              Keep an eye on your email — spots are filled on a first-come, first-served basis.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>You're closer than you think. Stay ready 🚀</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'Arial, sans-serif',
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  overflow: 'hidden',
}

const header = {
  backgroundColor: '#0f172a',
  padding: '24px',
}

const logo = {
  color: '#ffffff',
  fontSize: '20px',
  margin: 0,
}

const hero = {
  padding: '24px',
  backgroundColor: '#f8fafc',
}

const heroTitle = {
  fontSize: '24px',
  margin: '0 0 8px',
  color: '#0f172a',
}

const heroSubtitle = {
  fontSize: '14px',
  margin: 0,
  color: '#475569',
}

const divider = {
  borderColor: '#e2e8f0',
}

const section = {
  padding: '24px',
}

const sectionTitle = {
  fontSize: '14px',
  textTransform: 'uppercase' as const,
  color: '#64748b',
  marginBottom: '12px',
}

const label = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '8px 0 2px',
}

const value = {
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  color: '#0f172a',
}

const footer = {
  padding: '24px',
  backgroundColor: '#f8fafc',
}

const footerText = {
  fontSize: '12px',
  textAlign: 'center' as const,
  color: '#94a3b8',
}
