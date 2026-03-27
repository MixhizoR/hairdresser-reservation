/**
 * Seed script — creates the initial admin, barber users, services, and settings.
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

const SERVICES = [
  { name: 'Saç Kesimi', description: 'Profesyonel saç kesimi ve şekillendirme.', price: 250, duration: 45, category: 'BARBERING' },
  { name: 'Sakal Kesimi', description: 'Uzman sakal şekillendirme ve bakım.', price: 150, duration: 30, category: 'GROOMING' },
  { name: 'Saç & Sakal Kesimi', description: 'Saç ve sakal kesimi kombinasyonu.', price: 350, duration: 60, category: 'BARBERING' },
  { name: 'Çocuk Tıraşı', description: '12 yaş altı çocuklar için kesim.', price: 180, duration: 30, category: 'BARBERING' },
  { name: 'Cilt Bakımı', description: 'Yüz temizliği ve cilt bakımı.', price: 300, duration: 45, category: 'TREATMENTS' },
  { name: 'Kaş Alımı', description: 'Profesyonel kaş şekillendirme.', price: 100, duration: 15, category: 'GROOMING' },
  { name: 'Fön', description: 'Saç yıkama ve fön çekimi.', price: 120, duration: 30, category: 'BARBERING' },
  { name: 'Ağda', description: 'Yüz bölgesi ağda hizmeti.', price: 80, duration: 15, category: 'GROOMING' },
  { name: 'Damat Tıraşı', description: 'Özel gün için komple bakım.', price: 500, duration: 90, category: 'TREATMENTS' },
  { name: 'Ev Tıraşı', description: 'Adrese hizmet saç kesimi.', price: 400, duration: 60, category: 'BARBERING' },
];

const DEFAULT_SETTINGS = [
  { key: 'salonName', value: 'HairMan Studio' },
  { key: 'salonDescription', value: 'Premium kuaför deneyimi. Modern kesim klasik ustalıkla buluşuyor.' },
  { key: 'contactPhone', value: '0532 000 0000' },
  { key: 'contactEmail', value: 'info@hairstudio.com' },
  { key: 'contactLocation', value: 'İstanbul, Türkiye' },
  { key: 'operatingHours', value: JSON.stringify({
    monday: { open: '09:00', close: '20:00', closed: false },
    tuesday: { open: '09:00', close: '20:00', closed: false },
    wednesday: { open: '09:00', close: '20:00', closed: false },
    thursday: { open: '09:00', close: '20:00', closed: false },
    friday: { open: '09:00', close: '21:00', closed: false },
    saturday: { open: '10:00', close: '19:00', closed: false },
    sunday: { open: '10:00', close: '18:00', closed: false },
  })},
  { key: 'soundEnabled', value: 'true' },
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

  // Create services
  for (const svc of SERVICES) {
    const existing = await prisma.service.findFirst({ where: { name: svc.name } });
    if (!existing) {
      await prisma.service.create({ data: svc });
      console.log(`✅ Service created: ${svc.name} (₺${svc.price})`);
    } else {
      console.log(`⏭️  Service exists: ${svc.name}`);
    }
  }

  // Create settings
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
    console.log(`✅ Setting: ${setting.key}`);
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log(`   Admin: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
  console.log(`   Barbers: berber1, berber2, berber3 / ${ADMIN_PASSWORD}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
