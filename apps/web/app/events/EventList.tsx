'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getEventsAction } from '../actions/event'

export type EventWithIncludes = {
  id: string
  title: string
  slug: string
  venue: string | null
  startAt: Date
  organiser: {
    name: string | null
    image: string | null
  }
  _count: {
    registrations: number
  }
}

export function EventList({ initialEvents }: { initialEvents: EventWithIncludes[] }) {
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

  if (events.length === 0) {
    return (
      <div className="w-full py-24 flex flex-col items-center justify-center bg-surface-container-low/50 rounded-2xl border border-outline-variant/10">
        <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">
          event_busy
        </span>
        <h3 className="text-xl font-headline font-bold text-white mb-2">No active events</h3>
        <p className="text-on-surface-variant">Check back later for new events.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-px overflow-hidden rounded-2xl border border-outline-variant/10">
        {events.map((event) => {
          const startDate = new Date(event.startAt)
          const month = startDate.toLocaleDateString('en-US', { month: 'short' })
          const day = startDate.toLocaleDateString('en-US', { day: '2-digit' })
          const time = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

          return (
            <div
              key={event.id}
              className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-surface-container-low hover:bg-surface-container-highest transition-all duration-300"
            >
              <div className="flex items-center gap-6">
                {/* Date Box */}
                <div className="hidden sm:flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-surface-container-highest border border-outline-variant/10 group-hover:border-primary/30 transition-colors">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                    {month}
                  </span>
                  <span className="text-xl font-black text-on-surface">{day}</span>
                </div>

                {/* Event Info */}
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Link
                      href={`/events/${event.slug}`}
                      className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors"
                    >
                      {event.title}
                    </Link>
                    {/* Placeholder Tag */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container">
                      Event
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">
                        {event.venue ? 'location_on' : 'videocam'}
                      </span>
                      {event.venue || 'Virtual'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions & Avatars */}
              <div className="mt-4 md:mt-0 flex items-center gap-6 justify-between md:justify-end">
                <div className="flex -space-x-2">
                  {/* Show Organiser Avatar */}
                  {event.organiser.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={event.organiser.name || 'Organiser'}
                      className="w-8 h-8 rounded-full border-2 border-surface-container-low object-cover"
                      src={event.organiser.image}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-white uppercase">
                      {event.organiser.name?.substring(0, 2) || 'OP'}
                    </div>
                  )}

                  {/* Show Registration Count if > 0 */}
                  {event._count.registrations > 0 && (
                    <div className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                      +{event._count.registrations}
                    </div>
                  )}
                </div>

                <Link
                  href={`/events/${event.slug}`}
                  className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all duration-200"
                >
                  View Details{' '}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Load More */}
      {hasMore && (
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
