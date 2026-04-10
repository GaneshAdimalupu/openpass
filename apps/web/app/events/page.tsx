import { Navbar } from '@openpass/ui'
import { CtaFooter } from '@openpass/ui'
import { EventList } from './EventList'
import { getEvents } from '@openpass/core'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  // Fetch published events using the core logic
  const events = await getEvents()

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

        {/* Search & Filter Bar (Static UI for now) */}
        <div className="mb-12 flex flex-col md:flex-row gap-4 items-center justify-between p-2 rounded-xl bg-surface-container-low border border-outline-variant/10">
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="w-full bg-surface-container-highest border-none rounded-lg pl-12 pr-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 placeholder:text-outline outline-none"
              placeholder="Search events..."
              type="text"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <button className="px-5 py-2 rounded-lg bg-primary/10 text-primary font-semibold text-sm whitespace-nowrap">
              All Categories
            </button>
            <button className="px-5 py-2 rounded-lg hover:bg-surface-container-highest text-on-surface-variant font-medium text-sm transition-colors whitespace-nowrap">
              Tech
            </button>
            <button className="px-5 py-2 rounded-lg hover:bg-surface-container-highest text-on-surface-variant font-medium text-sm transition-colors whitespace-nowrap">
              Music
            </button>
            <button className="px-5 py-2 rounded-lg hover:bg-surface-container-highest text-on-surface-variant font-medium text-sm transition-colors whitespace-nowrap">
              Workshop
            </button>
          </div>
        </div>

        {/* Event Directory List */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <EventList initialEvents={events as any} />
      </main>

      <CtaFooter />
    </div>
  )
}
