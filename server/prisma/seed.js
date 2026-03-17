/**
 * Seed script — creates the initial admin and barber users.
 * Run with: node prisma/seed.js
 * 
 * Default credentials:
 * - Admin: admin / noir2026
 * - Barber: berber1 / noir2026
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'noir2026';

const BARBERS = [
  { username: 'berber1', name: 'Ahmet', phone: '0532 111 1111' },
  { username: 'berber2', name: 'Mehmet', phone: '0532 222 2222' },
  { username: 'berber3', name: 'Ayşe', phone: '0532 333 3333' },
];

async function main() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: {},
    create: {
      username: ADMIN_USERNAME,
      password: hash,
      role: 'ADMIN',
      name: 'Sistem Yöneticisi',
      isActive: true,
    },
  });
  console.log(`✅ Admin created: ${admin.username} (${admin.role})`);

  // Create barber users
  for (const barberData of BARBERS) {
    const barberHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const barber = await prisma.user.upsert({
      where: { username: barberData.username },
      update: {},
      create: {
        username: barberData.username,
        password: barberHash,
        role: 'BARBER',
        name: barberData.name,
        phone: barberData.phone,
        isActive: true,
      },
    });
    console.log(`✅ Barber created: ${barber.name} (@${barber.username})`);
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log(`   Admin: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
  console.log(`   Barbers: berber1, berber2, berber3 / ${ADMIN_PASSWORD}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
