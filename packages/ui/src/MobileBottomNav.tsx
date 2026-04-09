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
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe px-6 bg-[#0e0e0e]/90 backdrop-blur-lg rounded-t-[2rem] border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      {navItems.map(({ icon, label, href }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center transition-transform duration-150 active:scale-90 ${
              active
                ? 'text-primary drop-shadow-[0_0_8px_rgba(133,173,255,0.5)]'
                : 'text-on-surface-variant'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {icon}
            </span>
            <span className="font-body text-[10px] uppercase tracking-widest mt-1">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
