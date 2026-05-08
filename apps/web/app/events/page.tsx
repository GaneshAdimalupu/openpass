import { Navbar } from '@openpass/ui'
import { CtaFooter } from '@openpass/ui'
import { EventsPageClient } from './EventsPageClient'
import { getEvents, getEventsForMap } from '@openpass/core'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  // Fetch events for the list and the map in parallel
  const [events, mapEvents] = await Promise.all([getEvents(), getEventsForMap()])

  return (
    <div className="bg-background text-on-surface font-body antialiased min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-20 px-8 max-w-screen-xl mx-auto w-full">
        {/* Header Section */}
        <header className="mb-16">
          <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface mb-4">
            Upcoming{' '}
            <span className="bg-gradient-to-r from-primary to-primary-dim bg-clip-text text-transparent">
              Open Source
            </span>{' '}
            Events
          </h1>
          <p className="text-on-surface-variant text-lg max-w-2xl font-body">
            Explore the latest workshops, community meetups, and technical deep-dives in the
            open-source ecosystem. Clean, minimal, and data-focused.
          </p>
        </header>

        {/* Client-side interactive section: Map + Filters + List */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <EventsPageClient initialEvents={events as any} mapEvents={mapEvents as any} />
      </main>

      <CtaFooter />
    </div>
  )
}
