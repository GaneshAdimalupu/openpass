import { getEventBySlug } from '@openpass/core'
import { notFound } from 'next/navigation'
import { DetailsForm } from './DetailsForm'

export default async function DetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) return notFound()

  return (
    <div className="p-8 w-full max-w-[1200px]">
      <DetailsForm event={event} />
    </div>
  )
}
