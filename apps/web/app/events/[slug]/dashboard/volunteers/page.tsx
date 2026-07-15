import { notFound } from 'next/navigation'
import { getEventBySlug, getVolunteers } from '@openpass/core'
import { VolunteersManager } from './VolunteersManager'

export default async function VolunteersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) return notFound()

  const volunteers = await getVolunteers(event.id)

  return (
    <div className="p-8 w-full max-w-[1200px]">
      <VolunteersManager event={event} initialVolunteers={volunteers} />
    </div>
  )
}
