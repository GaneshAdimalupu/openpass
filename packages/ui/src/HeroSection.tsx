export function HeroSection() {
  return (
    <section className="relative min-h-[921px] flex flex-col items-center justify-center overflow-hidden px-6 py-20">
      {/* Background atmosphere glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tertiary/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left: copy */}
        <div className="space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-primary text-sm font-bold tracking-widest font-label uppercase">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Next Generation Access
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-black font-headline tracking-tighter leading-[0.9] text-white">
            The{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">
              Electric
            </span>{' '}
            Noir Experience.
          </h1>

          {/* Subheading */}
          <p className="text-on-surface-variant text-xl max-w-xl leading-relaxed">
            OpenPass redefines event management with cinematic precision. Create, manage, and scale
            high-octane experiences with a platform built for the bold. Fully open source — own your
            data.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 pt-4">
            <a
              href="/dashboard"
              className="px-8 py-5 bg-gradient-to-br from-primary to-primary-dim text-on-primary text-lg font-bold rounded-xl shadow-[0_0_30px_rgba(133,173,255,0.4)] hover:scale-105 active:scale-95 transition-all font-headline flex items-center justify-center"
            >
              Get Started
            </a>
            <a
              href="https://github.com/your-org/openpass"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-5 bg-transparent border-2 border-white/20 text-white text-lg font-bold rounded-xl hover:border-white/40 hover:bg-white/5 active:scale-95 transition-all font-headline flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">code</span>
              View on GitHub
            </a>
          </div>

          {/* OSS trust signal */}
          <div className="flex items-center gap-3 text-sm text-on-surface-variant pt-2">
            <span className="material-symbols-outlined text-base text-primary">lock_open</span>
            Free &amp; open source · AGPL-3.0 · Self-hostable
          </div>
        </div>

        {/* Right: event venue visual */}
        <div className="relative hidden lg:block">
          <div className="relative rounded-[2rem] overflow-hidden electric-glow">
            {/* Placeholder gradient image stand-in */}
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low flex items-center justify-center">
              <div className="text-center space-y-4 opacity-60">
                <span className="material-symbols-outlined text-8xl text-primary/40">
                  confirmation_number
                </span>
                <p className="text-on-surface-variant text-sm font-label">Event visual</p>
              </div>
            </div>
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface/60 via-transparent to-transparent" />
          </div>

          {/* Floating ticket badge */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-tertiary/20 glass-panel flex items-center justify-center rotate-12 hover:rotate-6 transition-transform duration-500">
            <span
              className="material-symbols-outlined text-4xl text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              confirmation_number
            </span>
          </div>

          {/* Ambient glow behind ticket */}
          <div className="absolute -top-4 -right-4 w-40 h-40 bg-primary/30 rounded-full blur-3xl pointer-events-none" />
        </div>
      </div>
    </section>
  )
}
