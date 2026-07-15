'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signOut } from '@openpass/auth/client'

export function MePageClient({
  user,
  tickets,
  hostedEvents,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null }
  tickets: {
    id: string
    status: string
    event: { title: string; venue?: string | null; startAt: string | Date }
    qrCode?: string | null
  }[]
  hostedEvents: {
    id: string
    slug: string
    title: string
    isPublished: boolean
    startAt: string | Date
    _count: { registrations: number }
    checkedInCount: number
  }[]
}) {
  const [activeTab, setActiveTab] = useState<'tickets' | 'hosted'>('tickets')

  // NEW: State to track the currently clicked ticket for the pop-up modal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : user.email?.substring(0, 2).toUpperCase()

  return (
    <div className="w-full relative">
      {/* 1. AT-A-GLANCE PROFILE HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 bg-surface-container-low p-6 md:p-8 rounded-3xl border border-outline-variant/30 shadow-sm gap-6">
        <div className="flex items-center gap-6">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || 'User Profile Image'}
              width={80}
              height={80}
              sizes="80px"
              priority
              className="h-20 w-20 rounded-full shadow-lg object-cover"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-on-primary font-headline text-3xl font-bold shadow-lg">
              {initials}
            </div>
          )}
          <div>
            <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
              {user.name || 'Anonymous User'}
            </h1>
            <p className="text-on-surface-variant font-body mt-1">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={async () => {
              await signOut()
              window.location.href = '/'
            }}
            className="px-5 py-2.5 bg-error/10 text-error font-bold rounded-xl hover:bg-error/20 transition-colors border border-error/20"
          >
            Sign out
          </button>
          <button
            className="p-3 bg-surface-variant text-on-surface-variant rounded-full hover:bg-surface-container-highest transition-colors"
            aria-label="Settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. TABS */}
      <div className="flex gap-8 border-b border-outline-variant/30 mb-8">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-4 font-headline text-lg font-bold transition-all ${activeTab === 'tickets' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          My Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('hosted')}
          className={`pb-4 font-headline text-lg font-bold transition-all ${activeTab === 'hosted' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Hosted Events ({hostedEvents.length})
        </button>
      </div>

      {/* 3. CONTENT AREA */}
      <div className="min-h-[400px]">
        {activeTab === 'tickets' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {tickets.length === 0 ? (
              <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                <p className="text-on-surface-variant font-body">
                  You haven&apos;t registered for any events yet.
                </p>
                <Link href="/" className="text-primary font-bold mt-2 block hover:underline">
                  Browse Events
                </Link>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-surface-container rounded-2xl p-6 border border-outline-variant/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-primary/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${ticket.status === 'CONFIRMED' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-variant text-on-surface-variant'}`}
                      >
                        {ticket.status}
                      </span>
                      <span className="text-on-surface-variant text-sm font-medium">
                        {new Date(ticket.event.startAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <h3 className="text-2xl font-headline font-bold text-on-surface">
                      {ticket.event.title}
                    </h3>
                    <p className="text-on-surface-variant font-body mt-1">{ticket.event.venue}</p>
                  </div>

                  {/* NEW: Added onClick handler to pop open the modal */}
                  <button
                    disabled={ticket.status !== 'CONFIRMED'}
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-full md:w-auto px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-dim transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                      />
                    </svg>
                    {ticket.status === 'CONFIRMED' ? 'Show QR Code' : 'Waitlisted'}
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold font-headline text-on-surface">Active Events</h2>
              <Link href="/events/new">
                <button className="px-5 py-2.5 bg-inverse-surface text-inverse-on-surface font-bold rounded-xl hover:opacity-90 transition-opacity text-sm shadow-md">
                  + Create Event
                </button>
              </Link>
            </div>

            {hostedEvents.length === 0 ? (
              <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                <p className="text-on-surface-variant font-body">
                  You aren&apos;t hosting any events.
                </p>
              </div>
            ) : (
              hostedEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-surface-container rounded-2xl p-6 border border-outline-variant/20 flex flex-col md:flex-row items-start justify-between gap-6 hover:border-primary/50 transition-colors"
                >
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${event.isPublished ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-variant text-on-surface-variant'}`}
                      >
                        {event.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-on-surface-variant text-sm font-medium">
                        {new Date(event.startAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <h3 className="text-2xl font-headline font-bold text-on-surface">
                      {event.title}
                    </h3>

                    <div className="mt-5 flex flex-wrap gap-4">
                      <div className="bg-background px-5 py-3 rounded-xl border border-outline-variant/20 flex-grow md:flex-grow-0">
                        <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                          Registrations
                        </p>
                        <p className="text-2xl font-headline font-bold text-on-surface mt-1">
                          {event._count.registrations}
                        </p>
                      </div>
                      <div className="bg-background px-5 py-3 rounded-xl border border-outline-variant/20 flex-grow md:flex-grow-0">
                        <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                          Checked In
                        </p>
                        <p className="text-2xl font-headline font-bold text-on-surface mt-1">
                          {event.checkedInCount}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <Link href={`/events/${event.slug}/dashboard`} className="w-full">
                      <button className="w-full px-8 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-dim transition-colors">
                        Manage Event
                      </button>
                    </Link>
                    <button className="w-full px-8 py-3 bg-transparent border-2 border-outline-variant text-on-surface font-bold rounded-xl hover:bg-surface-variant transition-colors">
                      Scanner / Check-in
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* NEW: TICKET MODAL OVERLAY */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-primary p-6 text-on-primary relative">
              <button
                onClick={() => setSelectedTicket(null)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <p className="text-sm font-bold uppercase tracking-wider opacity-80">Admit One</p>
              <h2 className="text-2xl font-headline font-extrabold mt-1">
                {selectedTicket.event.title}
              </h2>
              <p className="mt-2 opacity-90">
                {new Date(selectedTicket.event.startAt).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Modal Body: QR Code */}
            <div className="p-8 flex flex-col items-center bg-white">
              <div className="p-4 border-4 border-gray-100 rounded-2xl shadow-sm mb-6">
                {/* Dynamically generating the QR using a fast public API based on your raw UUID */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${selectedTicket.qrCode}&margin=10`}
                  alt="Ticket QR Code"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-gray-900 font-headline font-bold text-xl">{user.name}</p>
              <p className="text-gray-500 text-sm mt-1">{user.email}</p>

              <div className="w-full mt-8 pt-6 border-t border-dashed border-gray-200 text-center">
                <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">
                  Ticket ID
                </p>
                <p className="text-sm text-gray-800 font-mono mt-1">{selectedTicket.id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
