const features = [
  {
    id: 'managing',
    colSpan: 'md:col-span-8',
    size: 'large',
    icon: 'insights',
    iconFill: true,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/20',
    title: 'Managing System',
    description:
      'Custom dashboard with real-time telemetry and deep audience insights at a glance.',
  },
  {
    id: 'ticketing',
    colSpan: 'md:col-span-4',
    size: 'tall',
    icon: 'confirmation_number',
    iconFill: true,
    iconColor: 'text-tertiary',
    iconBg: 'bg-tertiary/20',
    title: 'Dynamic Ticketing',
    description: 'QR-coded tickets generated instantly. Secure, verifiable, and purely digital.',
    showBar: true,
    barLabel: 'Security',
    barValue: '98%',
    barWidth: 'w-3/4',
    barColor: 'bg-tertiary',
  },
  {
    id: 'entry',
    colSpan: 'md:col-span-4',
    size: 'small',
    icon: 'qr_code_scanner',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/20',
    title: 'Rapid Entry',
    description: 'Camera-based QR scanning that eliminates friction at the door.',
    bg: 'bg-surface-container-low',
    hover: true,
  },
  {
    id: 'scaling',
    colSpan: 'md:col-span-4',
    size: 'small',
    icon: 'campaign',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'Viral Scaling',
    description: 'Share links and social integrations that amplify your event reach.',
    bg: 'bg-[#1a1919]',
    hover: true,
    watermark: true,
  },
  {
    id: 'support',
    colSpan: 'md:col-span-4',
    size: 'small',
    icon: 'support',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/20',
    title: 'Community Support',
    description: 'FOSS-backed community support with an active contributor ecosystem.',
    bg: 'bg-gradient-to-br from-primary/10 to-transparent border border-primary/20',
    hover: true,
  },
]

function LargeCard({ feature }: { feature: (typeof features)[0] }) {
  return (
    <div
      className={`${feature.colSpan} group relative overflow-hidden rounded-[2rem] bg-surface-container-low min-h-[400px] flex flex-col justify-end p-10`}
    >
      {/* Background illustration placeholder */}
      <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity">
        <div className="w-full h-full bg-gradient-to-br from-primary/10 via-surface-container to-surface-container-high" />
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(133,173,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(133,173,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
      <div className="relative z-10 space-y-4">
        <div
          className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center ${feature.iconColor}`}
        >
          <span
            className="material-symbols-outlined"
            style={feature.iconFill ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {feature.icon}
          </span>
        </div>
        <h3 className="text-3xl font-bold font-headline text-white">{feature.title}</h3>
        <p className="text-on-surface-variant max-w-md">{feature.description}</p>
      </div>
    </div>
  )
}

function TallCard({ feature }: { feature: (typeof features)[0] }) {
  return (
    <div
      className={`${feature.colSpan} rounded-[2rem] bg-surface-container-high p-8 flex flex-col justify-between border border-white/5`}
    >
      <div className="space-y-6">
        <div
          className={`w-14 h-14 rounded-2xl ${feature.iconBg} flex items-center justify-center ${feature.iconColor}`}
        >
          <span
            className="material-symbols-outlined"
            style={feature.iconFill ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {feature.icon}
          </span>
        </div>
        <h3 className="text-2xl font-bold font-headline text-white">{feature.title}</h3>
        <p className="text-on-surface-variant text-sm leading-relaxed">{feature.description}</p>
      </div>
      {feature.showBar && (
        <div className="pt-8">
          <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div className={`h-full ${feature.barColor} ${feature.barWidth}`} />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
            <span>{feature.barLabel}</span>
            <span>{feature.barValue}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function SmallCard({ feature }: { feature: (typeof features)[0] }) {
  return (
    <div
      className={`${feature.colSpan} rounded-[2rem] ${feature.bg} p-8 space-y-6 ${
        feature.hover ? 'hover:-translate-y-2 transition-transform duration-300' : ''
      } relative overflow-hidden`}
    >
      {feature.watermark && (
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <span className="material-symbols-outlined text-9xl">{feature.icon}</span>
        </div>
      )}
      <div
        className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center ${feature.iconColor}`}
      >
        <span className="material-symbols-outlined">{feature.icon}</span>
      </div>
      <h4 className="text-xl font-bold font-headline text-white">{feature.title}</h4>
      <p className="text-on-surface-variant text-sm">{feature.description}</p>
    </div>
  )
}

export function FeaturesSection() {
  const large = features.find((f) => f.size === 'large')!
  const tall = features.find((f) => f.size === 'tall')!
  const small = features.filter((f) => f.size === 'small')

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="mb-16 space-y-4">
        <h2 className="text-4xl md:text-5xl font-black font-headline tracking-tight text-white">
          System Architecture
        </h2>
        <p className="text-on-surface-variant max-w-2xl text-lg">
          Integrated tools designed to power any event — from FOSS meetups to large-scale
          conferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <LargeCard feature={large} />
        <TallCard feature={tall} />
        {small.map((f) => (
          <SmallCard key={f.id} feature={f} />
        ))}
      </div>
    </section>
  )
}
