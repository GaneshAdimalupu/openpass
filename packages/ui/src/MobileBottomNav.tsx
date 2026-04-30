'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { icon: 'home', label: 'Home', href: '/' },
  { icon: 'search', label: 'Explore', href: '/events' },
  { icon: 'local_activity', label: 'Tickets', href: '/tickets' },
  { icon: 'person', label: 'Profile', href: '/profile' },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    // THE MAC DOCK EFFECT FOR MOBILE: Floating, rounded-full, detached from bottom
    <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] z-50 flex justify-around items-center h-16 px-4 bg-[#1a1919]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
      {navItems.map(({ icon, href }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition-all duration-200 active:scale-90 ${
              active
                ? 'text-[#85adff] drop-shadow-[0_0_8px_rgba(133,173,255,0.5)]'
                : 'text-[#adaaaa] hover:text-white'
            }`}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {icon}
            </span>
            {/* Optional: Hide labels for a truer icon-only Mac Dock feel */}
            {/* <span className="font-body text-[9px] uppercase tracking-widest mt-1">{label}</span> */}
          </Link>
        )
      })}
    </nav>
  )
}
