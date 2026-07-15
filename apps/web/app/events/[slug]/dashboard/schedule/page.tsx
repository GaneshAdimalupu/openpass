import { notFound } from 'next/navigation'
import { getEventBySlug, getScheduleItems } from '@openpass/core'
import { ScheduleManager } from './ScheduleManager'

export default async function SchedulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) return notFound()

  const scheduleItems = await getScheduleItems(event.id)

  return (
    <div className="p-8 w-full max-w-[1200px]">
      <ScheduleManager event={event} initialItems={scheduleItems} />
    </div>
  )
}
