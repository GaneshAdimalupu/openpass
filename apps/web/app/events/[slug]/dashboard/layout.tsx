'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { use } from 'react'

const TABS = [
  { name: 'Details', path: '/details', icon: 'settings' },
  { name: 'RSVP & Overview', path: '', icon: 'group' },
  { name: 'CFP', path: '/cfp', icon: 'campaign' },
  { name: 'Schedule', path: '/schedule', icon: 'event_note' },
  { name: 'Partners', path: '/partners', icon: 'handshake' },
  { name: 'Project Show', path: '/projects', icon: 'code' },
  { name: 'Mailing', path: '/mailing', icon: 'mail' },
  { name: 'Volunteers', path: '/volunteers', icon: 'volunteer_activism' },
]

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const pathname = usePathname()
  const basePath = `/events/${slug}/dashboard`

  return (
    <div className="h-screen bg-[#19242d] flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#25343F] flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <Link
            href="/dashboard"
            className="text-[#85adff] text-xs font-bold font-headline hover:underline flex items-center gap-2 mb-4"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to All Events
          </Link>
          <h2 className="text-xl font-headline font-bold text-white tracking-tight">
            Event Dashboard
          </h2>
          <p className="text-[#BFC9D1] text-xs font-body mt-1">Manage your event</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {TABS.map((tab) => {
            const href = `${basePath}${tab.path}`
            const isActive = tab.path === '' ? pathname === basePath : pathname === href

            return (
              <Link
                key={tab.name}
                href={href}
                className={[
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-headline transition-all group',
                  isActive
                    ? 'bg-gradient-to-r from-[#85adff]/10 to-transparent text-[#85adff] font-bold'
                    : 'text-[#BFC9D1] hover:bg-[#2b3d4a] hover:text-white',
                ].join(' ')}
              >
                <span
                  className={[
                    'material-symbols-outlined text-[20px] transition-colors',
                    isActive ? 'text-[#85adff]' : 'text-[#a8b3bc] group-hover:text-white',
                  ].join(' ')}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {tab.icon}
                </span>
                {tab.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#19242d]">{children}</main>
    </div>
  )
}
