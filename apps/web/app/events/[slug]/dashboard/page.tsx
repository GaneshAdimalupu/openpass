import { getEventBySlug } from '@openpass/core'
import { prisma } from '@openpass/db'
import { notFound } from 'next/navigation'

export default async function DashboardOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) return notFound()

  const registrations = await prisma.registration.findMany({
    where: { eventId: event.id, deletedAt: null },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  })

  const confirmedCount = registrations.filter((r) => r.status === 'CONFIRMED').length
  const waitlistedCount = registrations.filter((r) => r.status === 'WAITLISTED').length
  const checkedInCount = registrations.filter((r) => r.checkedIn).length

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-headline font-bold text-white mb-2">Overview & RSVP</h1>
          <p className="text-[#BFC9D1] font-body">Manage {event.title} registrations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#25343F] border border-white/5 p-6 rounded-2xl">
          <p className="text-[#BFC9D1] text-sm font-bold uppercase tracking-widest font-headline mb-2">
            Total RSVP
          </p>
          <p className="text-3xl font-bold text-white">{registrations.length}</p>
        </div>
        <div className="bg-[#25343F] border border-white/5 p-6 rounded-2xl">
          <p className="text-[#BFC9D1] text-sm font-bold uppercase tracking-widest font-headline mb-2">
            Confirmed
          </p>
          <p className="text-3xl font-bold text-[#85adff]">{confirmedCount}</p>
        </div>
        <div className="bg-[#25343F] border border-white/5 p-6 rounded-2xl">
          <p className="text-[#BFC9D1] text-sm font-bold uppercase tracking-widest font-headline mb-2">
            Waitlisted
          </p>
          <p className="text-3xl font-bold text-[#ff9800]">{waitlistedCount}</p>
        </div>
        <div className="bg-[#25343F] border border-white/5 p-6 rounded-2xl">
          <p className="text-[#BFC9D1] text-sm font-bold uppercase tracking-widest font-headline mb-2">
            Checked In
          </p>
          <p className="text-3xl font-bold text-[#4caf50]">{checkedInCount}</p>
        </div>
      </div>

      <div className="bg-[#25343F] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-headline font-bold text-white">Attendee List</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#1a1a1a]">
                <th className="p-4 text-xs font-bold text-[#85adff] uppercase tracking-widest font-headline">
                  Name
                </th>
                <th className="p-4 text-xs font-bold text-[#85adff] uppercase tracking-widest font-headline">
                  Email
                </th>
                <th className="p-4 text-xs font-bold text-[#85adff] uppercase tracking-widest font-headline">
                  Status
                </th>
                <th className="p-4 text-xs font-bold text-[#85adff] uppercase tracking-widest font-headline">
                  Custom Data
                </th>
                <th className="p-4 text-xs font-bold text-[#85adff] uppercase tracking-widest font-headline">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-sm text-white font-body">{reg.user.name || 'Unknown'}</td>
                  <td className="p-4 text-sm text-[#BFC9D1] font-body">{reg.user.email}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                        reg.status === 'CONFIRMED'
                          ? 'bg-[#85adff]/10 text-[#85adff]'
                          : reg.status === 'WAITLISTED'
                            ? 'bg-[#ff9800]/10 text-[#ff9800]'
                            : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {reg.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-[#BFC9D1] font-body max-w-xs truncate">
                    {reg.formData && Object.keys(reg.formData).length > 0
                      ? JSON.stringify(reg.formData)
                      : 'None'}
                  </td>
                  <td className="p-4 text-sm text-[#BFC9D1] font-body">
                    {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
                      reg.createdAt
                    )}
                  </td>
                </tr>
              ))}
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#BFC9D1] font-body">
                    No registrations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
