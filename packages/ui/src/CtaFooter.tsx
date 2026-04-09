export function CtaSection() {
  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-5xl mx-auto glass-panel rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-tertiary/5 pointer-events-none" />

        <div className="relative z-10 space-y-8">
          <h2 className="text-4xl md:text-6xl font-black font-headline tracking-tighter text-white">
            Ready to elevate?
          </h2>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto">
            Join the FOSS community building the future of event management. Self-host in minutes or
            contribute on GitHub.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <a
              href="https://github.com/your-org/openpass"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-10 py-5 bg-transparent border-2 border-primary text-primary text-lg font-bold rounded-2xl hover:bg-primary/10 transition-all active:scale-95 font-headline flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">code</span>
              Contribute
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

const footerLinks: string[] = []

export function Footer() {
  return (
    <footer className="w-full py-12 px-8 bg-transparent">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="text-lg font-bold text-white font-headline">OpenPass</div>
          <p className="font-body text-xs text-on-surface-variant">
            © {new Date().getFullYear()} OpenPass. The Electric Noir Experience. AGPL-3.0.
          </p>
        </div>

        {footerLinks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {footerLinks.map((label) => (
              <a
                key={label}
                href="#"
                className="text-on-surface-variant hover:text-primary transition-colors font-body text-xs"
              >
                {label}
              </a>
            ))}
          </div>
        )}

        <div className="flex gap-4">
          {[
            { icon: 'language', label: 'Language' },
            { icon: 'share', label: 'Share' },
          ].map(({ icon, label }) => (
            <button
              key={icon}
              aria-label={label}
              className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center hover:bg-primary/20 transition-colors group"
            >
              <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary">
                {icon}
              </span>
            </button>
          ))}
        </div>
      </div>
    </footer>
  )
}

export function CtaFooter() {
  return (
    <>
      <CtaSection />
      <Footer />
    </>
  )
}
