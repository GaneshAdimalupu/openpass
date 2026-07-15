import React from 'react'

export function HeroSection() {
  return (
    <section className="relative pt-32 md:pt-40 pb-16 px-6 md:px-8 overflow-x-clip">
      {/* Custom Styles for the infinite Tech Stack Ticker */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>

      {/* Background atmosphere glows */}
      <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[60%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Main Editorial Headline */}
        <h1 className="text-[2.75rem] leading-[1.1] sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black font-headline tracking-tighter text-white w-full">
          {/* LINE 1 */}
          <span className="relative w-fit mx-auto flex items-center justify-center gap-3 md:gap-4">
            Where Open Source{' '}
            <span className="text-tertiary-fixed text-4xl md:text-6xl lg:text-[5rem] -translate-y-1 md:-translate-y-2">
              ✨
            </span>
            {/* Floating Beta Status */}
            <span className="absolute left-full top-1/2 -translate-y-1/2 ml-6 w-60 text-left hidden lg:block">
              <span className="block text-sm text-primary font-bold tracking-normal mb-1">
                Currently in v1.0 Beta
              </span>
              <span className="block text-[11px] text-on-surface-variant font-body leading-relaxed tracking-normal font-normal">
                An open-source initiative to take back control of your event data.
              </span>
            </span>
          </span>

          {/* LINE 2 */}
          <span className="block mt-2 md:mt-3">
            Meets{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">
              Epic Events
            </span>
          </span>

          {/* LINE 3 */}
          <span className="mt-2 md:mt-3 flex flex-col md:flex-row flex-wrap items-center justify-center gap-3 md:gap-5">
            <span className="inline-flex items-center justify-center px-5 py-2 md:py-2.5 rounded-full bg-[#25343F]/80 border border-white/10 backdrop-blur-xl text-xl md:text-3xl text-primary font-bold tracking-widest shadow-[0_0_30px_rgba(133, 173, 255,0.15)] shrink-0 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse mr-3 shrink-0" />
              AGPL-3.0
            </span>
          </span>
        </h1>

        <p className="text-on-surface-variant text-base md:text-lg max-w-2xl mx-auto mt-8 font-body leading-relaxed">
          The future of event access without the vendor lock-in. Create, manage, and scale
          high-octane experiences with a platform built by developers, for the bold.
        </p>

        {/* Tech Stack Infinite Ticker */}
        <div className="w-full mt-16">
          <p className="text-[10px] md:text-xs font-bold text-on-surface-variant tracking-[0.2em] uppercase mb-8 font-headline">
            Built with modern web standards
          </p>
          <div
            className="w-full overflow-hidden relative"
            style={{
              maskImage:
                'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            }}
          >
            <div className="flex w-max animate-scroll gap-12 md:gap-20 opacity-40 hover:opacity-80 transition-opacity duration-500 cursor-default py-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-12 md:gap-20 items-center">
                  <span className="text-xl md:text-2xl font-bold font-headline text-white tracking-tight flex items-center gap-2">
                    Next.js
                  </span>
                  <span className="text-xl md:text-2xl font-bold font-headline text-white tracking-tight flex items-center gap-2">
                    Prisma
                  </span>
                  <span className="text-xl md:text-2xl font-bold font-headline text-white tracking-tight flex items-center gap-2">
                    TypeScript
                  </span>
                  <span className="text-xl md:text-2xl font-bold font-headline text-white tracking-tight flex items-center gap-2">
                    Tailwind
                  </span>
                  <span className="text-xl md:text-2xl font-bold font-headline text-white tracking-tight flex items-center gap-2">
                    PostgreSQL
                  </span>
                  <span className="text-xl md:text-2xl font-bold font-headline text-white tracking-tight flex items-center gap-2">
                    Docker
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
