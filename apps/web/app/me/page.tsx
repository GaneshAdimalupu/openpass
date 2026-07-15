import { Navbar, CtaFooter, MobileBottomNav } from '@openpass/ui'
import { MePageClient } from './MePageClient'
import { headers } from 'next/headers'
import { auth } from '@openpass/auth'
import { prisma } from '@openpass/db'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MePage() {
  // 1. Get the real user session from better-auth
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/auth/login')
  }

  // 2. Fetch User's Tickets (Registrations + Event details)
  const myTickets = await prisma.registration.findMany({
    where: {
      userId: session.user.id,
      deletedAt: null,
    },
    include: {
      event: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // 3. Fetch User's Hosted Events (Events they created + metrics)
  const hostedEventsRaw = await prisma.event.findMany({
    where: {
      organiserId: session.user.id,
      deletedAt: null,
    },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
    orderBy: {
      startAt: 'asc',
    },
  })

  // 4. Append check-in metrics for the Organizer view
  const hostedEvents = await Promise.all(
    hostedEventsRaw.map(async (event) => {
      const checkedInCount = await prisma.registration.count({
        where: {
          eventId: event.id,
          checkedIn: true,
          deletedAt: null,
        },
      })
      return {
        ...event,
        checkedInCount,
      }
    })
  )

  return (
    <div className="bg-background text-on-surface font-body antialiased min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-20 px-6 md:px-8 max-w-7xl mx-auto w-full">
        {/* Pass real database records down to the client component */}
        <MePageClient user={session.user} tickets={myTickets} hostedEvents={hostedEvents} />
      </main>

      <CtaFooter />
      <MobileBottomNav />
    </div>
  )
}
