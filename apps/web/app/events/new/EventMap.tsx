'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Location {
  lat: number
  lng: number
  address: string
}

export interface EventMapProps {
  location: Location | null
  onLocationSelect?: (loc: Location) => void
}

// ─── Fix Leaflet default icon paths (broken in Next.js) ───────────────────────
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

// ─── Electric Noir custom marker ──────────────────────────────────────────────
const electricMarkerIcon =
  typeof window !== 'undefined'
    ? L.divIcon({
        className: '',
        html: `
    <div style="
      width:32px;height:32px;
      background:linear-gradient(135deg,#85adff,#0070eb);
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 0 20px rgba(133,173,255,0.5);
      position:relative;
    ">
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%) rotate(45deg);
        width:8px;height:8px;
        background:white;border-radius:50%;
      "></div>
    </div>
  `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -36],
      })
    : null

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EventMap({ location, onLocationSelect }: EventMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerInstanceRef = useRef<L.Marker | null>(null)

  const defaultCenter: [number, number] = [20.5937, 78.9629] // India

  useEffect(() => {
    if (!mapContainerRef.current) return

    // ─── Initialization Logic ───────────────────────────────────────────────
    // The "already initialized" error occurs because react-leaflet leaves instances
    // attached to the DOM element. We check for _leaflet_id to confirm if the
    // element is already being managed by Leaflet and wipe it if so.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((mapContainerRef.current as any)._leaflet_id) {
      // This shouldn't happen with proper cleanup, but it's our fail-safe.
      return
    }

    const map = L.map(mapContainerRef.current, {
      center: location ? [location.lat, location.lng] : defaultCenter,
      zoom: location ? 15 : 5,
      zoomControl: false,
      attributionControl: false,
      dragging: !!onLocationSelect,
      scrollWheelZoom: !!onLocationSelect,
      background: '#0e0e0e',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map)

    mapInstanceRef.current = map

    // ─── Event Listeners ────────────────────────────────────────────────────
    if (onLocationSelect) {
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          onLocationSelect({
            lat,
            lng,
            address: data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          })
        } catch {
          onLocationSelect({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` })
        }
      })
    }

    // ─── Cleanup Logic ──────────────────────────────────────────────────────
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Mount-only effect

  // ─── Sync Marker and Pan Logic ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Update Marker
    if (location) {
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([location.lat, location.lng])
      } else if (electricMarkerIcon) {
        markerInstanceRef.current = L.marker([location.lat, location.lng], {
          icon: electricMarkerIcon,
        }).addTo(map)
      }

      // Fly to location if it changed externally
      map.flyTo([location.lat, location.lng], map.getZoom(), { duration: 1.2 })
    } else {
      if (markerInstanceRef.current) {
        markerInstanceRef.current.remove()
        markerInstanceRef.current = null
      }
    }
  }, [location])

  return (
    <div
      className="relative rounded-2xl"
      style={{ height: '280px', zIndex: 0, isolation: 'isolate', overflow: 'hidden' }}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background:
            'linear-gradient(to bottom, rgba(14,14,14,0.3) 0%, transparent 25%, transparent 75%, rgba(14,14,14,0.4) 100%)',
          zIndex: 1,
        }}
      />

      {onLocationSelect && (
        <div
          className="absolute top-3 left-3 bg-[#0e0e0e]/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10 pointer-events-none"
          style={{ zIndex: 2 }}
        >
          <p className="text-[10px] font-bold text-[#85adff] uppercase tracking-widest font-headline">
            Click map to pin venue
          </p>
        </div>
      )}

      <div ref={mapContainerRef} style={{ height: '100%', width: '100%', background: '#0e0e0e' }} />

      {/* Attribution */}
      <div className="absolute bottom-2 right-2 pointer-events-none" style={{ zIndex: 2 }}>
        <span className="text-[9px] text-[#494847] font-mono">© OpenStreetMap · CartoDB</span>
      </div>
    </div>
  )
}
