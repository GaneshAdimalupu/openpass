'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { EventList, type EventWithIncludes } from './EventList'
import type { MapEvent } from './EventWorldMap'

// Leaflet must be loaded client-side only (uses `window`)
const EventWorldMap = dynamic(() => import('./EventWorldMap').then((m) => m.EventWorldMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] md:h-[480px] rounded-2xl bg-surface-container-low border border-outline-variant/10 animate-pulse flex items-center justify-center">
      <span className="material-symbols-outlined text-4xl text-outline-variant animate-spin">
        public
      </span>
    </div>
  ),
})

const CATEGORIES = ['All', 'Technology', 'Music', 'Workshop'] as const

type EventsPageClientProps = {
  initialEvents: EventWithIncludes[]
  mapEvents: MapEvent[]
}

export function EventsPageClient({ initialEvents, mapEvents }: EventsPageClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const eventListRef = useRef<HTMLDivElement>(null)

  const handleMarkerClick = useCallback((eventId: string) => {
    setHighlightedEventId(eventId)
    // Scroll to the event in the list
    const el = document.getElementById(`event-row-${eventId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Flash highlight
      el.classList.add('ring-2', 'ring-primary/60')
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary/60')
        setHighlightedEventId(null)
      }, 2500)
    }
  }, [])

  const handleEventHover = useCallback((eventId: string | null) => {
    setHighlightedEventId(eventId)
  }, [])

  // Derive a count of events per category for the map
  const mapCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: mapEvents.length }
    for (const e of mapEvents) {
      counts[e.category] = (counts[e.category] || 0) + 1
    }
    return counts
  }, [mapEvents])

  return (
    <>
      {/* Interactive World Map */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-primary text-xl">public</span>
          <h2 className="font-headline text-lg font-bold text-on-surface tracking-tight">
            Event Map
          </h2>
          <span className="text-xs text-on-surface-variant bg-surface-container-highest px-2.5 py-1 rounded-full font-semibold">
            {mapEvents.length} locations
          </span>
        </div>
        <EventWorldMap
          events={mapEvents}
          activeCategory={activeCategory}
          highlightedEventId={highlightedEventId}
          onMarkerClick={handleMarkerClick}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-12 flex flex-col md:flex-row gap-4 items-center justify-between p-2 rounded-xl bg-surface-container-low border border-outline-variant/10">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            className="w-full bg-surface-container-highest border-none rounded-lg pl-12 pr-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 placeholder:text-outline outline-none"
            placeholder="Search events..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeCategory === cat
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'hover:bg-surface-container-highest text-on-surface-variant'
              }`}
            >
              {cat}
              {mapCategoryCounts[cat] != null && (
                <span className="text-[10px] opacity-60">{mapCategoryCounts[cat]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Event Directory List */}
      <div ref={eventListRef}>
        <EventList
          initialEvents={initialEvents}
          activeCategory={activeCategory}
          searchQuery={searchQuery}
          highlightedEventId={highlightedEventId}
          onEventHover={handleEventHover}
        />
      </div>
    </>
  )
}
