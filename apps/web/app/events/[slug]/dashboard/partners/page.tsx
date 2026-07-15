import { notFound } from 'next/navigation'
import { getEventBySlug, getPartners } from '@openpass/core'
import { PartnersManager } from './PartnersManager'

export default async function PartnersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) return notFound()

  const partners = await getPartners(event.id)

  return (
    <div className="p-8 w-full max-w-[1200px]">
      <PartnersManager event={event} initialPartners={partners} />
    </div>
  )
}
