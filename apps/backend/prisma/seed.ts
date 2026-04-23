import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const VILLAGES = [
  'Sunrise Village',
  'Meadow Village',
  'Forest Village',
  'Lakeside Village',
  'Hilltop Village',
  'River Village',
  'Valley Village',
  'Coastal Village',
  'Garden Village',
  'Summit Village',
];

const EVENTS_PER_VILLAGE = [
  { name: 'Morning Workshop', description: 'Interactive morning workshop session' },
  { name: 'Cultural Show', description: 'Traditional cultural performances' },
  { name: 'Sports Tournament', description: 'Friendly team sports competition' },
  { name: 'Art Exhibition', description: 'Local art and craft exhibition' },
];

const DEFAULT_TIME_SLOTS = ['09:00', '13:00'];

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  });
  console.log('✅ Admin user created (username: admin, password: admin123)');

  // Create villages with events and time slots
  for (const villageName of VILLAGES) {
    const village = await prisma.village.upsert({
      where: { name: villageName },
      update: {},
      create: { name: villageName },
    });

    for (const eventData of EVENTS_PER_VILLAGE) {
      const event = await prisma.event.upsert({
        where: { name_villageId: { name: eventData.name, villageId: village.id } },
        update: {},
        create: {
          name: eventData.name,
          description: eventData.description,
          villageId: village.id,
        },
      });

      for (const time of DEFAULT_TIME_SLOTS) {
        await prisma.timeSlot.upsert({
          where: { eventId_time: { eventId: event.id, time } },
          update: {},
          create: {
            time,
            eventId: event.id,
          },
        });
      }
    }

    console.log(`✅ Village "${villageName}" seeded with ${EVENTS_PER_VILLAGE.length} events`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
