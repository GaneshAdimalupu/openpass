import { notFound } from 'next/navigation'
import { getEventBySlug, getProjects } from '@openpass/core'
import { ProjectsManager } from './ProjectsManager'

export default async function ProjectsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) return notFound()

  const projects = await getProjects(event.id)

  return (
    <div className="p-8 w-full max-w-[1200px]">
      <ProjectsManager event={event} initialProjects={projects} />
    </div>
  )
}
