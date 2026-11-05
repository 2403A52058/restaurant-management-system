const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive Telangana & Hyderabadi database seeding...');

  // Clean existing data in reverse dependency order
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.ingredient.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.restaurantTable.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.restaurantSetting.deleteMany({});

  console.log('🧹 Existing data wiped.');

  // 1. Roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'General Manager & System Administrator',
      permissions: JSON.stringify(['all']),
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: 'MANAGER',
      description: 'Floor & Operations Manager',
      permissions: JSON.stringify(['dashboard', 'menu', 'tables', 'reservations', 'orders', 'billing', 'customers', 'employees', 'inventory', 'reports']),
    },
  });

  const chefRole = await prisma.role.create({
    data: {
      name: 'CHEF',
      description: 'Bawarchi / Head Chef & Kitchen Crew',
      permissions: JSON.stringify(['kitchen', 'menu_view', 'inventory']),
    },
  });

  const waiterRole = await prisma.role.create({
    data: {
      name: 'WAITER',
      description: 'Captains & Floor Service Staff',
      permissions: JSON.stringify(['orders', 'tables', 'reservations']),
    },
  });

  const cashierRole = await prisma.role.create({
    data: {
      name: 'CASHIER',
      description: 'Cashier & POS Billing Desk',
      permissions: JSON.stringify(['billing', 'orders_view', 'customers']),
    },
  });

  console.log('✅ Roles created');

  // Password hashes
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const managerHash = await bcrypt.hash('manager123', salt);
  const chefHash = await bcrypt.hash('chef123', salt);
  const waiterHash = await bcrypt.hash('waiter123', salt);
  const cashierHash = await bcrypt.hash('cashier123', salt);

  // 2. Users & 3. Employees
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@telanganaruchulu.com',
      passwordHash: adminHash,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      username: 'manager_srinivas',
      email: 'srinivas.rao@telanganaruchulu.com',
      passwordHash: managerHash,
      roleId: managerRole.id,
      isActive: true,
    },
  });

  const chefUser = await prisma.user.create({
    data: {
      username: 'chef_mallesh',
      email: 'ustad.mallesh@telanganaruchulu.com',
      passwordHash: chefHash,
      roleId: chefRole.id,
      isActive: true,
    },
  });

  const waiterUser = await prisma.user.create({
    data: {
      username: 'waiter_shiva',
      email: 'shiva.kumar@telanganaruchulu.com',
      passwordHash: waiterHash,
      roleId: waiterRole.id,
      isActive: true,
    },
  });

  const cashierUser = await prisma.user.create({
    data: {
      username: 'cashier_ramya',
      email: 'ramya.reddy@telanganaruchulu.com',
      passwordHash: cashierHash,
      roleId: cashierRole.id,
      isActive: true,
    },
  });

  const emp1 = await prisma.employee.create({
    data: {
      userId: adminUser.id,
      roleId: adminRole.id,
      firstName: 'Koushik',
      lastName: 'Reddy',
      email: 'admin@telanganaruchulu.com',
      phone: '+91 98480 22338',
      salary: 75000.00,
      hireDate: new Date('2022-01-10'),
      status: 'ACTIVE',
    },
  });

  const emp2 = await prisma.employee.create({
    data: {
      userId: managerUser.id,
      roleId: managerRole.id,
      firstName: 'Srinivas',
      lastName: 'Rao',
      email: 'srinivas.rao@telanganaruchulu.com',
      phone: '+91 99890 44551',
      salary: 50000.00,
      hireDate: new Date('2022-05-15'),
      status: 'ACTIVE',
    },
  });

  const emp3 = await prisma.employee.create({
    data: {
      userId: chefUser.id,
      roleId: chefRole.id,
      firstName: 'Mallesh',
      lastName: 'Goud (Ustad)',
      email: 'ustad.mallesh@telanganaruchulu.com',
      phone: '+91 94401 77882',
      salary: 55000.00,
      hireDate: new Date('2022-03-01'),
      status: 'ACTIVE',
    },
  });

  const emp4 = await prisma.employee.create({
    data: {
      userId: waiterUser.id,
      roleId: waiterRole.id,
      firstName: 'Shiva',
      lastName: 'Kumar',
      email: 'shiva.kumar@telanganaruchulu.com',
      phone: '+91 97000 88991',
      salary: 28000.00,
      hireDate: new Date('2023-01-15'),
      status: 'ACTIVE',
    },
  });

  const emp5 = await prisma.employee.create({
    data: {
      userId: cashierUser.id,
      roleId: cashierRole.id,
      firstName: 'Ramya',
      lastName: 'Reddy',
      email: 'ramya.reddy@telanganaruchulu.com',
      phone: '+91 91210 33445',
      salary: 32000.00,
      hireDate: new Date('2023-04-10'),
      status: 'ACTIVE',
    },
  });

  console.log('✅ Users & Employees created');

  // 4. Categories (Telangana & Hyderabadi Cuisines)
  const catStarters = await prisma.category.create({
    data: {
      name: 'Telangana Appetizers (ప్రారంభం / స్టార్టర్స్)',
      description: 'Fiery village-style fries, Sarva Pindi, crunchy Sakinalu and chicken bites',
      imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
    },
  });

  const catBiryanis = await prisma.category.create({
    data: {
      name: 'Royal Biryanis & Pulaos (దమ్ బిర్యానీలు & బగారా అన్నం)',
      description: 'Authentic Hyderabadi Dum Biryanis, Gongura Mutton, Natu Kodi & Bagara Rice',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    },
  });

  const catCurries = await prisma.category.create({
    data: {
      name: 'Traditional Curries & Gravies (తెలంగాణ కూరలు & పులుసులు)',
      description: 'Slow-simmered spicy gravies, Natu Kodi Pulusu, Golichina Mamsam & Gutti Vankaya',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    },
  });

  const catBreads = await prisma.category.create({
    data: {
      name: 'Rustic Rottelu & Breads (రొట్టెలు & నాన్స్)',
      description: 'Jowar Jonna Rotte, Sajja Rotte, Rumali Roti and Butter Naans',
      imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80',
    },
  });

  const catDesserts = await prisma.category.create({
    data: {
      name: 'Hyderabadi Shahi Desserts (మిఠాయిలు)',
      description: 'Double Ka Meetha, Qubani Ka Meetha with Malai, Ghee Bobbatlu and Payasam',
      imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    },
  });

  const catBeverages = await prisma.category.create({
    data: {
      name: 'Irani Chai & Traditional Beverages (ఇరానీ చాయ్ & పానీయాలు)',
      description: 'Kadak Irani Chai with Osmania Biscuits, Spiced Majjiga, Nannari Sharbat',
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    },
  });

  console.log('✅ Categories created');

  // 5. 30 Authentic Telangana & Hyderabadi Menu Items
  const telanganaItems = [
    // --- Appetizers & Starters (6 items) ---
    {
      categoryId: catStarters.id,
      name: 'Telangana Sarva Pindi (సర్వ పిండి)',
      description: 'Traditional Telangana spiced rice-flour savory pancake studded with chana dal, peanuts, sesame seeds, curry leaves, and green chillies, roasted crisp in an iron pan.',
      price: 180.00,
      costPrice: 50.00,
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 15,
      isVeg: true,
    },
    {
      categoryId: catStarters.id,
      name: 'Telangana Kodi Vepudu (కోడి వేపుడు)',
      description: 'Tender chicken morsels pan-fried with roasted Guntur red chillies, shallots, crushed peppercorns, fresh ginger-garlic paste and crispy curry leaves.',
      price: 340.00,
      costPrice: 130.00,
      imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 20,
      isVeg: false,
    },
    {
      categoryId: catStarters.id,
      name: 'Golichina Mamsam (గోలిచిన మాంసం)',
      description: 'Telangana rustic country mutton chunks dry roasted over cast iron with caramelized shallots, stone-ground garam masala, and fragrant garlic pods.',
      price: 440.00,
      costPrice: 190.00,
      imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 25,
      isVeg: false,
    },
    {
      categoryId: catStarters.id,
      name: 'Crispy Telangana Sakinalu Platter (సకినాలు)',
      description: 'Handcrafted crunchy spiral sesame rice fritters fried in cold-pressed groundnut oil, served with tangy spicy tomato roasted chutney.',
      price: 160.00,
      costPrice: 40.00,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 10,
      isVeg: true,
    },
    {
      categoryId: catStarters.id,
      name: 'Hyderabadi Chicken 65 (స్పైసీ చికెన్ 65)',
      description: 'The legendary spicy, deep-red chicken cubes tossed with fiery Bhavnagri chillies, curd, mustard seeds, and fried curry leaves.',
      price: 320.00,
      costPrice: 120.00,
      imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 15,
      isVeg: false,
    },
    {
      categoryId: catStarters.id,
      name: 'Mirchi Bajji with Stuffed Ajwain Onion (మిర్చి బజ్జీ)',
      description: 'Large Bhavnagri chillies dipped in spiced chickpea batter, fried golden, slit open and stuffed with lemon-coriander spiced onions.',
      price: 140.00,
      costPrice: 35.00,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 12,
      isVeg: true,
    },

    // --- Biryanis & Pulaos (8 items) ---
    {
      categoryId: catBiryanis.id,
      name: 'Hyderabadi Zafrani Mutton Dum Biryani (జాఫ్రానీ మటన్ దమ్ బిర్యానీ)',
      description: 'Royal Kachhi Dum Biryani: tender baby goat marinated overnight in shahi spices & yogurt, layered with aged basmati, infused with pure Kashmiri saffron and desi ghee.',
      price: 480.00,
      costPrice: 210.00,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 25,
      isVeg: false,
    },
    {
      categoryId: catBiryanis.id,
      name: 'Special Hyderabadi Chicken Dum Biryani (స్పెషల్ చికెన్ దమ్ బిర్యానీ)',
      description: 'Iconic slow-cooked dum biryani with succulent chicken thighs, fried onions (birista), fresh mint, cardamom and long-grain aged basmati rice. Served with Mirchi Ka Salan and Raitha.',
      price: 380.00,
      costPrice: 140.00,
      imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 20,
      isVeg: false,
    },
    {
      categoryId: catBiryanis.id,
      name: 'Gongura Mutton Biryani (గోంగూర మటన్ బిర్యానీ)',
      description: 'Fiery Telangana specialty: spicy boneless mutton slow-cooked with fresh sour red-stem roselle (Gongura) leaves, blended with fragrant basmati dum rice.',
      price: 490.00,
      costPrice: 220.00,
      imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 25,
      isVeg: false,
    },
    {
      categoryId: catBiryanis.id,
      name: 'Telangana Natu Kodi Biryani (నాటుకోడి బిర్యానీ)',
      description: 'Authentic free-range country chicken cooked in cold-pressed oil with stone-ground rustic masala and fragrant seeraga samba / basmati rice.',
      price: 420.00,
      costPrice: 170.00,
      imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 25,
      isVeg: false,
    },
    {
      categoryId: catBiryanis.id,
      name: 'Ulavacharu Chicken Dum Biryani (ఉలవచారు చికెన్ బిర్యానీ)',
      description: 'Delectable Andhra & Telangana fusion: basmati biryani laced with thick slow-cooked horsegram soup (ulavacharu) and rich homemade cream.',
      price: 410.00,
      costPrice: 155.00,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 20,
      isVeg: false,
    },
    {
      categoryId: catBiryanis.id,
      name: 'Telangana Bagara Rice with Dalcha (బగారా అన్నం & దాల్చా)',
      description: 'Festive aromatic basmati rice tempered with whole spices (shahjeera, cloves, cardamom, bay leaf, mint) served with rich Hyderabadi bottle gourd mutton/chana dalcha.',
      price: 260.00,
      costPrice: 80.00,
      imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 15,
      isVeg: true,
    },
    {
      categoryId: catBiryanis.id,
      name: 'Hyderabadi Shahi Veg Dum Biryani (షాహీ వెజ్ దమ్ బిర్యానీ)',
      description: 'Rich vegetarian feast layered with cauliflower, baby potatoes, green peas, carrots, paneer cubes, saffron milk and roasted cashews.',
      price: 290.00,
      costPrice: 90.00,
      imageUrl: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 18,
      isVeg: true,
    },
    {
      categoryId: catBiryanis.id,
      name: 'Kaju Paneer Pulao (కాజు పనీర్ పులావ్)',
      description: 'Fragrant basmati cooked with golden fried cashews, malai paneer cubes, ghee, fried brown onions, and aromatic mint leaves.',
      price: 310.00,
      costPrice: 110.00,
      imageUrl: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 18,
      isVeg: true,
    },

    // --- Curries & Gravies (8 items) ---
    {
      categoryId: catCurries.id,
      name: 'Natu Kodi Pulusu (నాటుకోడి పులుసు)',
      description: 'Iconic spicy country chicken gravy simmered with shallots, crushed dry coconut, poppy seeds (gasagasalu), coriander roots, and tangy tamarind.',
      price: 420.00,
      costPrice: 180.00,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 25,
      isVeg: false,
    },
    {
      categoryId: catCurries.id,
      name: 'Telangana Gongura Mamsam (గోంగూర మాంసం)',
      description: 'Tender mutton cooked with sour roselle greens, green chillies, garlic, and fresh cumin-coriander powder in rustic Telangana village style.',
      price: 460.00,
      costPrice: 200.00,
      imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 25,
      isVeg: false,
    },
    {
      categoryId: catCurries.id,
      name: 'Telangana Kodi Kura (తెలంగాణ కోడి కూర)',
      description: 'Homestyle chicken curry bursting with flavor from roasted coriander, dry coconut, cinnamon, and fiery red chili powder.',
      price: 360.00,
      costPrice: 130.00,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 20,
      isVeg: false,
    },
    {
      categoryId: catCurries.id,
      name: 'Telangana Boti Fry / Kura (బోటీ ఫ్రై)',
      description: 'Authentic lamb tripe delicately cleaned and stir-fried with onions, crushed peppercorns, green chillies and fresh mint.',
      price: 380.00,
      costPrice: 140.00,
      imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 22,
      isVeg: false,
    },
    {
      categoryId: catCurries.id,
      name: 'Royyala Iguru (రొయ్యల ఇగురు)',
      description: 'Fresh Bay of Bengal prawns cooked into a thick, spicy onion-tomato masala with curry leaves and a touch of roasted garam masala.',
      price: 440.00,
      costPrice: 190.00,
      imageUrl: 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 20,
      isVeg: false,
    },
    {
      categoryId: catCurries.id,
      name: 'Chepala Pulusu (చేపల పులుసు)',
      description: 'Tangy and spicy freshwater Korameenu (Murrel fish) simmered in fenugreek-infused tamarind sauce with country raw mango slices.',
      price: 390.00,
      costPrice: 160.00,
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 22,
      isVeg: false,
    },
    {
      categoryId: catCurries.id,
      name: 'Gutti Vankaya Kura (గుత్తి వంకాయ కూర)',
      description: 'Small purple brinjals slit four-ways and stuffed with a rich roasted peanut, sesame, dry coconut, and coriander seed paste cooked in gravy.',
      price: 240.00,
      costPrice: 70.00,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 18,
      isVeg: true,
    },
    {
      categoryId: catCurries.id,
      name: 'Telangana Pachi Pulusu (పచ్చి పులుసు)',
      description: 'Authentic raw tamarind stew seasoned with fire-roasted green chillies, diced raw onions, jaggery, fresh coriander and mustard tempering.',
      price: 130.00,
      costPrice: 30.00,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 10,
      isVeg: true,
    },

    // --- Rustic Rottelu & Breads (4 items) ---
    {
      categoryId: catBreads.id,
      name: 'Telangana Jonna Rotte (జొన్న రొట్టె - 2 Pcs)',
      description: 'Traditional gluten-free flatbread made from freshly ground white sorghum (jowar) flour, hand-patted and flame-roasted.',
      price: 70.00,
      costPrice: 18.00,
      imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 10,
      isVeg: true,
    },
    {
      categoryId: catBreads.id,
      name: 'Hyderabadi Rumali Roti (రుమాలి రోటీ)',
      description: 'Paper-thin, handkerchief-soft bread spun in the air and baked on an inverted cast-iron kadai.',
      price: 45.00,
      costPrice: 12.00,
      imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 8,
      isVeg: true,
    },
    {
      categoryId: catBreads.id,
      name: 'Butter Garlic Naan (బటర్ గార్లిక్ నాన్)',
      description: 'Tandoor-baked leavened flatbread brushed with garlic butter and fresh cilantro.',
      price: 65.00,
      costPrice: 16.00,
      imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 8,
      isVeg: true,
    },
    {
      categoryId: catBreads.id,
      name: 'Classic Hyderabadi Mirchi Ka Salan (మిర్చి కా సాలన్)',
      description: 'Traditional rich gravy cooked with roasted peanuts, sesame seeds, tamarind and charred green chillies. The perfect pairing for Biryani.',
      price: 150.00,
      costPrice: 40.00,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 12,
      isVeg: true,
    },

    // --- Shahi Desserts & Sweets (5 items) ---
    {
      categoryId: catDesserts.id,
      name: 'Hyderabadi Double Ka Meetha (డబల్ కా మీఠా)',
      description: 'Crisp ghee-fried bread triangles soaked in saffron-infused thickened milk (rabri), scented with cardamom and topped with toasted cashews and pistachios.',
      price: 160.00,
      costPrice: 45.00,
      imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 10,
      isVeg: true,
    },
    {
      categoryId: catDesserts.id,
      name: 'Shahi Qubani Ka Meetha with Fresh Malai (ఖుబానీ కా మీఠా)',
      description: 'The crowning jewel of Nizam feasts: slow-cooked Turkish dried apricots pureed with apricot kernels and crowned with a dollop of fresh thick clotted cream.',
      price: 180.00,
      costPrice: 55.00,
      imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 8,
      isVeg: true,
    },
    {
      categoryId: catDesserts.id,
      name: 'Telangana Ghee Bobbatlu / Puran Poli (బొబ్బట్లు - 2 Pcs)',
      description: 'Melt-in-mouth sweet flatbreads stuffed with organic jaggery and chana dal filling, served piping hot with generous pure cow ghee.',
      price: 140.00,
      costPrice: 35.00,
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 10,
      isVeg: true,
    },
    {
      categoryId: catDesserts.id,
      name: 'Semiya Payasam with Dry Fruits (సేమియా పాయసం)',
      description: 'Roasted vermicelli slow-cooked in rich whole milk with green cardamom, golden raisins, and ghee-toasted cashews.',
      price: 120.00,
      costPrice: 30.00,
      imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 8,
      isVeg: true,
    },
    {
      categoryId: catDesserts.id,
      name: 'Bellam Jalebi (బెల్లం జిలేబీ)',
      description: 'Crisp spiral jalebis soaked in warm cardamom organic jaggery syrup with a dash of saffron.',
      price: 130.00,
      costPrice: 32.00,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 12,
      isVeg: true,
    },

    // --- Beverages (3 items) ---
    {
      categoryId: catBeverages.id,
      name: 'Hyderabadi Irani Chai with Osmania Biscuits (ఇరానీ చాయ్ & ఉస్మానియా బిస్కెట్లు)',
      description: 'Authentic slow-dum brewed rich spiced black tea blended with thickened creamy milk, paired with sweet and salty Osmania biscuits.',
      price: 70.00,
      costPrice: 15.00,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 5,
      isVeg: true,
    },
    {
      categoryId: catBeverages.id,
      name: 'Telangana Masala Majjiga (మసాలా మజ్జిగ)',
      description: 'Refreshing churned spiced buttermilk blended with crushed ginger, green chillies, curry leaves, hing, and fresh rock salt.',
      price: 60.00,
      costPrice: 12.00,
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 5,
      isVeg: true,
    },
    {
      categoryId: catBeverages.id,
      name: 'Nannari Sharbat with Sabja (నన్నారి షర్బత్)',
      description: 'Traditional cooling herbal beverage made from wild sarsaparilla root syrup, fresh squeezed lime, and swollen basil seeds (sabja).',
      price: 80.00,
      costPrice: 18.00,
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 5,
      isVeg: true,
    },
  ];

  const menuItems = [];
  for (const item of telanganaItems) {
    const created = await prisma.menuItem.create({ data: item });
    menuItems.push(created);
  }
  console.log(`✅ ${menuItems.length} Authentic Telangana & Hyderabadi Menu Items created`);

  // 6. Restaurant Tables
  const tablesData = [
    { tableNumber: 'T-01', seatingCapacity: 2, location: 'Kakatiya Hall', status: 'OCCUPIED' },
    { tableNumber: 'T-02', seatingCapacity: 4, location: 'Kakatiya Hall', status: 'AVAILABLE' },
    { tableNumber: 'T-03', seatingCapacity: 4, location: 'Kakatiya Hall', status: 'OCCUPIED' },
    { tableNumber: 'T-04', seatingCapacity: 6, location: 'Kakatiya Hall', status: 'AVAILABLE' },
    { tableNumber: 'T-05', seatingCapacity: 2, location: 'Golconda Garden Patio', status: 'RESERVED' },
    { tableNumber: 'T-06', seatingCapacity: 4, location: 'Golconda Garden Patio', status: 'AVAILABLE' },
    { tableNumber: 'T-07', seatingCapacity: 4, location: 'Charminar Rooftop Terrace', status: 'AVAILABLE' },
    { tableNumber: 'T-08', seatingCapacity: 6, location: 'Charminar Rooftop Terrace', status: 'OCCUPIED' },
    { tableNumber: 'T-09', seatingCapacity: 8, location: 'Nizam VIP Royal Lounge', status: 'RESERVED' },
    { tableNumber: 'T-10', seatingCapacity: 10, location: 'Nizam VIP Royal Lounge', status: 'AVAILABLE' },
  ];

  const tables = [];
  for (const t of tablesData) {
    const created = await prisma.restaurantTable.create({ data: t });
    tables.push(created);
  }
  console.log(`✅ ${tables.length} Restaurant Tables created`);

  // 7. Customers
  const customersData = [
    { name: 'Dr. Ramakrishna Rao', email: 'ramakrishna.rao@osmania.ac.in', phone: '+91 98480 11223', address: 'Plot 42, Jubilee Hills, Hyderabad', loyaltyPoints: 450 },
    { name: 'Kavitha Reddy', email: 'kavitha.reddy@techmahindra.com', phone: '+91 98491 55667', address: 'Road No 36, Banjara Hills, Hyderabad', loyaltyPoints: 620 },
    { name: 'Venkatesh Goud', email: 'venkat.goud@warangal.org', phone: '+91 99890 33445', address: 'Hanamkonda, Warangal Urban', loyaltyPoints: 210 },
    { name: 'Ananya Kulkarni', email: 'ananya.k@infy.com', phone: '+91 97000 44556', address: 'Madhapur, Hitec City, Hyderabad', loyaltyPoints: 340 },
    { name: 'Sridhar Varma', email: 'sridhar.varma@tcs.com', phone: '+91 94400 88990', address: 'Gachibowli, Financial District', loyaltyPoints: 180 },
  ];

  const customers = [];
  for (const c of customersData) {
    const created = await prisma.customer.create({ data: c });
    customers.push(created);
  }
  console.log(`✅ ${customers.length} Customers created`);

  // 8. Reservations
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  await prisma.reservation.create({
    data: {
      customerId: customers[0].id,
      tableId: tables[4].id, // T-05
      reservationDate: today,
      timeSlot: '19:30 - 21:30',
      guestCount: 2,
      status: 'CONFIRMED',
      specialRequests: 'Special request: Natu kodi pulusu and hot Sarva pindi on arrival.',
    },
  });

  await prisma.reservation.create({
    data: {
      customerId: customers[1].id,
      tableId: tables[8].id, // T-09 Nizam VIP
      reservationDate: today,
      timeSlot: '20:00 - 22:30',
      guestCount: 8,
      status: 'CONFIRMED',
      specialRequests: 'Family celebration: Royal Zafrani Mutton Biryani Dastarkhwan setup.',
    },
  });

  await prisma.reservation.create({
    data: {
      customerId: customers[2].id,
      tableId: tables[5].id, // T-06
      reservationDate: tomorrow,
      timeSlot: '13:00 - 15:00',
      guestCount: 4,
      status: 'PENDING',
      specialRequests: 'Authentic Golichina Mamsam with Bagara Rice.',
    },
  });

  console.log('✅ Reservations created');

  // 9. Orders & 10. Order Items & 11. Payments & 12. Invoices
  // Order 1: Table 1 (Dine-in, OCCUPIED, status: PREPARING)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-001',
      tableId: tables[0].id,
      customerId: customers[0].id,
      employeeId: emp4.id,
      orderType: 'DINE_IN',
      status: 'PREPARING',
      subtotal: 820.00,
      taxAmount: 41.00,
      discountAmount: 0.00,
      totalAmount: 861.00,
      notes: 'Please keep Kodi Vepudu extra spicy with more curry leaves.',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      menuItemId: menuItems[1].id, // Kodi Vepudu
      quantity: 1,
      unitPrice: 340.00,
      subtotal: 340.00,
      status: 'READY',
      notes: 'Extra spicy',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      menuItemId: menuItems[6].id, // Zafrani Mutton Biryani
      quantity: 1,
      unitPrice: 480.00,
      subtotal: 480.00,
      status: 'PREPARING',
      notes: 'Extra Mirchi ka salan',
    },
  });

  // Order 2: Table 3 (Dine-in, OCCUPIED, status: PENDING)
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-002',
      tableId: tables[2].id,
      customerId: customers[2].id,
      employeeId: emp4.id,
      orderType: 'DINE_IN',
      status: 'PENDING',
      subtotal: 850.00,
      taxAmount: 42.50,
      discountAmount: 50.00,
      totalAmount: 842.50,
      notes: 'Rush lunch order.',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      menuItemId: menuItems[7].id, // Chicken Dum Biryani
      quantity: 1,
      unitPrice: 380.00,
      subtotal: 380.00,
      status: 'PENDING',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      menuItemId: menuItems[2].id, // Golichina Mamsam
      quantity: 1,
      unitPrice: 440.00,
      subtotal: 440.00,
      status: 'PENDING',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      menuItemId: menuItems[27].id, // Irani Chai
      quantity: 1,
      unitPrice: 70.00,
      subtotal: 70.00,
      status: 'PENDING',
    },
  });

  // Order 3: Table 8 (SERVED & PAID - UPI Settlement)
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-003',
      tableId: tables[7].id,
      customerId: customers[1].id,
      employeeId: emp4.id,
      orderType: 'DINE_IN',
      status: 'SERVED',
      subtotal: 1360.00,
      taxAmount: 68.00,
      discountAmount: 100.00,
      totalAmount: 1328.00,
      notes: 'Reddy family get-together.',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order3.id,
      menuItemId: menuItems[8].id, // Gongura Mutton Biryani
      quantity: 2,
      unitPrice: 490.00,
      subtotal: 980.00,
      status: 'SERVED',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order3.id,
      menuItemId: menuItems[24].id, // Double Ka Meetha
      quantity: 2,
      unitPrice: 160.00,
      subtotal: 320.00,
      status: 'SERVED',
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order3.id,
      paymentMethod: 'UPI',
      amount: 1328.00,
      status: 'COMPLETED',
      transactionId: 'UPI-TEL-982140',
      paidAt: new Date(),
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-001',
      orderId: order3.id,
      customerName: customers[1].name,
      customerPhone: customers[1].phone,
      subtotal: 1360.00,
      taxRate: 5.00,
      taxAmount: 68.00,
      discountAmount: 100.00,
      totalAmount: 1328.00,
      paymentStatus: 'PAID',
      generatedBy: adminUser.id,
    },
  });

  // Historical completed orders for charts & analytics
  const pastDays = [1, 2, 3, 4, 5, 6, 7];
  for (const day of pastDays) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - day);

    const sub = 2400 + day * 350;
    const tax = sub * 0.05;
    const tot = sub + tax;

    const pastOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-2026-HIST-${day}`,
        tableId: tables[day % tables.length].id,
        customerId: customers[day % customers.length].id,
        employeeId: emp4.id,
        orderType: day % 2 === 0 ? 'DINE_IN' : 'TAKEAWAY',
        status: 'SERVED',
        subtotal: sub,
        taxAmount: tax,
        discountAmount: 0.00,
        totalAmount: tot,
        createdAt: pastDate,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: pastOrder.id,
        menuItemId: menuItems[day % menuItems.length].id,
        quantity: 3,
        unitPrice: menuItems[day % menuItems.length].price,
        subtotal: Number(menuItems[day % menuItems.length].price) * 3,
        status: 'SERVED',
        createdAt: pastDate,
      },
    });

    const paymentMethods = ['UPI', 'CARD', 'CASH'];
    await prisma.payment.create({
      data: {
        orderId: pastOrder.id,
        paymentMethod: paymentMethods[day % paymentMethods.length],
        amount: tot,
        status: 'COMPLETED',
        transactionId: `TXN-UPI-${10000 + day}`,
        paidAt: pastDate,
        createdAt: pastDate,
      },
    });

    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-2026-HIST-${day}`,
        orderId: pastOrder.id,
        customerName: customers[day % customers.length].name,
        customerPhone: customers[day % customers.length].phone,
        subtotal: sub,
        taxRate: 5.00,
        taxAmount: tax,
        discountAmount: 0.00,
        totalAmount: tot,
        paymentStatus: 'PAID',
        generatedBy: adminUser.id,
        createdAt: pastDate,
      },
    });
  }

  console.log('✅ Orders, OrderItems, Payments & Invoices created');

  // 13. Ingredients & 14. Suppliers & 15. Inventory Transactions
  const sup1 = await prisma.supplier.create({
    data: {
      name: 'Warangal & Guntur Spice Traders',
      contactPerson: 'Venkata Narayana',
      email: 'spices@warangalspicetraders.in',
      phone: '+91 94401 22334',
      address: 'Shop 14, Grain & Spice Market, Warangal, Telangana',
      suppliedItems: 'Guntur Teja Chillies, Coriander seeds, Shahjeera, Garlic, Turmeric',
      isActive: true,
    },
  });

  const sup2 = await prisma.supplier.create({
    data: {
      name: 'Deccan Dairy & Fresh Khoya Farms',
      contactPerson: 'Syed Khaleel',
      email: 'khaleel@deccandairy.com',
      phone: '+91 98488 44332',
      address: 'Dairy Farm Road, Chandrayangutta, Hyderabad',
      suppliedItems: 'Buffalo Milk, Desi Ghee, Fresh Malai, Mawa (Khoya), Paneer',
      isActive: true,
    },
  });

  const sup3 = await prisma.supplier.create({
    data: {
      name: 'Nalgonda Poultry & Fresh Lamb Suppliers',
      contactPerson: 'Bhadraiah Yadav',
      email: 'nalgondameats@gmail.com',
      phone: '+91 99899 55667',
      address: 'Bhuvanagiri Bypass, Nalgonda Highway, Telangana',
      suppliedItems: 'Natu Kodi (Country Chicken), Fresh Potla Mutton, Boti, Country Eggs',
      isActive: true,
    },
  });

  console.log('✅ Suppliers created');

  const ingredientsData = [
    { name: 'Fresh Potla Mutton with Bone', category: 'Meat', currentStock: 45.00, unit: 'kg', minThreshold: 15.00, unitCost: 750.00 },
    { name: 'Telangana Natu Kodi (Country Chicken)', category: 'Meat', currentStock: 30.00, unit: 'kg', minThreshold: 12.00, unitCost: 380.00 },
    { name: 'Fresh Gongura (Roselle Leaves)', category: 'Produce', currentStock: 8.00, unit: 'kg', minThreshold: 20.00, unitCost: 60.00 }, // LOW STOCK ALERT!
    { name: 'Aged Daawat Biryani Basmati Rice', category: 'Dry Goods', currentStock: 150.00, unit: 'kg', minThreshold: 40.00, unitCost: 110.00 },
    { name: 'Pure Desi Buffalo Ghee', category: 'Dairy', currentStock: 25.00, unit: 'kg', minThreshold: 10.00, unitCost: 650.00 },
    { name: 'Guntur Teja Red Chillies', category: 'Spices', currentStock: 6.00, unit: 'kg', minThreshold: 15.00, unitCost: 220.00 }, // LOW STOCK ALERT!
    { name: 'Jowar / Sorghum Flour (Jonna Pindi)', category: 'Dry Goods', currentStock: 40.00, unit: 'kg', minThreshold: 15.00, unitCost: 55.00 },
    { name: 'Turkish Dried Apricots (Qubani)', category: 'Dry Goods', currentStock: 4.50, unit: 'kg', minThreshold: 8.00, unitCost: 580.00 }, // LOW STOCK ALERT!
    { name: 'Kashmiri Mogra Saffron (Zafran)', category: 'Spices', currentStock: 0.25, unit: 'g', minThreshold: 0.10, unitCost: 240.00 },
    { name: 'Whole Shahjeera & Hyderabadi Garam Masala', category: 'Spices', currentStock: 12.00, unit: 'kg', minThreshold: 5.00, unitCost: 450.00 },
  ];

  const ingredients = [];
  for (const ing of ingredientsData) {
    const created = await prisma.ingredient.create({ data: ing });
    ingredients.push(created);
  }
  console.log(`✅ ${ingredients.length} Ingredients created`);

  // Inventory Transactions
  await prisma.inventoryTransaction.create({
    data: {
      ingredientId: ingredients[0].id,
      supplierId: sup3.id,
      type: 'PURCHASE',
      quantity: 50.00,
      unitCost: 750.00,
      totalCost: 37500.00,
      notes: 'Weekly fresh Potla mutton delivery for Biryani and Golichina Mamsam',
    },
  });

  await prisma.inventoryTransaction.create({
    data: {
      ingredientId: ingredients[0].id,
      type: 'USAGE',
      quantity: 5.00,
      notes: 'Morning kitchen dum prep',
    },
  });

  await prisma.inventoryTransaction.create({
    data: {
      ingredientId: ingredients[2].id,
      supplierId: sup1.id,
      type: 'PURCHASE',
      quantity: 15.00,
      unitCost: 60.00,
      totalCost: 900.00,
      notes: 'Fresh farm gongura batch delivery',
    },
  });

  console.log('✅ Inventory Transactions created');

  // Restaurant Settings
  await prisma.restaurantSetting.create({
    data: {
      id: 1,
      restaurantName: 'Telangana Ruchulu — Kakatiya Military Kitchen',
      tagline: 'Authentic Telangana & Hyderabadi Royal Dastarkhwan',
      address: 'Plot 108, Hitec City Main Road, Madhapur, Hyderabad, Telangana 500081',
      phone: '+91 98480 22338',
      email: 'contact@telanganaruchulu.com',
      currencySymbol: '₹',
      currencyCode: 'INR',
      defaultTaxRate: 5.00,
      openingHours: '11:30 AM - 11:30 PM (Daily)',
      invoiceFooter: 'ధన్యవాదాలు! మీ ఆదరణకు కృతజ్ఞతలు. Please visit Telangana Ruchulu again!',
    },
  });

  console.log('✅ Restaurant Settings initialized with Telangana branding');
  console.log('🎉 Seeding successfully completed with 30 Telangana & Hyderabadi dishes!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
