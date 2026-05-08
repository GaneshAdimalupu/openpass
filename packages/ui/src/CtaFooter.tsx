const footerLinks: string[] = []

export function Footer() {
  return (
    <footer className="w-full py-12 px-8 bg-transparent">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2 text-lg font-bold text-white font-headline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/openpass-logo.svg"
              alt="OpenPass Logo"
              className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity"
            />
            OpenPass
          </div>
          <p className="font-body text-xs text-on-surface-variant">
            © {new Date().getFullYear()} OpenPass. Open Source Event Management. AGPL-3.0.
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

        <div className="flex gap-4 items-center">
          <a
            href="https://github.com/GaneshAdimalupu/openpass"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center hover:bg-primary/20 transition-colors group"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-current text-on-surface-variant group-hover:text-primary transition-colors"
            >
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
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
  return <Footer />
}
