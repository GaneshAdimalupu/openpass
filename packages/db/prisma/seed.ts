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

  // 2. Create a dummy event
  await prisma.event.upsert({
    where: { slug: 'test-event-2026' },
    update: {},
    create: {
      title: 'OpenPass Contributor Hackathon',
      slug: 'test-event-2026',
      description: 'A test event for local development.',
      startAt: new Date(Date.now() + 86400000), // Tomorrow
      endAt: new Date(Date.now() + 172800000),
      category: 'Technology',
      organiserId: user.id,
      isPublished: true,
    },
  })

  console.log('✅ Database seeded!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
