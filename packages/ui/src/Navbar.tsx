'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession, signOut } from '@openpass/auth/client'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { data: session, isPending } = useSession()
  const isLoggedIn = !!session?.user

  useEffect(() => {
    setMounted(true)
  }, [])

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
    <header className="fixed top-0 w-full z-50 bg-transparent">
      <div className="flex justify-between items-center px-6 lg:px-8 h-20 w-full max-w-[1440px] mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-bold tracking-tighter text-white font-headline"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/openpass-logo.svg" alt="OpenPass Logo" className="h-12 w-auto" />
          OpenPass
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link
            href="/events"
            className="text-on-surface-variant hover:text-white transition-colors font-headline"
          >
            Explore
          </Link>

          {mounted && isLoggedIn && (
            <>
              <Link
                href="/tickets"
                className="text-on-surface-variant hover:text-white transition-colors font-headline"
              >
                My Tickets
              </Link>
              <Link
                href="/dashboard"
                className="text-on-surface-variant hover:text-white transition-colors font-headline"
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
            {!mounted || isPending ? (
              <>
                <div className="w-16 h-8 rounded-lg bg-surface-container-high animate-pulse" />
                <div className="w-24 h-9 rounded-xl bg-surface-container-high animate-pulse" />
              </>
            ) : isLoggedIn ? (
              <>
                <button
                  className="material-symbols-outlined text-on-surface-variant hover:text-white"
                  aria-label="Notifications"
                >
                  notifications
                </button>

                {/* Avatar */}
                <div className="relative group">
                  <button className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-on-primary font-bold text-sm">
                    {session.user.name?.[0]?.toUpperCase() ?? 'U'}
                  </button>

                  {/* Dropdown */}
                  <div className="absolute right-0 top-12 w-48 bg-surface-container-high border border-white/5 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-bold text-white truncate">{session.user.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {session.user.email}
                      </p>
                    </div>

                    <Link
                      href="/profile"
                      className="block px-4 py-3 text-sm hover:bg-surface-container-highest"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-3 text-sm hover:bg-surface-container-highest"
                    >
                      Dashboard
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-sm border-t border-white/5 hover:bg-surface-container-highest"
                    >
                      Sign out
                    </button>
                  </div>
                </div>

                <Link
                  href="/events/new"
                  className="bg-gradient-to-br from-primary to-primary-dim text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:brightness-110"
                >
                  Create Event
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-on-surface-variant hover:text-white text-sm"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-gradient-to-br from-primary to-primary-dim text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm"
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

      {/* Mobile Menu */}
      <div
        className={`lg:hidden absolute top-20 left-0 w-full bg-transparent transition-all duration-300 ${
          mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="px-6 py-4 flex flex-col gap-3">
          <Link
            href="/events"
            className="block py-2 text-lg font-headline text-on-surface-variant hover:text-white transition"
            onClick={() => setMobileOpen(false)}
          >
            Explore
          </Link>

          {mounted && isLoggedIn ? (
            <>
              <Link
                href="/tickets"
                className="block py-2 text-lg font-headline text-on-surface-variant hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                My Tickets
              </Link>

              <Link
                href="/dashboard"
                className="block py-2 text-lg font-headline text-on-surface-variant hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>

              <button
                onClick={handleSignOut}
                className="block w-full text-left py-3 mt-3 border-t border-white/10 text-lg text-on-surface-variant hover:text-white"
              >
                Sign out
              </button>
            </>
          ) : mounted ? (
            <>
              <Link
                href="/auth/login"
                className="block py-2 text-lg text-center text-on-surface-variant"
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>

              <Link
                href="/auth/register"
                className="block py-3 text-center bg-gradient-to-br from-primary to-primary-dim text-on-primary rounded-xl font-bold"
                onClick={() => setMobileOpen(false)}
              >
                Get Started
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}
