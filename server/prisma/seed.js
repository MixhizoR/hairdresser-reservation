/**
 * Seed script — creates the initial admin user.
 * Run with: node prisma/seed.js
 * 
 * Change USERNAME and PASSWORD before running!
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const USERNAME = 'admin';
const PASSWORD = 'noir2026'; // CHANGE THIS

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 12);

  const admin = await prisma.admin.upsert({
    where: { username: USERNAME },
    update: {},
    create: {
      username: USERNAME,
      password: hash,
    },
  });

  console.log(`✅ Admin user created/verified: ${admin.username}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
