import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Create a dummy organizer
  const user = await prisma.user.upsert({
    where: { email: 'admin@openpass.local' },
    update: {},
    create: {
      email: 'admin@openpass.local',
      name: 'Local Admin',
      role: 'ADMIN',
    },
  })

  // 2. Create geographically diverse demo events
  const events = [
    {
      title: 'OpenPass Contributor Hackathon',
      slug: 'test-event-2026',
      description:
        'Hack on the OpenPass codebase with core contributors. Build features, squash bugs, and ship together.',
      venue: 'San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      category: 'Technology',
      tags: ['hackathon', 'open-source', 'contributors'],
      startAt: new Date(Date.now() - 3600000), // Started 1 hour ago (LIVE)
      endAt: new Date(Date.now() + 86400000),
    },
    {
      title: 'Kubernetes Berlin Meetup',
      slug: 'k8s-berlin-2026',
      description:
        'Monthly Kubernetes meetup in Berlin. Lightning talks, live demos, and networking with the cloud-native community.',
      venue: 'Berlin, DE',
      latitude: 52.52,
      longitude: 13.405,
      category: 'Technology',
      tags: ['kubernetes', 'cloud-native', 'meetup'],
      startAt: new Date(Date.now() + 86400000 * 3),
      endAt: new Date(Date.now() + 86400000 * 3 + 10800000),
    },
    {
      title: 'Rust WebAssembly Workshop',
      slug: 'rust-wasm-london-2026',
      description:
        'Hands-on workshop building high-performance web apps with Rust and WebAssembly. All skill levels welcome.',
      venue: 'London, UK',
      latitude: 51.5074,
      longitude: -0.1278,
      category: 'Workshop',
      tags: ['rust', 'webassembly', 'workshop'],
      startAt: new Date(Date.now() + 86400000 * 7),
      endAt: new Date(Date.now() + 86400000 * 7 + 14400000),
    },
    {
      title: 'Open Source Beats: Algorave',
      slug: 'algorave-tokyo-2026',
      description:
        'Live-coded music performance using open-source tools. Experience the intersection of code and creativity.',
      venue: 'Tokyo, JP',
      latitude: 35.6762,
      longitude: 139.6503,
      category: 'Music',
      tags: ['algorave', 'music', 'live-coding'],
      startAt: new Date(Date.now() + 86400000 * 5),
      endAt: new Date(Date.now() + 86400000 * 5 + 18000000),
    },
    {
      title: 'DeFi Protocol Architecture Deep-Dive',
      slug: 'defi-sao-paulo-2026',
      description:
        'Technical deep-dive into decentralized finance protocol architecture. Smart contracts, security, and scalability.',
      venue: 'São Paulo, BR',
      latitude: -23.5505,
      longitude: -46.6333,
      category: 'Technology',
      tags: ['defi', 'blockchain', 'architecture'],
      startAt: new Date(Date.now() + 86400000 * 14),
      endAt: new Date(Date.now() + 86400000 * 14 + 28800000),
    },
    {
      title: 'Cloud Native Africa Summit',
      slug: 'cloud-native-nairobi-2026',
      description:
        'The largest cloud-native conference in Africa. Keynotes, workshops, and hands-on labs with CNCF projects.',
      venue: 'Nairobi, KE',
      latitude: -1.2921,
      longitude: 36.8219,
      category: 'Technology',
      tags: ['cloud-native', 'africa', 'summit'],
      startAt: new Date(Date.now() + 86400000 * 21),
      endAt: new Date(Date.now() + 86400000 * 23),
    },
  ]

  for (const event of events) {
    await prisma.event.upsert({
      where: { slug: event.slug },
      update: {},
      create: {
        ...event,
        organiserId: user.id,
        isPublished: true,
      },
    })
  }

  console.log(`✅ Database seeded with ${events.length} events!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
