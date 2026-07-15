import { notFound } from 'next/navigation'
import { Navbar } from '@openpass/ui'
import EventMap from './EventMapClient'
import { CheckoutButton } from './CheckoutButton'
import { getEventBySlug } from '@openpass/core'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) return notFound()

  // Format dates
  const dateStr = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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
    <div className="bg-[#19242d] text-white min-h-screen font-body antialiased selection:bg-[#0070eb]/30">
      <Navbar />

      <main className="pt-32 pb-24 lg:pb-12">
        {/* ─── Hero Section ──────────────────────────────────────────────────── */}
        <section className="relative w-full h-[500px] overflow-hidden">
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#19242d] via-transparent to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#19242d]/80 via-transparent to-transparent z-10" />

          {/* Banner image or abstract blurs */}
          {event.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={event.title} src={event.bannerUrl} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0">
              <div className="absolute -top-20 right-1/4 w-[500px] h-[500px] bg-[#0070eb]/30 rounded-full mix-blend-screen filter blur-[140px]" />
              <div className="absolute top-10 -left-20 w-[400px] h-[400px] bg-[#85adff]/20 rounded-full mix-blend-screen filter blur-[120px]" />
              <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#0070eb]/15 rounded-full mix-blend-screen filter blur-[100px]" />
            </div>
          )}

          {/* Hero text content */}
          <div className="absolute bottom-0 left-0 w-full z-20 max-w-7xl mx-auto px-6 md:px-8 pb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#85adff]/20 border border-[#85adff]/30 text-[#85adff] text-xs font-bold tracking-widest uppercase mb-6">
              <span className="w-2 h-2 rounded-full bg-[#85adff] animate-pulse" />
              {event.category || 'Event'}
            </div>
            <h1 className="text-6xl md:text-8xl font-black font-headline tracking-tighter text-white mb-4">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-8 text-[#BFC9D1] font-medium">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#85adff]">calendar_today</span>
                <span>{dateStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#85adff]">schedule</span>
                <span>{timeStr}</span>
              </div>
              {event.venue && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#85adff]">location_on</span>
                  <span>{event.venue}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── Content Grid ──────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 md:px-8 mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* ─── Main Content (8 cols) ──────────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-20">
            {/* The Experience */}
            {event.description && (
              <section>
                <h2 className="text-3xl font-bold font-headline text-white mb-8 flex items-center gap-4">
                  <span className="w-12 h-[2px] bg-[#85adff]" />
                  The Experience
                </h2>
                <div className="prose prose-invert max-w-none text-[#BFC9D1] text-lg leading-relaxed space-y-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.description}</ReactMarkdown>
                </div>
              </section>
            )}

            {/* Event Details Grid */}
            <section>
              <h2 className="text-3xl font-bold font-headline text-white mb-8 flex items-center gap-4">
                Headliners
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Schedule Card */}
                <div className="bg-[rgba(38,38,38,0.4)] backdrop-blur-[20px] p-6 rounded-2xl border border-white/5 group hover:border-[#85adff]/40 transition-all duration-300">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#85adff]/20 flex-shrink-0 flex items-center justify-center bg-[#85adff]/5">
                      <div className="text-center">
                        <p className="text-xs font-bold text-[#BFC9D1] tracking-widest uppercase font-headline">
                          {new Intl.DateTimeFormat('en-US', { month: 'short' }).format(
                            event.startAt
                          )}
                        </p>
                        <p className="text-3xl font-black font-headline tracking-tighter text-white">
                          {new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(
                            event.startAt
                          )}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Schedule</h3>
                      <p className="text-[#BFC9D1] text-sm">{timeStr}</p>
                      <div className="flex gap-2 mt-3">
                        <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                        </span>
                        <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[14px]">
                            calendar_today
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organizer Card */}
                <div className="bg-[rgba(38,38,38,0.4)] backdrop-blur-[20px] p-6 rounded-2xl border border-white/5 group hover:border-[#85adff]/40 transition-all duration-300">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#85adff]/20 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Organizer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        src={
                          event.organiser.image ||
                          `https://api.dicebear.com/9.x/avataaars/svg?seed=${event.organiserId}`
                        }
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {event.organization || event.organiser.name}
                      </h3>
                      <p className="text-[#BFC9D1] text-sm">Host &amp; Organizer</p>
                      <div className="flex gap-2 mt-3">
                        {event.twitterHandle && (
                          <a
                            href={`https://twitter.com/${event.twitterHandle.replace('@', '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">share</span>
                          </a>
                        )}
                        <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[14px]">person</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Card */}
                {event.category && (
                  <div className="bg-[rgba(38,38,38,0.4)] backdrop-blur-[20px] p-6 rounded-2xl border border-white/5 group hover:border-[#85adff]/40 transition-all duration-300">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#85adff]/20 flex-shrink-0 flex items-center justify-center bg-[#85adff]/5">
                        <span
                          className="material-symbols-outlined text-[#85adff] text-4xl"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          category
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{event.category}</h3>
                        <p className="text-[#BFC9D1] text-sm">Event Category</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Capacity Card */}
                <div className="bg-[rgba(38,38,38,0.4)] backdrop-blur-[20px] p-6 rounded-2xl border border-white/5 group hover:border-[#85adff]/40 transition-all duration-300">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#85adff]/20 flex-shrink-0 flex items-center justify-center bg-[#85adff]/5">
                      <div className="text-center">
                        <p className="text-3xl font-black font-headline tracking-tighter text-white">
                          {registrationsCount}
                        </p>
                        <p className="text-[10px] font-bold text-[#BFC9D1] tracking-widest uppercase font-headline">
                          joined
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {event.capacity ? `Limited to ${event.capacity}` : 'Unlimited'}
                      </h3>
                      <p className="text-[#BFC9D1] text-sm">
                        {event.latitude ? 'In-Person' : 'Virtual'} · Public Event
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ─── Sidebar (4 cols) ──────────────────────────────────────────── */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Registration Card */}
            <div className="bg-[#25343F] p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#85adff]/10 rounded-full blur-3xl" />

              <div className="mb-8 relative z-10">
                <p className="text-[#BFC9D1] text-sm font-medium uppercase tracking-widest mb-1">
                  Entry Fee
                </p>
                <h3 className="text-4xl font-black text-white font-headline">Free Access</h3>
              </div>

              <div className="space-y-4 relative z-10">
                <CheckoutButton event={event} />
                <button className="w-full bg-[#314655] py-5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#2c2c2c] transition-all active:scale-95 duration-200">
                  <span className="material-symbols-outlined">share</span>
                  Share Event
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 space-y-4 relative z-10">
                <div className="flex justify-between text-sm">
                  <span className="text-[#BFC9D1]">Capacity</span>
                  <span className="text-white font-medium">
                    {event.capacity
                      ? `${remainingTickets} of ${event.capacity.toLocaleString()}`
                      : 'Unlimited'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#BFC9D1]">Type</span>
                  <span className="text-white font-medium">
                    {event.latitude ? 'In-Person' : 'Virtual'} Event
                  </span>
                </div>
                {event.category && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#BFC9D1]">Category</span>
                    <span className="text-[#85adff] font-medium">{event.category}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Map Widget */}
            {event.latitude && event.longitude ? (
              <div className="bg-[#25343F] p-2 rounded-[2rem] border border-white/5 overflow-hidden">
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold font-headline mb-1">Venue Location</h4>
                    <p className="text-[#BFC9D1] text-sm">{event.venue}</p>
                  </div>
                </div>
                <div className="w-full h-64 rounded-[1.5rem] overflow-hidden relative">
                  <EventMap
                    location={{
                      lat: event.latitude,
                      lng: event.longitude,
                      address: event.venue || '',
                    }}
                  />
                </div>
                <div className="p-4">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#2b3d4a] hover:bg-[#314655] rounded-xl text-[#85adff] transition-all active:scale-95 duration-200 border border-white/5 text-sm font-semibold font-headline"
                  >
                    <span className="material-symbols-outlined text-lg">directions</span>
                    Get Directions
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-[#25343F] p-8 rounded-[2rem] border border-white/5 flex flex-col items-center gap-3 py-12">
                <span className="material-symbols-outlined text-4xl text-[#85adff]/30">
                  videocam
                </span>
                <p className="text-[#BFC9D1] text-lg font-headline font-bold">Virtual Event</p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}
