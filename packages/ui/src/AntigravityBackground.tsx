'use client'

import { useEffect, useRef } from 'react'

export function AntigravityBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    if (!ctx) return

    let animationFrameId: number
    let particles: Particle[] = []

    // Resize canvas to fill the screen
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
    }
    window.addEventListener('resize', resize)

    // Track mouse position
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 120, // Distance at which the antigravity repulsion starts
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    const handleMouseLeave = () => {
      mouse.x = -1000
      mouse.y = -1000
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseout', handleMouseLeave)

    class Particle {
      x: number
      y: number
      baseX: number
      baseY: number
      size: number
      density: number
      color: string

      constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.baseX = x
        this.baseY = y
        this.size = Math.random() * 2.5 + 0.5
        this.density = Math.random() * 15 + 5 // Determines how fast it repels

        // Colors that match your primary/tertiary tailwind gradients
        const colors = [
          'rgba(133, 173, 255, 0.6)', // Primary-ish
          'rgba(200, 200, 255, 0.4)', // Muted blue
          'rgba(255, 255, 255, 0.2)', // Subtle white
        ]
        this.color = colors[Math.floor(Math.random() * colors.length)]!
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.closePath()
        ctx.fill()
      }

      update() {
        // Cursor Hook: Antigravity / Repulsion logic
        const dx = mouse.x - this.x
        const dy = mouse.y - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const forceDirectionX = dx / distance
        const forceDirectionY = dy / distance
        const maxDistance = mouse.radius
        const force = (maxDistance - distance) / maxDistance
        const directionX = forceDirectionX * force * this.density
        const directionY = forceDirectionY * force * this.density

        if (distance < maxDistance) {
          // Push away from cursor
          this.x -= directionX
          this.y -= directionY
        } else {
          // Return towards base X smoothly
          if (this.x !== this.baseX) {
            const dx = this.x - this.baseX
            this.x -= dx / 25
          }
        }

        // Continual upward drift (the baseline "antigravity" float)
        this.y -= this.size * 0.3
        this.baseY -= this.size * 0.3

        // Reset particle to the bottom when it floats off the top
        if (this.y < -10) {
          this.y = canvas.height + 10
          this.baseY = this.y
          this.x = Math.random() * canvas.width
          this.baseX = this.x
        }
      }
    }

    const initParticles = () => {
      particles = []
      // Adjust the divisor to change particle density (lower = more particles)
      const numberOfParticles = (canvas.width * canvas.height) / 8000
      for (let i = 0; i < numberOfParticles; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        particles.push(new Particle(x, y))
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < particles.length; i++) {
        particles[i]!.draw()
        particles[i]!.update()
      }
      animationFrameId = requestAnimationFrame(animate)
    }

    resize()
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseout', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="fixed inset-0 z-[-1] pointer-events-none w-full h-full" />
  )
}
