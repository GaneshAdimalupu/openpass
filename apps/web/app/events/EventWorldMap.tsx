'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import L from 'leaflet'

export type MapEvent = {
  id: string
  title: string
  slug: string
  venue: string | null
  category: string
  startAt: string | Date
  endAt: string | Date
  latitude: number | null
  longitude: number | null
  _count: {
    registrations: number
  }
}

function isLive(event: MapEvent): boolean {
  const now = Date.now()
  const start = new Date(event.startAt).getTime()
  const end = new Date(event.endAt).getTime()
  return now >= start && now <= end
}

function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    Technology: '#85adff',
    Tech: '#85adff',
    Music: '#fab0ff',
    Workshop: '#6c9fff',
    Other: '#adaaaa',
  }
  return map[category] ?? '#adaaaa'
}

function createMarkerIcon(event: MapEvent): L.DivIcon {
  const live = isLive(event)
  const color = getCategoryColor(event.category)
  const size = live ? 18 : 12

  return L.divIcon({
    className: 'event-map-marker-wrapper',
    iconSize: [size * 2.5, size * 2.5],
    iconAnchor: [size * 1.25, size * 1.25],
    html: `
      <div class="event-map-marker ${live ? 'event-map-marker--live' : ''}" style="--marker-color: ${color};">
        ${live ? '<span class="event-map-ping"></span>' : ''}
        <span class="event-map-dot" style="width:${size}px;height:${size}px;"></span>
      </div>
    `,
  })
}

function createTooltipContent(event: MapEvent): string {
  const live = isLive(event)
  const dateStr = new Date(event.startAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const regCount = event._count.registrations

  return `
    <div class="event-tooltip-inner">
      ${
        live
          ? `<div class="event-tooltip-live">
          <span class="event-tooltip-live-dot"></span>
          LIVE NOW
        </div>`
          : ''
      }
      <div class="event-tooltip-title">${event.title}</div>
      ${
        event.venue
          ? `<div class="event-tooltip-venue">
          <span class="material-symbols-outlined" style="font-size:14px">location_on</span>
          ${event.venue}
        </div>`
          : ''
      }
      <div class="event-tooltip-meta">
        <span>${dateStr}</span>
        ${regCount > 0 ? `<span>• ${regCount} registered</span>` : ''}
      </div>
    </div>
  `
}

type EventWorldMapProps = {
  events: MapEvent[]
  activeCategory: string
  highlightedEventId: string | null
  onMarkerClick: (eventId: string) => void
}

/**
 * Uses raw Leaflet API instead of react-leaflet's MapContainer to avoid
 * the "Map container is already initialized" error caused by React Strict Mode
 * double-mounting.
 */
export function EventWorldMap({
  events,
  activeCategory,
  highlightedEventId,
  onMarkerClick,
}: EventWorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [mapReady, setMapReady] = useState(false)

  const filteredEvents = useMemo(() => {
    if (activeCategory === 'All') return events
    return events.filter((e) => e.category.toLowerCase() === activeCategory.toLowerCase())
  }, [events, activeCategory])

  // Initialize the map once
  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return

    const worldBounds = L.latLngBounds(
      L.latLng(-85, -180), // southwest corner
      L.latLng(85, 180) // northeast corner
    )

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 12,
      scrollWheelZoom: true,
      zoomControl: false,
      attributionControl: false,
      maxBounds: worldBounds,
      maxBoundsViscosity: 1.0, // fully sticky — can't drag past bounds
      worldCopyJump: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      noWrap: true, // prevent tile repeating horizontally
    }).addTo(map)

    mapInstanceRef.current = map
    setMapReady(true)

    return () => {
      map.remove()
      mapInstanceRef.current = null
      setMapReady(false)
    }
  }, [])

  // Update markers when filtered events change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapReady) return

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const validEvents = filteredEvents.filter((e) => e.latitude != null && e.longitude != null)

    if (validEvents.length === 0) return

    // Add markers
    const newMarkers = validEvents.map((event) => {
      const marker = L.marker([event.latitude!, event.longitude!], {
        icon: createMarkerIcon(event),
      })
        .addTo(map)
        .bindTooltip(createTooltipContent(event), {
          direction: 'top',
          offset: [0, -16],
          opacity: 1,
          className: 'event-map-tooltip',
        })
        .on('click', () => onMarkerClick(event.id))

      return marker
    })

    markersRef.current = newMarkers

    // Fit bounds to markers
    const bounds = L.latLngBounds(
      validEvents.map((e) => [e.latitude!, e.longitude!] as [number, number])
    )
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 })
  }, [filteredEvents, mapReady, onMarkerClick])

  // Pan to highlighted event
  useEffect(() => {
    if (!highlightedEventId || !mapInstanceRef.current) return
    const event = events.find((e) => e.id === highlightedEventId)
    if (event?.latitude && event?.longitude) {
      mapInstanceRef.current.panTo([event.latitude, event.longitude], {
        animate: true,
        duration: 0.5,
      })
    }
  }, [highlightedEventId, events])

  return (
    <div className="relative w-full h-[400px] md:h-[480px] rounded-2xl overflow-hidden border border-outline-variant/20 shadow-inner bg-[#131313]">
      <div ref={containerRef} className="w-full h-full z-0" style={{ background: '#131313' }} />

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-[500] bg-[#0e0e0e]/90 backdrop-blur-md border border-outline-variant/20 rounded-xl px-4 py-3 flex items-center gap-6 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#85adff] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#85adff] shadow-[0_0_10px_rgba(133,173,255,0.8)]"></span>
          </div>
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-widest">
            Live Now
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#6c9fff]"></span>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            Upcoming
          </span>
        </div>
      </div>

      {/* Subtle gradient overlays for depth */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#131313] to-transparent pointer-events-none z-[400]"></div>
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#131313] to-transparent pointer-events-none z-[400]"></div>
    </div>
  )
}
