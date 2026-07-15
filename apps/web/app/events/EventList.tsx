'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getEventsAction } from '../actions/event'

export type EventWithIncludes = {
  id: string
  title: string
  slug: string
  venue: string | null
  category?: string
  startAt: Date
  endAt?: Date
  organiser: {
    name: string | null
    image: string | null
  }
  _count: {
    registrations: number
  }
}

type EventListProps = {
  initialEvents: EventWithIncludes[]
  activeCategory?: string
  searchQuery?: string
  highlightedEventId?: string | null
  onEventHover?: (eventId: string | null) => void
}

export function EventList({
  initialEvents,
  activeCategory = 'All',
  searchQuery = '',
  highlightedEventId,
  onEventHover,
}: EventListProps) {
  const [events, setEvents] = useState<EventWithIncludes[]>(initialEvents)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialEvents.length >= 10)

  const handleLoadMore = async () => {
    try {
      setLoadingMore(true)
      const nextEvents = await getEventsAction(events.length, 10)
      if (nextEvents.length < 10) {
        setHasMore(false)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEvents((prev) => [...prev, ...(nextEvents as any)])
    } catch (error) {
      console.error(error)
      alert('Failed to load more events.')
    } finally {
      setLoadingMore(false)
    }
  }

  // Client-side filter by category and search
  const filteredEvents = useMemo(() => {
    let result = events
    if (activeCategory !== 'All') {
      result = result.filter(
        (e) => (e.category || '').toLowerCase() === activeCategory.toLowerCase()
      )
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.venue || '').toLowerCase().includes(q) ||
          (e.category || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [events, activeCategory, searchQuery])

  if (filteredEvents.length === 0) {
    return (
      <div className="w-full py-24 flex flex-col items-center justify-center bg-surface-container-low/50 rounded-2xl border border-outline-variant/10">
        <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">
          event_busy
        </span>
        <h3 className="text-xl font-headline font-bold text-white mb-2">No events found</h3>
        <p className="text-on-surface-variant">
          {searchQuery
            ? 'Try a different search term.'
            : activeCategory !== 'All'
              ? `No ${activeCategory} events right now.`
              : 'Check back later for new events.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEvents.map((event) => {
          const startDate = new Date(event.startAt)
          const month = startDate.toLocaleDateString('en-US', { month: 'short' })
          const day = startDate.toLocaleDateString('en-US', { day: '2-digit' })
          const time = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          const isHighlighted = highlightedEventId === event.id
          const isLive =
            event.endAt &&
            Date.now() >= startDate.getTime() &&
            Date.now() <= new Date(event.endAt).getTime()

          return (
            <div
              key={event.id}
              id={`event-row-${event.id}`}
              className={`group relative flex flex-col h-full bg-surface-container-low border border-outline-variant/10 rounded-3xl overflow-hidden hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 ${
                isHighlighted
                  ? 'ring-2 ring-primary/60 bg-surface-container-highest scale-[1.02]'
                  : ''
              }`}
              onMouseEnter={() => onEventHover?.(event.id)}
              onMouseLeave={() => onEventHover?.(null)}
            >
              {/* Top Section */}
              <div className="p-6 flex-grow flex flex-col relative z-10">
                <div className="flex items-start justify-between mb-4">
                  {/* Date Badge */}
                  <div className="flex flex-col items-center justify-center min-w-[3.5rem] w-14 h-14 rounded-2xl bg-surface-container-highest border border-outline-variant/10 group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors shadow-sm">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest group-hover:text-primary transition-colors">
                      {month}
                    </span>
                    <span className="text-xl font-black text-on-surface">{day}</span>
                  </div>

                  {/* Badges (Live, Category) */}
                  <div className="flex flex-col items-end gap-2">
                    {isLive && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-error/15 text-error shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                        Live
                      </span>
                    )}
                    {event.category && (
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                          event.category === 'Music'
                            ? 'bg-tertiary-container/30 text-tertiary'
                            : event.category === 'Workshop'
                              ? 'bg-outline-variant/20 text-on-surface-variant'
                              : 'bg-secondary-container text-on-secondary-container'
                        }`}
                      >
                        {event.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Info */}
                <div className="mt-2 mb-6">
                  <h3 className="text-xl font-headline font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                    {event.title}
                  </h3>

                  <div className="flex flex-col gap-2.5 mt-5 text-sm text-on-surface-variant">
                    <span className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px] opacity-70">
                        {event.venue ? 'location_on' : 'videocam'}
                      </span>
                      <span className="line-clamp-1">{event.venue || 'Virtual Event'}</span>
                    </span>
                    <span className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px] opacity-70">
                        schedule
                      </span>
                      <span>{time}</span>
                    </span>
                  </div>
                </div>

                <div className="flex-grow"></div>
              </div>

              {/* Footer Section */}
              <div className="px-6 py-4 bg-surface-container-highest/50 border-t border-outline-variant/10 flex items-center justify-between group-hover:bg-primary/5 transition-colors relative z-10">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {/* Show Organiser Avatar */}
                    {event.organiser.image ? (
                      <Image
                        alt={event.organiser.name || 'Organiser'}
                        className="w-8 h-8 rounded-full border-2 border-surface-container-low object-cover z-10"
                        src={event.organiser.image}
                        width={32}
                        height={32}
                        sizes="32px"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-white uppercase z-10">
                        {event.organiser.name?.substring(0, 2) || 'OP'}
                      </div>
                    )}

                    {/* Show Registration Count if > 0 */}
                    {event._count.registrations > 0 && (
                      <div className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-on-surface-variant z-0 relative group-hover:text-primary transition-colors">
                        +{event._count.registrations}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant group-hover:text-primary transition-colors">
                  Details
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </div>

              {/* Full card clickable overlay */}
              <Link href={`/events/${event.slug}`} className="absolute inset-0 z-20">
                <span className="sr-only">View {event.title}</span>
              </Link>
            </div>
          )
        })}
      </div>

      {/* Load More */}
      {hasMore && activeCategory === 'All' && !searchQuery && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-8 py-3 rounded-xl bg-surface-container-high text-on-surface font-bold hover:bg-surface-container-highest transition-colors flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loadingMore ? 'Loading...' : 'Load More Events'}
            <span className="material-symbols-outlined text-sm">
              {loadingMore ? 'sync' : 'expand_more'}
            </span>
          </button>
        </div>
      )}
    </>
  )
}
