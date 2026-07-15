'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AstronautSVG } from '../components/AstronautSVG'

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const nebulaeRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let stars: {
      x: number
      y: number
      size: number
      opacity: number
      speed: number
      color: string
    }[] = []
    const STAR_COUNT = 450
    let animationFrameId: number
    let starTimeoutId: NodeJS.Timeout

    const init = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height

      stars = []
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.8,
          opacity: Math.random(),
          speed: 0.005 + Math.random() * 0.015,
          color: Math.random() > 0.8 ? '#85adff' : '#EAEFEF',
        })
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#19242d'
      ctx.fillRect(0, 0, width, height)

      stars.forEach((star) => {
        star.opacity += star.speed
        if (star.opacity > 1 || star.opacity < 0.1) {
          star.speed = -star.speed
        }

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = star.color
        ctx.globalAlpha = star.opacity
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(draw)
    }

    const createShootingStar = () => {
      if (!containerRef.current) return

      const star = document.createElement('div')
      star.className = 'shooting-star'

      let startX, startY
      if (Math.random() > 0.5) {
        startX = Math.random() * window.innerWidth
        startY = -150
      } else {
        startX = -150
        startY = Math.random() * (window.innerHeight * 0.5)
      }

      const angleDeg = 20 + Math.random() * 30
      const angleRad = angleDeg * (Math.PI / 180)
      const distance = Math.max(window.innerWidth, window.innerHeight) * 1.5
      const moveX = Math.cos(angleRad) * distance
      const moveY = Math.sin(angleRad) * distance

      const length = 100 + Math.random() * 150
      const duration = 0.8 + Math.random() * 1.5

      star.style.left = `${startX}px`
      star.style.top = `${startY}px`
      star.style.width = `${length}px`
      star.style.setProperty('--angle', `${angleDeg}deg`)
      star.style.setProperty('--move-x', `${moveX}px`)
      star.style.setProperty('--move-y', `${moveY}px`)
      star.style.animation = `shooting ${duration}s ease-in forwards`

      containerRef.current.appendChild(star)

      setTimeout(() => {
        if (star && star.parentNode) {
          star.remove()
        }
      }, duration * 1000)
    }

    const scheduleNextStar = () => {
      const nextTime = 1500 + Math.random() * 6000
      starTimeoutId = setTimeout(() => {
        createShootingStar()
        scheduleNextStar()
      }, nextTime)
    }

    const handleResize = () => init()

    const handleMouseMove = (e: MouseEvent) => {
      const moveX = (e.clientX - width / 2) * 0.01
      const moveY = (e.clientY - height / 2) * 0.01

      nebulaeRef.current.forEach((neb, index) => {
        if (neb) {
          const factor = (index + 1) * 0.5
          neb.style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`
        }
      })
    }

    init()
    draw()
    scheduleNextStar()

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)

    // Cleanup phase so Next.js doesn't crash on hot-reloads
    return () => {
      cancelAnimationFrame(animationFrameId)
      clearTimeout(starTimeoutId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // 1. Create a state variable to hold the quote, defaulting to an empty string to match server render
  const [quote, setQuote] = useState('')

  // 2. Add a new useEffect just to handle setting the quote on the client
  useEffect(() => {
    const sarcasticQuotes = [
      'What are you looking for? There are no doors in the vacuum of space.',
      'Lost? Or just snooping around for undocumented endpoints?',
      "404: Oxygen missing. Also, this page doesn't exist.",
      "You look like a tinkerer. Shouldn't you be opening a pull request?",
      'There is nothing here. Go write some code.',
    ]
    const randomQuote =
      sarcasticQuotes[Math.floor(Math.random() * sarcasticQuotes.length)] ?? '404 Not Found'
    setQuote(randomQuote)
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#19242d] text-white px-4 select-none">
      {/* --- INJECTED VANILLA CSS --- */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .nebula { position: absolute; width: 100%; height: 100%; pointer-events: none; z-index: 1; transition: transform 0.1s ease-out; }
        .glow-1 { background: radial-gradient(circle at 20% 30%, rgba(0, 112, 235, 0.15) 0%, transparent 60%); filter: blur(80px); }
        .glow-2 { background: radial-gradient(circle at 80% 70%, rgba(133, 173, 255, 0.1) 0%, transparent 50%); filter: blur(100px); }
        .glow-3 { background: radial-gradient(circle at 50% 50%, rgba(250, 176, 255, 0.03) 0%, transparent 40%); filter: blur(60px); }
        .scanlines { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.2) 51%); background-size: 100% 4px; pointer-events: none; z-index: 5; opacity: 0.15; }
        .core-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 1px; height: 1px; box-shadow: 0 0 300px 150px rgba(0, 112, 235, 0.08); border-radius: 50%; z-index: 2; }
        .shooting-star { position: absolute; height: 2px; background: linear-gradient(90deg, transparent, #85adff); border-radius: 999px; filter: drop-shadow(0 0 6px #85adff); z-index: 2; pointer-events: none; opacity: 0; }
        @keyframes shooting {
          0% { transform: translateX(0) translateY(0) rotate(var(--angle)); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateX(var(--move-x)) translateY(var(--move-y)) rotate(var(--angle)); opacity: 0; }
        }
      `,
        }}
      />

      {/* --- BACKGROUND LAYERS --- */}
      <div className="fixed inset-0 z-[2] pointer-events-none" ref={containerRef}></div>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />
      <div
        ref={(el) => {
          nebulaeRef.current[0] = el
        }}
        className="nebula glow-1"
      ></div>
      <div
        ref={(el) => {
          nebulaeRef.current[1] = el
        }}
        className="nebula glow-2"
      ></div>
      <div
        ref={(el) => {
          nebulaeRef.current[2] = el
        }}
        className="nebula glow-3"
      ></div>
      <div className="core-glow"></div>
      <div className="scanlines"></div>

      {/* --- FOREGROUND UI (Your 404 Layout) --- */}
      <div className="relative z-[10] flex flex-col items-center">
        {/* THE 404 SECTION */}
        <div className="flex items-center justify-center text-[10rem] md:text-[18rem] font-black leading-none tracking-normal">
          <span className="relative z-0">4</span>

          <div className="relative z-10 h-[150px] w-[100px] md:h-[299px] md:w-[165px] mx-0 md:mx-1 flex items-center justify-center">
            <AstronautSVG />
          </div>

          <span className="relative z-0">4</span>
        </div>

        {/* Text */}
        <h2 className="mt-4 text-xl md:text-2xl font-semibold text-center z-10 tracking-wide max-w-2xl px-4 min-h-[4rem] flex items-center justify-center">
          {quote}
        </h2>

        {/* Button */}
        <Link href="/" className="z-10 mt-10">
          <button className="px-10 py-3.5 bg-white text-[#1a1c4b] rounded-xl font-extrabold hover:bg-gray-100 transition-all uppercase tracking-widest text-sm md:text-base shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            Go Back
          </button>
        </Link>
      </div>
    </div>
  )
}
