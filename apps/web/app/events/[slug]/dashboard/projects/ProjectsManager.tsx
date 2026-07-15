'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProjectAction, deleteProjectAction } from '../../../../actions/project'

export function ProjectsManager({
  event,
  initialProjects,
}: {
  event: any
  initialProjects: any[]
}) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    demoUrl: '',
    description: '',
    logoUrl: '',
  })

  const handleOpenModal = () => {
    setFormData({ title: '', demoUrl: '', description: '', logoUrl: '' })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const newProject = await createProjectAction({
        eventId: event.id,
        title: formData.title,
        demoUrl: formData.demoUrl,
        description: formData.description,
        logoUrl: formData.logoUrl,
      })
      setProjects([newProject, ...projects])
      setIsModalOpen(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to add project')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to remove this project?')) return
    try {
      await deleteProjectAction(projectId, event.id)
      setProjects(projects.filter((p) => p.id !== projectId))
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to remove project')
    }
  }

  const handleFakeUpload = () => {
    const url = window.prompt('Enter Logo Image URL (file upload simulation):')
    if (url) {
      setFormData({ ...formData, logoUrl: url })
    }
  }

  return (
    <div className="w-full text-white font-body">
      {/* Header Area */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
          <span className="bg-[#2a2a2a] text-[#888] px-2 py-0.5 rounded text-[10px] font-bold border border-[#333]">
            {event.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
        <p className="text-[#888] text-[13px] flex items-center gap-2">
          {event.category}
          <span className="w-1 h-1 rounded-full bg-[#555]"></span>
          {new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(new Date(event.startAt))}
          {' - '}
          {new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(new Date(event.endAt))}
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <div className="flex items-baseline gap-2 mb-4">
            <h2 className="text-[18px] font-bold tracking-tight">Project Showcases</h2>
          </div>

          <button
            onClick={handleOpenModal}
            className="mb-4 px-3 py-1.5 bg-[#2a2a2a] border border-[#333] text-white rounded-md hover:bg-[#333] text-[13px] font-medium transition-colors"
          >
            Add Showcase
          </button>

          {projects.length === 0 ? (
            <p className="text-[#888] text-[13px]">No showcases added for this event.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="relative group border border-[#333] bg-[#1c1c1c] rounded-lg p-4 flex flex-col items-center text-center"
                >
                  {project.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.logoUrl}
                      alt={project.title}
                      className="max-w-full h-16 object-cover rounded-md mb-3"
                    />
                  ) : (
                    <div className="w-full h-16 bg-[#2a2a2a] rounded-md mb-3 flex items-center justify-center text-[#666] text-xs">
                      No Image
                    </div>
                  )}
                  <h3 className="text-sm font-bold truncate w-full">{project.title}</h3>
                  {project.description && (
                    <p className="text-[#888] text-[11px] mt-1 line-clamp-2 w-full leading-tight">
                      {project.description}
                    </p>
                  )}
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#85adff] text-[11px] hover:underline truncate w-full mt-2"
                    >
                      {project.demoUrl.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/20 text-red-500 rounded-md hover:bg-red-500/40 transition-all"
                    title="Remove Project"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add Project Showcase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#242424] border border-[#333] rounded-xl w-full max-w-[440px] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 flex justify-between items-center">
              <h3 className="text-[16px] font-bold text-white tracking-tight">
                Add Project Showcase
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#888] hover:text-white transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">
                  Showcase Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-transparent focus:border-[#444] rounded-md py-2.5 px-3 text-white text-[13px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">
                  Website Link <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888] text-[16px]">
                    link
                  </span>
                  <input
                    type="url"
                    required
                    value={formData.demoUrl}
                    onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                    className="w-full bg-[#1c1c1c] border border-transparent focus:border-[#444] rounded-md py-2.5 pl-9 pr-3 text-white text-[13px] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Showcase Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#1c1c1c] border border-transparent focus:border-[#444] rounded-md py-2.5 px-3 text-white text-[13px] outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Community Logo</label>

                {formData.logoUrl ? (
                  <div className="relative w-full h-32 bg-[#1c1c1c] rounded-md border border-[#333] flex items-center justify-center p-4 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.logoUrl}
                      alt="Logo Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                      <button
                        type="button"
                        onClick={handleFakeUpload}
                        className="text-xs text-white bg-[#333] px-3 py-1.5 rounded"
                      >
                        Change Logo
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleFakeUpload}
                    className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-transparent rounded-md border border-[#333] hover:border-[#555] transition-colors cursor-pointer text-[#666] hover:text-[#888]"
                  >
                    <span className="material-symbols-outlined text-[24px]">image</span>
                    <span className="text-[12px]">Click to browse files</span>
                  </button>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-white text-black rounded-md text-[13px] font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
