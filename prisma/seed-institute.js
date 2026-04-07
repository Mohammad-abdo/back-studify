/**
 * Institute (Government Departments) Seed Script
 * 
 * Seeds data COMPLETELY SEPARATED from normal retail products:
 * 
 * 1. Institute users (INSTITUTE type) with Customer + Institute profiles
 * 2. Institute product categories (isInstituteCategory = true) — main & sub
 * 3. Institute products (isInstituteProduct = true) with tier pricing
 * 4. Wholesale orders with multiple items across different statuses
 * 5. Financial transactions (invoices) for wholesale payments
 * 
 * Usage:
 *   node prisma/seed-institute.js
 * 
 * Default password for all seeded users: Password123!
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Password123!';
const hashedPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 12);

async function main() {
  console.log('🏛️  Starting Institute (Government) seed...\n');

  // =============================================
  // 1. CREATE INSTITUTE USERS
  // =============================================
  console.log('👤 Creating institute users with Customer + Institute profiles...');

  const instituteUsers = [
    {
      phone: '+209000000001',
      email: 'health-ministry@gov.iq',
      name: 'وزارة الصحة',
      entityName: 'وزارة الصحة',
      contactPerson: 'د. أحمد عبدالله',
      contactPhone: '+209000000011',
      avatarName: 'MOH',
    },
    {
      phone: '+209000000002',
      email: 'education-ministry@gov.iq',
      name: 'وزارة التربية',
      entityName: 'وزارة التربية والتعليم',
      contactPerson: 'أ. فاطمة حسن',
      contactPhone: '+209000000012',
      avatarName: 'MOE',
    },
    {
      phone: '+209000000003',
      email: 'interior-ministry@gov.iq',
      name: 'وزارة الداخلية',
      entityName: 'وزارة الداخلية',
      contactPerson: 'عقيد خالد محمود',
      contactPhone: '+209000000013',
      avatarName: 'MOI',
    },
    {
      phone: '+209000000004',
      email: 'finance-dept@gov.iq',
      name: 'ديوان الرقابة المالية',
      entityName: 'ديوان الرقابة المالية',
      contactPerson: 'م. سعد الجبوري',
      contactPhone: '+209000000014',
      avatarName: 'FAD',
    },
    {
      phone: '+209000000005',
      email: 'electricity-ministry@gov.iq',
      name: 'وزارة الكهرباء',
      entityName: 'وزارة الكهرباء',
      contactPerson: 'م. نور الدين',
      contactPhone: '+209000000015',
      avatarName: 'MOE2',
    },
  ];

  const createdInstituteUsers = [];

  for (const inst of instituteUsers) {
    const user = await prisma.user.upsert({
      where: { phone: inst.phone },
      update: {},
      create: {
        phone: inst.phone,
        password: hashedPassword,
        name: inst.name,
        email: inst.email,
        avatarUrl: `https://ui-avatars.com/api/?name=${inst.avatarName}&background=1e40af&color=fff`,
        type: 'INSTITUTE',
        isActive: true,
        institute: {
          create: {},
        },
        customer: {
          create: {
            entityName: inst.entityName,
            contactPerson: inst.contactPerson,
            phone: inst.contactPhone,
          },
        },
      },
      include: { customer: true, institute: true },
    });
    createdInstituteUsers.push(user);
    console.log(`  ✅ ${inst.entityName} — phone: ${inst.phone}`);
  }

  // =============================================
  // 2. CREATE INSTITUTE CATEGORIES (MAIN)
  // =============================================
  console.log('\n📂 Creating main institute categories (isInstituteCategory = true)...');

  const mainCategories = [
    { name: 'مستلزمات مكتبية حكومية' },
    { name: 'أثاث مكتبي' },
    { name: 'أجهزة إلكترونية' },
    { name: 'مستلزمات طبية حكومية' },
    { name: 'مواد تنظيف ومعقمات' },
    { name: 'قرطاسية ومطبوعات رسمية' },
  ];

  const createdMainCats = [];
  for (const cat of mainCategories) {
    let existing = await prisma.productCategory.findFirst({
      where: { name: cat.name, isInstituteCategory: true },
    });
    if (!existing) {
      existing = await prisma.productCategory.create({
        data: { name: cat.name, isInstituteCategory: true },
      });
      console.log(`  ✅ Main: ${cat.name}`);
    } else {
      console.log(`  ⏭️  Main exists: ${cat.name}`);
    }
    createdMainCats.push(existing);
  }

  // =============================================
  // 3. CREATE INSTITUTE SUB-CATEGORIES
  // =============================================
  console.log('\n📁 Creating institute sub-categories...');

  const subCategoriesMap = [
    // Under "مستلزمات مكتبية حكومية"
    { name: 'أقلام وأحبار', parentIdx: 0 },
    { name: 'دفاتر وملفات', parentIdx: 0 },
    { name: 'أدوات تنظيم مكتبي', parentIdx: 0 },
    // Under "أثاث مكتبي"
    { name: 'مكاتب عمل', parentIdx: 1 },
    { name: 'كراسي مكتبية', parentIdx: 1 },
    { name: 'خزائن وأرفف', parentIdx: 1 },
    // Under "أجهزة إلكترونية"
    { name: 'حواسيب وشاشات', parentIdx: 2 },
    { name: 'طابعات وماسحات', parentIdx: 2 },
    { name: 'أجهزة اتصال', parentIdx: 2 },
    // Under "مستلزمات طبية حكومية"
    { name: 'معدات فحص', parentIdx: 3 },
    { name: 'مستلزمات وقائية', parentIdx: 3 },
    { name: 'أدوية ومحاليل', parentIdx: 3 },
    // Under "مواد تنظيف ومعقمات"
    { name: 'معقمات أسطح', parentIdx: 4 },
    { name: 'مواد تنظيف عامة', parentIdx: 4 },
    // Under "قرطاسية ومطبوعات رسمية"
    { name: 'أوراق رسمية مطبوعة', parentIdx: 5 },
    { name: 'أختام ودمغات', parentIdx: 5 },
    { name: 'مغلفات ومراسلات', parentIdx: 5 },
  ];

  const createdSubCats = [];
  for (const sub of subCategoriesMap) {
    const parentId = createdMainCats[sub.parentIdx].id;
    let existing = await prisma.productCategory.findFirst({
      where: { name: sub.name, isInstituteCategory: true },
    });
    if (!existing) {
      existing = await prisma.productCategory.create({
        data: { name: sub.name, isInstituteCategory: true },
      });
      console.log(`  ✅ Sub (${createdMainCats[sub.parentIdx].name}): ${sub.name}`);
    } else {
      console.log(`  ⏭️  Sub exists: ${sub.name}`);
    }
    createdSubCats.push({ ...existing, parentIdx: sub.parentIdx });
  }

  // =============================================
  // 4. CREATE INSTITUTE PRODUCTS
  // =============================================
  console.log('\n📦 Creating institute products (isInstituteProduct = true)...');

  const allInstCats = [...createdMainCats, ...createdSubCats];

  const instituteProducts = [
    // مستلزمات مكتبية حكومية — أقلام وأحبار (subCats[0])
    {
      name: 'أقلام حبر رسمية — عبوة 100',
      description: 'أقلام حبر جاف أزرق وأسود للاستخدام الحكومي، عبوة 100 قلم. مناسبة للمكاتب والدوائر الرسمية.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800']),
      categoryId: createdSubCats[0].id,
      basePrice: 45.00,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 9, price: 45.00 },
        { minQuantity: 10, maxQuantity: 49, price: 38.00 },
        { minQuantity: 50, maxQuantity: 199, price: 32.00 },
        { minQuantity: 200, price: 25.00 },
      ],
    },
    // دفاتر وملفات (subCats[1])
    {
      name: 'ملفات أرشيف حكومية — كرتون 50',
      description: 'ملفات كرتونية للأرشفة الحكومية بحجم A4 مع تبويب معدني. عبوة 50 ملف.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800']),
      categoryId: createdSubCats[1].id,
      basePrice: 120.00,
      pricingStrategy: 'DISCOUNT_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 4, price: 120.00 },
        { minQuantity: 5, maxQuantity: 19, price: 105.00, discountPercent: 12.5 },
        { minQuantity: 20, maxQuantity: 99, price: 90.00, discountPercent: 25 },
        { minQuantity: 100, price: 75.00, discountPercent: 37.5 },
      ],
    },
    // مكاتب عمل (subCats[3])
    {
      name: 'مكتب عمل حكومي — خشب زان',
      description: 'مكتب عمل رسمي من خشب الزان الطبيعي مع أدراج جانبية. مقاس 160×80 سم.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800']),
      categoryId: createdSubCats[3].id,
      basePrice: 850.00,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 4, price: 850.00 },
        { minQuantity: 5, maxQuantity: 19, price: 780.00 },
        { minQuantity: 20, maxQuantity: 49, price: 720.00 },
        { minQuantity: 50, price: 650.00 },
      ],
    },
    // كراسي مكتبية (subCats[4])
    {
      name: 'كرسي مكتبي دوّار — جلد صناعي',
      description: 'كرسي مكتبي دوار مع مسند ظهر عالي ومسند يد قابل للتعديل. لون أسود.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800']),
      categoryId: createdSubCats[4].id,
      basePrice: 320.00,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 9, price: 320.00 },
        { minQuantity: 10, maxQuantity: 49, price: 280.00 },
        { minQuantity: 50, price: 245.00 },
      ],
    },
    // حواسيب وشاشات (subCats[6])
    {
      name: 'حاسوب مكتبي Dell OptiPlex',
      description: 'حاسوب مكتبي Dell OptiPlex 7010 — معالج i5، رام 16GB، قرص SSD 512GB. مثالي للعمل الحكومي.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800']),
      categoryId: createdSubCats[6].id,
      basePrice: 1200.00,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 4, price: 1200.00 },
        { minQuantity: 5, maxQuantity: 24, price: 1100.00 },
        { minQuantity: 25, maxQuantity: 99, price: 1000.00 },
        { minQuantity: 100, price: 900.00 },
      ],
    },
    // طابعات وماسحات (subCats[7])
    {
      name: 'طابعة ليزرية HP LaserJet Pro',
      description: 'طابعة ليزرية HP LaserJet Pro M404dn — طباعة ثنائية الوجه، شبكة سلكية. مناسبة للمكاتب.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800']),
      categoryId: createdSubCats[7].id,
      basePrice: 450.00,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 4, price: 450.00 },
        { minQuantity: 5, maxQuantity: 19, price: 410.00 },
        { minQuantity: 20, price: 370.00 },
      ],
    },
    // معدات فحص (subCats[9])
    {
      name: 'جهاز قياس ضغط الدم — رقمي',
      description: 'جهاز قياس ضغط الدم الرقمي أوتوماتيك مع شاشة LCD كبيرة. معتمد طبياً.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800']),
      categoryId: createdSubCats[9].id,
      basePrice: 85.00,
      pricingStrategy: 'DISCOUNT_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 9, price: 85.00 },
        { minQuantity: 10, maxQuantity: 49, price: 72.00, discountPercent: 15 },
        { minQuantity: 50, maxQuantity: 199, price: 60.00, discountPercent: 29 },
        { minQuantity: 200, price: 50.00, discountPercent: 41 },
      ],
    },
    // مستلزمات وقائية (subCats[10])
    {
      name: 'كمامات طبية N95 — كرتون 1000',
      description: 'كمامات N95 طبية معتمدة من FDA. كرتون يحتوي على 1000 كمامة.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=800']),
      categoryId: createdSubCats[10].id,
      basePrice: 350.00,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 4, price: 350.00 },
        { minQuantity: 5, maxQuantity: 19, price: 310.00 },
        { minQuantity: 20, maxQuantity: 49, price: 280.00 },
        { minQuantity: 50, price: 240.00 },
      ],
    },
    // معقمات أسطح (subCats[12])
    {
      name: 'معقم أسطح مركّز — 20 لتر',
      description: 'محلول تعقيم أسطح مركّز للاستخدام المؤسسي. عبوة 20 لتر تكفي لـ 200 لتر بعد التخفيف.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=800']),
      categoryId: createdSubCats[12].id,
      basePrice: 95.00,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 9, price: 95.00 },
        { minQuantity: 10, maxQuantity: 49, price: 80.00 },
        { minQuantity: 50, price: 65.00 },
      ],
    },
    // أوراق رسمية مطبوعة (subCats[14])
    {
      name: 'ورق A4 أبيض 80 غرام — كرتون 5000',
      description: 'ورق طباعة A4 أبيض 80 غرام/م². كرتون يحتوي على 10 رزم (5000 ورقة).',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800']),
      categoryId: createdSubCats[14].id,
      basePrice: 55.00,
      pricingStrategy: 'DISCOUNT_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 9, price: 55.00 },
        { minQuantity: 10, maxQuantity: 49, price: 47.00, discountPercent: 14.5 },
        { minQuantity: 50, maxQuantity: 199, price: 40.00, discountPercent: 27 },
        { minQuantity: 200, price: 33.00, discountPercent: 40 },
      ],
    },
    // أختام ودمغات (subCats[15])
    {
      name: 'ختم رسمي مطاطي — حسب الطلب',
      description: 'ختم رسمي مطاطي مع حامل خشبي. يتم تصنيعه حسب النص المطلوب.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800']),
      categoryId: createdSubCats[15].id,
      basePrice: 25.00,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 9, price: 25.00 },
        { minQuantity: 10, maxQuantity: 49, price: 20.00 },
        { minQuantity: 50, price: 15.00 },
      ],
    },
    // Main cat directly: مواد تنظيف عامة (subCats[13])
    {
      name: 'صابون سائل مؤسسي — 10 لتر',
      description: 'صابون سائل لليدين برائحة اللافندر. عبوة مؤسسية 10 لتر.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=800']),
      categoryId: createdSubCats[13].id,
      basePrice: 35.00,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 19, price: 35.00 },
        { minQuantity: 20, maxQuantity: 99, price: 28.00 },
        { minQuantity: 100, price: 22.00 },
      ],
    },
  ];

  const createdProducts = [];
  for (const prod of instituteProducts) {
    const { tiers, ...productData } = prod;
    const product = await prisma.product.create({
      data: {
        ...productData,
        isInstituteProduct: true,
      },
    });
    createdProducts.push(product);
    console.log(`  ✅ ${prod.name}`);

    if (tiers && tiers.length > 0) {
      await prisma.productPricing.createMany({
        data: tiers.map(t => ({
          productId: product.id,
          minQuantity: t.minQuantity,
          maxQuantity: t.maxQuantity || null,
          price: t.price,
          fixedPrice: t.fixedPrice || null,
          discountPercent: t.discountPercent || null,
        })),
      });
      console.log(`     📊 ${tiers.length} pricing tiers added`);
    }
  }

  // =============================================
  // 5. CREATE WHOLESALE ORDERS
  // =============================================
  console.log('\n📋 Creating wholesale orders for institute customers...');

  const orderConfigs = [
    // وزارة الصحة — طلب كبير مستلزمات طبية (DELIVERED)
    {
      customerIdx: 0,
      status: 'DELIVERED',
      address: 'وزارة الصحة — بغداد، المنطقة الخضراء',
      daysAgo: 30,
      items: [
        { productIdx: 6, quantity: 200, priceOverride: 50.00 },  // جهاز قياس ضغط
        { productIdx: 7, quantity: 50, priceOverride: 280.00 },  // كمامات
        { productIdx: 8, quantity: 100, priceOverride: 65.00 },  // معقم
      ],
    },
    // وزارة الصحة — طلب ثاني (PROCESSING)
    {
      customerIdx: 0,
      status: 'PROCESSING',
      address: 'مستشفى الكرخ التعليمي — بغداد',
      daysAgo: 3,
      items: [
        { productIdx: 7, quantity: 100, priceOverride: 240.00 },  // كمامات
        { productIdx: 8, quantity: 200, priceOverride: 65.00 },   // معقم
      ],
    },
    // وزارة التربية — طلب مكتبي (DELIVERED)
    {
      customerIdx: 1,
      status: 'DELIVERED',
      address: 'وزارة التربية — الرصافة، بغداد',
      daysAgo: 45,
      items: [
        { productIdx: 0, quantity: 500, priceOverride: 25.00 },   // أقلام
        { productIdx: 1, quantity: 200, priceOverride: 75.00 },   // ملفات
        { productIdx: 9, quantity: 300, priceOverride: 33.00 },   // ورق A4
      ],
    },
    // وزارة التربية — طلب أثاث (SHIPPED)
    {
      customerIdx: 1,
      status: 'SHIPPED',
      address: 'مديرية تربية الكرخ الثانية — بغداد',
      daysAgo: 7,
      items: [
        { productIdx: 2, quantity: 30, priceOverride: 720.00 },   // مكاتب
        { productIdx: 3, quantity: 30, priceOverride: 280.00 },   // كراسي
      ],
    },
    // وزارة الداخلية — أجهزة (PAID)
    {
      customerIdx: 2,
      status: 'PAID',
      address: 'وزارة الداخلية — المقر الرئيسي، بغداد',
      daysAgo: 5,
      items: [
        { productIdx: 4, quantity: 50, priceOverride: 1000.00 },  // حواسيب
        { productIdx: 5, quantity: 20, priceOverride: 410.00 },   // طابعات
        { productIdx: 9, quantity: 100, priceOverride: 40.00 },   // ورق
      ],
    },
    // ديوان الرقابة المالية — مستلزمات مكتبية (CREATED)
    {
      customerIdx: 3,
      status: 'CREATED',
      address: 'ديوان الرقابة المالية — الكرادة، بغداد',
      daysAgo: 1,
      items: [
        { productIdx: 0, quantity: 100, priceOverride: 32.00 },   // أقلام
        { productIdx: 1, quantity: 50, priceOverride: 90.00 },    // ملفات
        { productIdx: 10, quantity: 100, priceOverride: 15.00 },  // أختام
        { productIdx: 9, quantity: 50, priceOverride: 47.00 },    // ورق
      ],
    },
    // وزارة الكهرباء — أجهزة ومكتبي (PROCESSING)
    {
      customerIdx: 4,
      status: 'PROCESSING',
      address: 'وزارة الكهرباء — بغداد الجديدة',
      daysAgo: 10,
      items: [
        { productIdx: 4, quantity: 25, priceOverride: 1100.00 },  // حواسيب
        { productIdx: 5, quantity: 10, priceOverride: 450.00 },   // طابعات
        { productIdx: 2, quantity: 10, priceOverride: 780.00 },   // مكاتب
        { productIdx: 3, quantity: 10, priceOverride: 320.00 },   // كراسي
      ],
    },
    // وزارة الداخلية — تنظيف (DELIVERED)
    {
      customerIdx: 2,
      status: 'DELIVERED',
      address: 'مديرية شرطة بغداد — المنطقة المركزية',
      daysAgo: 60,
      items: [
        { productIdx: 8, quantity: 500, priceOverride: 65.00 },   // معقم
        { productIdx: 11, quantity: 300, priceOverride: 22.00 },  // صابون
      ],
    },
    // وزارة الصحة — طلب أختام (DELIVERED)
    {
      customerIdx: 0,
      status: 'DELIVERED',
      address: 'دائرة صحة بغداد/الكرخ',
      daysAgo: 90,
      items: [
        { productIdx: 10, quantity: 50, priceOverride: 20.00 },   // أختام
        { productIdx: 0, quantity: 200, priceOverride: 32.00 },   // أقلام
        { productIdx: 1, quantity: 100, priceOverride: 90.00 },   // ملفات
      ],
    },
    // وزارة الكهرباء — مستلزمات تنظيف (CANCELLED)
    {
      customerIdx: 4,
      status: 'CANCELLED',
      address: 'المحطة الحرارية الجنوبية — البصرة',
      daysAgo: 15,
      items: [
        { productIdx: 8, quantity: 100, priceOverride: 80.00 },
        { productIdx: 11, quantity: 200, priceOverride: 28.00 },
      ],
    },
  ];

  const createdOrders = [];

  for (const config of orderConfigs) {
    const customer = createdInstituteUsers[config.customerIdx];
    if (!customer?.customer) continue;

    let total = 0;
    const itemsData = config.items.map(item => {
      const product = createdProducts[item.productIdx];
      if (!product) return null;
      const lineTotal = item.priceOverride * item.quantity;
      total += lineTotal;
      return {
        productId: product.id,
        quantity: item.quantity,
        price: item.priceOverride,
      };
    }).filter(Boolean);

    if (itemsData.length === 0) continue;

    const order = await prisma.wholesaleOrder.create({
      data: {
        customerId: customer.customer.id,
        total,
        status: config.status,
        address: config.address,
        createdAt: new Date(Date.now() - config.daysAgo * 24 * 60 * 60 * 1000),
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    });
    createdOrders.push(order);
    console.log(`  ✅ #${order.id.slice(0, 8)} — ${customer.customer.entityName} — $${total.toLocaleString()} — ${config.status} (${order.items.length} items)`);
  }

  // =============================================
  // 6. CREATE FINANCIAL TRANSACTIONS (INVOICES)
  // =============================================
  console.log('\n💰 Creating financial transactions for wholesale orders...');

  for (const order of createdOrders) {
    if (order.status === 'CANCELLED' || order.status === 'CREATED') continue;

    const isPaid = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status);
    const isCompleted = order.status === 'DELIVERED';

    const transaction = await prisma.financialTransaction.create({
      data: {
        type: 'PAYMENT',
        amount: order.total,
        status: isCompleted ? 'COMPLETED' : (isPaid ? 'PENDING' : 'PENDING'),
        description: `فاتورة طلب جملة #${order.id.slice(0, 8)} — دوائر الدولة`,
        orderId: order.id,
        metadata: {
          orderType: 'WHOLESALE',
          customerId: order.customerId,
          itemCount: order.items.length,
          totalQuantity: order.items.reduce((s, i) => s + i.quantity, 0),
        },
        createdAt: order.createdAt,
        completedAt: isCompleted ? new Date(order.createdAt.getTime() + 5 * 24 * 60 * 60 * 1000) : null,
      },
    });
    console.log(`  ✅ Invoice #${transaction.id.slice(0, 8)} — $${order.total.toLocaleString()} — ${transaction.status}`);

    if (isCompleted) {
      const commission = await prisma.financialTransaction.create({
        data: {
          type: 'COMMISSION',
          amount: order.total * 0.05,
          status: 'COMPLETED',
          description: `عمولة منصة على طلب جملة #${order.id.slice(0, 8)}`,
          orderId: order.id,
          metadata: {
            orderType: 'WHOLESALE',
            commissionRate: 0.05,
            baseAmount: order.total,
          },
          createdAt: new Date(order.createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
          completedAt: new Date(order.createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });
      console.log(`     📊 Commission: $${commission.amount.toFixed(2)}`);
    }
  }

  // =============================================
  // SUMMARY
  // =============================================
  console.log('\n' + '═'.repeat(60));
  console.log('✨ Institute seed completed successfully!');
  console.log('═'.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   🏛️  Institute users:     ${createdInstituteUsers.length}`);
  console.log(`   📂 Main categories:      ${createdMainCats.length}`);
  console.log(`   📁 Sub-categories:       ${createdSubCats.length}`);
  console.log(`   📦 Institute products:   ${createdProducts.length}`);
  console.log(`   📋 Wholesale orders:     ${createdOrders.length}`);
  console.log(`\n🔑 Institute user credentials (password: ${DEFAULT_PASSWORD}):`);
  for (const u of createdInstituteUsers) {
    console.log(`   ${u.customer?.entityName || u.name}: ${u.phone}`);
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding institute data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
