'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession, signOut } from '@openpass/auth/client'
import { useRouter } from 'next/navigation' // Added useRouter

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter() // Initialize router

  const { data: session, isPending } = useSession()
  const isLoggedIn = !!session?.user

  // SMARTER LOADING: Only show skeleton if it is actively fetching AND we don't have cached session data yet.
  const isLoading = !mounted || (isPending && session === undefined)

  useEffect(() => {
    setMounted(true)

    // BFCache Fix: Force Next.js to unfreeze and refresh the router if the user navigates via the Back/Forward buttons.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        router.refresh()
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [router])

  // Close mobile menu when switching to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    // THE MAC DOCK EFFECT: Floating, centered, rounded-full, frosted glass
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl bg-[#0e0e0e]/70 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-full transition-all duration-300">
      <div className="flex justify-between items-center px-6 lg:px-8 h-16 w-full mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tighter text-white font-headline hover:opacity-80 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/openpass-logo.svg" alt="OpenPass Logo" className="h-8 w-auto" />
          OpenPass
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link
            href="/events"
            className="text-sm font-medium text-on-surface-variant hover:text-white transition-colors font-headline"
          >
            Explore
          </Link>
          {mounted && isLoggedIn && (
            <>
              <Link
                href="/tickets"
                className="text-sm font-medium text-on-surface-variant hover:text-white transition-colors font-headline"
              >
                My Tickets
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-on-surface-variant hover:text-white transition-colors font-headline"
              >
                Dashboard
              </Link>
            </>
          )}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {isLoading ? (
              <>
                <div className="w-10 h-10 rounded-full bg-surface-container-high animate-pulse" />
                <div className="w-24 h-10 rounded-full bg-surface-container-high animate-pulse" />
              </>
            ) : isLoggedIn ? (
              <>
                <button
                  className="material-symbols-outlined text-on-surface-variant hover:text-white transition-colors"
                  aria-label="Notifications"
                >
                  notifications
                </button>

                {/* Avatar */}
                <Link
                  href="/me"
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-[#85adff] to-[#0070eb] flex items-center justify-center text-[#002c65] font-bold text-sm shadow-lg hover:scale-105 transition-transform overflow-hidden p-0.5"
                >
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover bg-[#0e0e0e]"
                    />
                  ) : (
                    (session.user.name?.[0]?.toUpperCase() ?? 'U')
                  )}
                </Link>

                <Link
                  href="/events/new"
                  className="bg-gradient-to-br from-[#85adff] to-[#0070eb] text-[#002c65] px-5 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-[#0070eb]/20"
                >
                  Create Event
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-on-surface-variant hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-gradient-to-br from-[#85adff] to-[#0070eb] text-[#002c65] px-5 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-[#0070eb]/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="lg:hidden flex items-center">
            <button
              className="material-symbols-outlined text-on-surface-variant hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? 'close' : 'menu'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`lg:hidden absolute top-20 left-0 w-full transition-all duration-300 ${
          mobileOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-[#1a1919]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mx-4 shadow-2xl flex flex-col gap-4">
          <Link
            href="/events"
            className="text-lg font-headline font-semibold text-on-surface-variant hover:text-white transition"
            onClick={() => setMobileOpen(false)}
          >
            Explore
          </Link>
          {mounted && isLoggedIn ? (
            <>
              <Link
                href="/tickets"
                className="text-lg font-headline font-semibold text-on-surface-variant hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                My Tickets
              </Link>
              <Link
                href="/dashboard"
                className="text-lg font-headline font-semibold text-on-surface-variant hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="text-left pt-4 mt-2 border-t border-white/10 text-lg font-semibold text-[#ff716c]"
              >
                Sign out
              </button>
            </>
          ) : mounted ? (
            <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-white/10">
              <Link
                href="/auth/login"
                className="py-3 text-center rounded-xl bg-[#262626] text-white font-semibold"
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="py-3 text-center bg-gradient-to-br from-[#85adff] to-[#0070eb] text-[#002c65] rounded-xl font-bold"
                onClick={() => setMobileOpen(false)}
              >
                Get Started
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
