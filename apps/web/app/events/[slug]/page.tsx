import { notFound } from 'next/navigation'
import { Navbar } from '@openpass/ui'
import EventMap from './EventMapClient'
import { CheckoutButton } from './CheckoutButton'
import { getEventBySlug } from '@openpass/core'

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) return notFound()

  // Format dates
  const dateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(event.startAt)
  const timeStr = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(event.startAt)

  // Calculate remaining tickets
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registrationsCount = (event as any)._count?.registrations ?? 0
  const remainingTickets = event.capacity ? event.capacity - registrationsCount : null

  return (
    <div className="bg-[#0e0e0e] text-white min-h-screen font-body antialiased selection:bg-[#0070eb]/30">
      <Navbar />

      {/* Hero Header */}
      <div className="relative pt-32 pb-24 border-b border-white/5 overflow-hidden">
        {/* Abstract blur background */}
        <div className="absolute top-0 inset-x-0 h-full w-full pointer-events-none opacity-40">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0070eb] rounded-full mix-blend-screen filter blur-[120px]" />
          <div className="absolute top-20 -left-20 w-72 h-72 bg-[#85adff] rounded-full mix-blend-screen filter blur-[100px]" />
        </div>

        <div className="max-w-screen-xl mx-auto px-8 relative z-10 flex flex-col md:flex-row gap-12 items-end justify-between">
          <div className="max-w-2xl">
            <div className="inline-block px-3 py-1 bg-[#85adff]/10 text-[#85adff] border border-[#85adff]/20 rounded-lg text-xs font-bold uppercase tracking-widest font-headline mb-6">
              {event.category || 'Event'}
            </div>
            <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tighter mb-6 leading-tight">
              {event.title}
            </h1>
            <p className="text-xl text-[#adaaaa] leading-relaxed">{event.description}</p>
          </div>

          <div className="w-full md:w-auto shrink-0 space-y-4">
            <CheckoutButton event={event} />
            <p className="text-center text-xs text-[#494847] font-mono">
              {remainingTickets !== null
                ? `${remainingTickets} tickets remaining`
                : 'Unlimited Registration'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <main className="max-w-screen-xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left Column - Details */}
        <div className="lg:col-span-7 space-y-12">
          {/* Timeline */}
          <div>
            <h2 className="text-xl font-headline font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-3">
              <span className="material-symbols-outlined text-[#85adff]">schedule</span> Timeline
            </h2>
            <div className="p-6 bg-[#1a1919] rounded-3xl border border-white/5 flex gap-8 items-center">
              <div className="text-center shrink-0">
                <p className="text-sm font-bold text-[#adaaaa] tracking-widest uppercase font-headline mb-1">
                  {new Intl.DateTimeFormat('en-US', { month: 'short' }).format(event.startAt)}
                </p>
                <p className="text-5xl font-black font-headline tracking-tighter text-white">
                  {new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(event.startAt)}
                </p>
              </div>
              <div className="w-px h-16 bg-white/10" />
              <div>
                <p className="text-lg text-white font-bold">{dateStr}</p>
                <p className="text-[#adaaaa] mt-1 flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-base">nest_clock_farsight</span>{' '}
                  {timeStr}
                </p>
              </div>
            </div>
          </div>

          {/* Location Map */}
          <div>
            <h2 className="text-xl font-headline font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-3">
              <span className="material-symbols-outlined text-[#85adff]">location_on</span> Venue
            </h2>
            <div className="bg-[#1a1919] border border-white/5 rounded-3xl overflow-hidden p-2">
              {event.latitude && event.longitude ? (
                <div className="w-full">
                  <EventMap
                    location={{
                      lat: event.latitude,
                      lng: event.longitude,
                      address: event.venue || '',
                    }}
                  />
                  <div className="p-4 flex items-start justify-between">
                    <div>
                      <p className="font-bold text-white leading-snug">{event.venue}</p>
                      <p className="text-xs text-[#494847] font-mono mt-2">
                        {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                      </p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 p-3 bg-[#201f1f] hover:bg-[#262626] rounded-xl text-[#85adff] transition-colors border border-white/5"
                    >
                      <span className="material-symbols-outlined">directions</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-[#adaaaa]">Virtual Event</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Organizer */}
        <div className="lg:col-span-5">
          <div className="p-8 sticky top-32 bg-[#131313] border border-white/5 rounded-3xl shadow-2xl">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#85adff] font-headline mb-6 text-center">
              Organized By
            </p>

            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#85adff]/20 to-[#0070eb]/20 border border-[#85adff]/30 flex items-center justify-center p-1 mb-4 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    event.organiser.image ||
                    `https://api.dicebear.com/9.x/avataaars/svg?seed=${event.organiserId}`
                  }
                  alt="Organizer"
                  className="w-full h-full rounded-full object-cover bg-[#0e0e0e]"
                />
              </div>
              <h3 className="text-2xl font-black font-headline text-white mb-1">
                {event.organization || event.organiser.name}
              </h3>
              <p className="text-sm text-[#adaaaa]">Host</p>
            </div>

            {event.twitterHandle && (
              <div className="mt-8 pt-8 border-t border-white/5 flex justify-center">
                <a
                  href={`https://twitter.com/${event.twitterHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#201f1f] hover:bg-[#262626] rounded-lg text-[#adaaaa] transition-colors font-body text-sm cursor-pointer border border-white/5"
                >
                  𝕏 Follow @{event.twitterHandle.replace('@', '')}
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
