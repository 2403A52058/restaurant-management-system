// KodiKart — Database Seed Script
// Idempotent: safe to run multiple times (upsert everywhere)
// Seeds: admin user, platform settings, 10 native breeds,
//        1 demo farm owner, 1 demo customer

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

async function main() {
  console.log('🌱 Starting KodiKart database seeding…');
  console.log('');

  // ──────────────────────────────────────────────────────────
  // 1. Admin User
  // ──────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { phone: '9000000000' },
    update: {
      email: 'admin@kodikart.in',
      name: 'KodiKart Admin',
      role: 'ADMIN',
    },
    create: {
      phone: '9000000000',
      email: 'admin@kodikart.in',
      name: 'KodiKart Admin',
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin user seeded (id=${admin.id}, phone=${admin.phone})`);

  // ──────────────────────────────────────────────────────────
  // 2. Demo Farm Owner
  // ──────────────────────────────────────────────────────────
  const demoFarmOwner = await prisma.user.upsert({
    where: { phone: '9000000001' },
    update: {
      email: 'demo@farm.kodikart.in',
      name: 'Raju Naidu',
      role: 'FARM_OWNER',
    },
    create: {
      phone: '9000000001',
      email: 'demo@farm.kodikart.in',
      name: 'Raju Naidu',
      role: 'FARM_OWNER',
    },
  });
  console.log(`✅ Demo farm owner seeded (id=${demoFarmOwner.id}, phone=${demoFarmOwner.phone})`);

  // ──────────────────────────────────────────────────────────
  // 3. Demo Customer
  // ──────────────────────────────────────────────────────────
  const demoCustomer = await prisma.user.upsert({
    where: { phone: '9000000002' },
    update: {
      email: 'demo@customer.kodikart.in',
      name: 'Priya Reddy',
      role: 'CUSTOMER',
    },
    create: {
      phone: '9000000002',
      email: 'demo@customer.kodikart.in',
      name: 'Priya Reddy',
      role: 'CUSTOMER',
    },
  });
  console.log(`✅ Demo customer seeded (id=${demoCustomer.id}, phone=${demoCustomer.phone})`);

  // ──────────────────────────────────────────────────────────
  // 4. Platform Settings
  // ──────────────────────────────────────────────────────────
  const settings = [
    {
      key: 'platform_commission_rate',
      value: '0.03',
      description: 'Platform commission rate as a decimal (0.03 = 3%). Applied to new bookings only.',
    },
    {
      key: 'delivery_base_fee',
      value: '50',
      description: 'Base delivery fee in INR charged per delivery booking.',
    },
    {
      key: 'delivery_per_km_rate',
      value: '10',
      description: 'Additional per-kilometre delivery charge in INR.',
    },
    {
      key: 'delivery_free_radius_km',
      value: '0',
      description: 'Free delivery radius in kilometres (0 = disabled; every delivery is charged).',
    },
    {
      key: 'delivery_max_distance_km',
      value: '50',
      description: 'Maximum delivery distance allowed in kilometres.',
    },
    {
      key: 'max_hen_weight_kg',
      value: '2.5',
      description: 'Strict maximum weight (kg) per native female hen in inventory.',
    },
    {
      key: 'app_name',
      value: 'KodiKart',
      description: 'Application brand name.',
    },
    {
      key: 'app_tagline_en',
      value: 'Live Native Hens. Direct from Farms.',
      description: 'English-language marketing tagline.',
    },
    {
      key: 'app_tagline_te',
      value: 'మన నాటి కోళ్లు — మన నమ్మకం',
      description: 'Telugu-language marketing tagline.',
    },
  ];

  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }
  console.log(`✅ ${settings.length} platform settings seeded`);

  // ──────────────────────────────────────────────────────────
  // 5. Standard Native Hen Breeds (10 breeds)
  // ──────────────────────────────────────────────────────────
  const breeds = [
    {
      name: 'Kadaknath',
      teluguName: 'కడకనాథ్',
      description: 'Famous melanotic pure native breed with distinctive black plumage, iron-rich dark meat and high medicinal value. Sought after across Telangana and Andhra Pradesh.',
      isStandard: true,
    },
    {
      name: 'Aseel',
      teluguName: 'అసీల్',
      description: 'Legendary native warrior breed of Telangana and Coastal Andhra. Renowned for majestic carriage, natural immunity, lean muscle and authentic desi flavour.',
      isStandard: true,
    },
    {
      name: 'Natti Kodi',
      teluguName: 'నాటి కోడి',
      description: 'Generic term for traditional village country hen. Hardy, free-range forager with rich flavour prized in rural Telugu households.',
      isStandard: true,
    },
    {
      name: 'Giriraja',
      teluguName: 'గిరిరాజ',
      description: 'Government-developed dual-purpose native-cross breed ideal for backyard and rural poultry. Excellent adaptability and disease resistance.',
      isStandard: true,
    },
    {
      name: 'Gramapriya',
      teluguName: 'గ్రామప్రియ',
      description: 'ICAR-developed layer-type native breed suited for village conditions. Good egg production with flavoursome meat.',
      isStandard: true,
    },
    {
      name: 'Vanaraja',
      teluguName: 'వనరాజ',
      description: 'Free-range native-cross breed developed by ICAR for tribal and rural areas. Thrives in forest and semi-forest environments.',
      isStandard: true,
    },
    {
      name: 'Chittagong',
      teluguName: 'చిట్టగాంగ్',
      description: 'Tall, long-legged heritage breed originating from Bangladesh. Prized for high-quality lean meat and commanding stature.',
      isStandard: true,
    },
    {
      name: 'Naked Neck',
      teluguName: 'నేకెడ్ నెక్',
      description: 'Heat-tolerant native breed with featherless neck. Naturally adapts to tropical climates; popular in Andhra and Telangana for robust health.',
      isStandard: true,
    },
    {
      name: 'Frizzle',
      teluguName: 'ఫ్రిజిల్',
      description: 'Distinctive curled-feather native breed known for excellent adaptability. Valued for tender meat and ornamental appeal.',
      isStandard: true,
    },
    {
      name: 'Desi Kodi',
      teluguName: 'దేశి కోడి',
      description: 'Pure indigenous desi hen breed of Andhra and Telangana. Naturally raised on grains and open pasture; full-bodied traditional flavour.',
      isStandard: true,
    },
  ];

  const breedRecords = [];
  for (const b of breeds) {
    const record = await prisma.breed.upsert({
      where: { name: b.name },
      update: {
        teluguName: b.teluguName,
        description: b.description,
        isStandard: b.isStandard,
      },
      create: b,
    });
    breedRecords.push(record);
  }
  console.log(`✅ ${breedRecords.length} native hen breeds seeded`);

  // ──────────────────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────────────────
  console.log('');
  console.log('🎉 KodiKart database seeded successfully!');
  console.log('');
  console.log('  Demo credentials (OTP auth — no password):');
  console.log('  Admin       : phone=9000000000  email=admin@kodikart.in');
  console.log('  Farm Owner  : phone=9000000001  email=demo@farm.kodikart.in');
  console.log('  Customer    : phone=9000000002  email=demo@customer.kodikart.in');
  console.log('');
}

main()
  .catch((err) => {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
