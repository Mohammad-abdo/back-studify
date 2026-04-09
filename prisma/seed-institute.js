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

const prismaSingleton = new PrismaClient();

const DEFAULT_PASSWORD = 'Password123!';
const hashedPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 12);

/**
 * Four main institute categories (no " / " in name).
 * Sub-categories are stored as "MainName / SubName" — matches API filtering without a DB parent column.
 */
const INSTITUTE_MAIN_CATEGORIES = [
  'تجهيز المواد الاوليه',
  'القرطاسية',
  'مستلزمات عامة',
  'الاثاث المكتبي',
];

/** Sub names per main (3+2+2+3 = 10 total). Stored as `Main / Sub`. */
const INSTITUTE_SUB_CATEGORIES = [
  ['أحبار طابعات', 'ورق وأدوات طباعة', 'ملحقات طابعات'],
  ['أقلام وكتابة', 'دفاتر وملفات'],
  ['تنظيف وتعقيم', 'أدوات عامة'],
  ['مكاتب', 'كراسي مكتبية', 'خزائن ورفوف'],
];

const INSTITUTE_SUB_COUNT = INSTITUTE_SUB_CATEGORIES.reduce((n, arr) => n + arr.length, 0);
if (INSTITUTE_MAIN_CATEGORIES.length !== 4) {
  throw new Error('seed-institute: INSTITUTE_MAIN_CATEGORIES must have exactly 4 entries');
}
if (INSTITUTE_SUB_COUNT !== 10) {
  throw new Error(`seed-institute: expected 10 sub-categories total, got ${INSTITUTE_SUB_COUNT}`);
}

function buildCanonicalInstituteCategoryNames() {
  const set = new Set(INSTITUTE_MAIN_CATEGORIES);
  INSTITUTE_MAIN_CATEGORIES.forEach((main, i) => {
    for (const sub of INSTITUTE_SUB_CATEGORIES[i]) {
      set.add(`${main} / ${sub}`);
    }
  });
  return set;
}

async function ensureInstituteCategory(prisma, name) {
  let cat = await prisma.productCategory.findFirst({
    where: { name, isInstituteCategory: true },
  });
  if (!cat) {
    cat = await prisma.productCategory.create({
      data: { name, isInstituteCategory: true },
    });
    const label = name.includes(' / ') ? '  ✅ Sub' : '  ✅ Main';
    console.log(`${label}: ${name}`);
  } else {
    console.log(`  ⏭️  exists: ${name}`);
  }
  return cat;
}

async function runInstituteSeed(optionalClient) {
  const prisma = optionalClient ?? prismaSingleton;
  console.log('🏛️  Starting Institute (Government) seed...\n');

  // =============================================
  // 0. KEEP ONLY CANONICAL 4 MAIN + 10 SUB INSTITUTE CATEGORIES
  // =============================================
  console.log('🧹 Institute catalogue: keeping only 4 main + 10 sub categories (removing stray isInstituteCategory rows)...');
  const canonicalNames = buildCanonicalInstituteCategoryNames();
  const instituteCatsInDb = await prisma.productCategory.findMany({
    where: { isInstituteCategory: true },
    select: { id: true, name: true },
  });
  const strayIds = instituteCatsInDb.filter((c) => !canonicalNames.has(c.name)).map((c) => c.id);
  if (strayIds.length > 0) {
    const strayProducts = await prisma.product.findMany({
      where: { categoryId: { in: strayIds } },
      select: { id: true },
    });
    const strayProductIds = strayProducts.map((p) => p.id);
    if (strayProductIds.length > 0) {
      await prisma.wholesaleOrderItem.deleteMany({ where: { productId: { in: strayProductIds } } });
      await prisma.product.deleteMany({ where: { id: { in: strayProductIds } } });
    }
    await prisma.productCategory.deleteMany({ where: { id: { in: strayIds } } });
    console.log(`  ✅ Removed ${strayIds.length} stray institute categor(y/ies) and ${strayProductIds.length} linked product(s)`);
  } else {
    console.log('  ⏭️  No stray institute categories');
  }

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
  // 2–3. INSTITUTE CATEGORIES (4 mains + "Main / Sub" rows)
  // =============================================
  console.log('\n📂 Creating 4 main institute categories + sub-categories...');

  const createdMainCats = [];
  for (const name of INSTITUTE_MAIN_CATEGORIES) {
    createdMainCats.push(await ensureInstituteCategory(prisma, name));
  }

  const createdSubCats = [];
  for (let m = 0; m < INSTITUTE_SUB_CATEGORIES.length; m += 1) {
    const mainName = INSTITUTE_MAIN_CATEGORIES[m];
    for (const subShort of INSTITUTE_SUB_CATEGORIES[m]) {
      createdSubCats.push(await ensureInstituteCategory(prisma, `${mainName} / ${subShort}`));
    }
  }

  // Sub index map: 0 أحبار, 1 ورق, 2 ملحقات, 3 أقلام, 4 دفاتر, 5 تنظيف, 6 أدوات, 7 مكاتب, 8 كراسي, 9 خزائن
  const S = (i) => createdSubCats[i].id;

  // =============================================
  // 4. CREATE INSTITUTE PRODUCTS (linked to sub-categories only)
  // =============================================
  console.log('\n📦 Creating institute products (isInstituteProduct = true)...');

  const instituteProducts = [
    {
      name: 'حبر طابعة HP — عبوة أصلية',
      description: 'حبر أسود لطابعات HP LaserJet — عبوة أصلية للمؤسسات.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800']),
      categoryId: S(0),
      basePrice: 48.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 9, price: 48.0 },
        { minQuantity: 10, maxQuantity: 49, price: 42.0 },
        { minQuantity: 50, price: 36.0 },
      ],
    },
    {
      name: 'حبر طابعة Canon — أسود',
      description: 'خرطوشة حبر Canon للطابعات المكتبية.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800']),
      categoryId: S(0),
      basePrice: 52.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 9, price: 52.0 },
        { minQuantity: 10, maxQuantity: 49, price: 45.0 },
        { minQuantity: 50, price: 38.0 },
      ],
    },
    {
      name: 'ورق A4 أبيض 80 غرام — رزمة 500',
      description: 'ورق نسخ A4 للدوائر الحكومية.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800']),
      categoryId: S(1),
      basePrice: 12.0,
      pricingStrategy: 'DISCOUNT_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 19, price: 12.0 },
        { minQuantity: 20, maxQuantity: 99, price: 10.0, discountPercent: 16.7 },
        { minQuantity: 100, price: 8.5, discountPercent: 29 },
      ],
    },
    {
      name: 'ورق رسمي فاخر A4 — كرتون',
      description: 'ورق رسمي للمراسلات الحكومية.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800']),
      categoryId: S(1),
      basePrice: 55.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 9, price: 55.0 },
        { minQuantity: 10, maxQuantity: 49, price: 47.0 },
        { minQuantity: 50, price: 40.0 },
      ],
    },
    {
      name: 'كابل USB للطابعات — 3م',
      description: 'كابلات توصيل طابعات وماسحات.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800']),
      categoryId: S(2),
      basePrice: 8.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 49, price: 8.0 },
        { minQuantity: 50, price: 6.0 },
      ],
    },
    {
      name: 'أقلام حبر جاف — عبوة 50',
      description: 'أقلام زرقاء للاستخدام المؤسسي.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800']),
      categoryId: S(3),
      basePrice: 45.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 9, price: 45.0 },
        { minQuantity: 10, maxQuantity: 49, price: 38.0 },
        { minQuantity: 50, maxQuantity: 199, price: 32.0 },
        { minQuantity: 200, price: 25.0 },
      ],
    },
    {
      name: 'أقلام رصاص مؤسسية — صندوق 144',
      description: 'أقلام رصاص للأرشيف والتدقيق.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800']),
      categoryId: S(3),
      basePrice: 28.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 19, price: 28.0 },
        { minQuantity: 20, price: 22.0 },
      ],
    },
    {
      name: 'ملفات أرشيف حكومية — كرتون 50',
      description: 'ملفات A4 للأرشفة الرسمية.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800']),
      categoryId: S(4),
      basePrice: 120.0,
      pricingStrategy: 'DISCOUNT_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 4, price: 120.0 },
        { minQuantity: 5, maxQuantity: 19, price: 105.0, discountPercent: 12.5 },
        { minQuantity: 20, maxQuantity: 99, price: 90.0, discountPercent: 25 },
        { minQuantity: 100, price: 75.0, discountPercent: 37.5 },
      ],
    },
    {
      name: 'دفاتر مسطر A4 — رزمة 20',
      description: 'دفاتر للسجلات المكتبية.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800']),
      categoryId: S(4),
      basePrice: 35.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 49, price: 35.0 },
        { minQuantity: 50, price: 28.0 },
      ],
    },
    {
      name: 'معقم أسطح مركّز — 20 لتر',
      description: 'معقم للأسطح في المباني الحكومية.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=800']),
      categoryId: S(5),
      basePrice: 95.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 9, price: 95.0 },
        { minQuantity: 10, maxQuantity: 49, price: 80.0 },
        { minQuantity: 50, price: 65.0 },
      ],
    },
    {
      name: 'صابون سائل مؤسسي — 10 لتر',
      description: 'صابون للمغاسل المؤسسية.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=800']),
      categoryId: S(5),
      basePrice: 35.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 19, price: 35.0 },
        { minQuantity: 20, maxQuantity: 99, price: 28.0 },
        { minQuantity: 100, price: 22.0 },
      ],
    },
    {
      name: 'صندوق أدوات مكتبية — 25 قطعة',
      description: 'مجموعة أدوات صيانة خفيفة للمكاتب.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1581092160562-40aa08d78832?w=800']),
      categoryId: S(6),
      basePrice: 42.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 19, price: 42.0 },
        { minQuantity: 20, price: 34.0 },
      ],
    },
    {
      name: 'شريط لاصق صناعي — 36 لفة',
      description: 'لاصق للتغليف والأرشفة.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1586864387967-d02ff85d93e8?w=800']),
      categoryId: S(6),
      basePrice: 18.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 49, price: 18.0 },
        { minQuantity: 50, price: 14.0 },
      ],
    },
    {
      name: 'مكتب عمل حكومي — خشب زان',
      description: 'مكتب رسمي 160×80 سم مع أدراج.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800']),
      categoryId: S(7),
      basePrice: 850.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 4, price: 850.0 },
        { minQuantity: 5, maxQuantity: 19, price: 780.0 },
        { minQuantity: 20, maxQuantity: 49, price: 720.0 },
        { minQuantity: 50, price: 650.0 },
      ],
    },
    {
      name: 'طاولة اجتماعات — 240×120',
      description: 'طاولة اجتماعات للقاعات الحكومية.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800']),
      categoryId: S(7),
      basePrice: 1200.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 4, price: 1200.0 },
        { minQuantity: 5, price: 1050.0 },
      ],
    },
    {
      name: 'كرسي مكتبي دوّار — جلد صناعي',
      description: 'كرسي مكتبي قابل للتعديل.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800']),
      categoryId: S(8),
      basePrice: 320.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 9, price: 320.0 },
        { minQuantity: 10, maxQuantity: 49, price: 280.0 },
        { minQuantity: 50, price: 245.0 },
      ],
    },
    {
      name: 'كرسي زائر — مبطن',
      description: 'كراسي غرف الاستقبال.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800']),
      categoryId: S(8),
      basePrice: 180.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 19, price: 180.0 },
        { minQuantity: 20, price: 155.0 },
      ],
    },
    {
      name: 'خزانة ملفات معدنية — 4 أدراج',
      description: 'خزانة أرشفة معدنية.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800']),
      categoryId: S(9),
      basePrice: 290.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 9, price: 290.0 },
        { minQuantity: 10, price: 250.0 },
      ],
    },
    {
      name: 'رفوف خشبية — وحدة 5 رفوف',
      description: 'رفوف تخزين للمستودعات المكتبية.',
      imageUrls: JSON.stringify(['https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800']),
      categoryId: S(9),
      basePrice: 220.0,
      pricingStrategy: 'FIXED_TIERS',
      tiers: [
        { minQuantity: 1, maxQuantity: 14, price: 220.0 },
        { minQuantity: 15, price: 190.0 },
      ],
    },
  ];

  const createdProducts = [];
  for (const prod of instituteProducts) {
    const { tiers, ...productData } = prod;
    let product = await prisma.product.findFirst({
      where: { name: prod.name, isInstituteProduct: true },
    });
    if (!product) {
      product = await prisma.product.create({
        data: {
          ...productData,
          isInstituteProduct: true,
        },
      });
      console.log(`  ✅ ${prod.name}`);
      if (tiers && tiers.length > 0) {
        await prisma.productPricing.createMany({
          data: tiers.map((t) => ({
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
    } else {
      console.log(`  ⏭️  product exists: ${prod.name}`);
      if (product.categoryId !== productData.categoryId) {
        product = await prisma.product.update({
          where: { id: product.id },
          data: { categoryId: productData.categoryId },
        });
        console.log('     🔗 Updated product category to match seed tree');
      }
    }
    createdProducts.push(product);
  }

  // =============================================
  // 5. CREATE WHOLESALE ORDERS
  // =============================================
  console.log('\n📋 Creating wholesale orders for institute customers...');

  const orderConfigs = [
    {
      customerIdx: 0,
      status: 'DELIVERED',
      address: 'وزارة الصحة — بغداد، المنطقة الخضراء',
      daysAgo: 30,
      items: [
        { productIdx: 9, quantity: 200, priceOverride: 65.0 },
        { productIdx: 5, quantity: 500, priceOverride: 28.0 },
        { productIdx: 2, quantity: 300, priceOverride: 8.5 },
      ],
    },
    {
      customerIdx: 0,
      status: 'PROCESSING',
      address: 'مستشفى الكرخ التعليمي — بغداد',
      daysAgo: 3,
      items: [
        { productIdx: 5, quantity: 100, priceOverride: 32.0 },
        { productIdx: 9, quantity: 200, priceOverride: 65.0 },
      ],
    },
    {
      customerIdx: 1,
      status: 'DELIVERED',
      address: 'وزارة التربية — الرصافة، بغداد',
      daysAgo: 45,
      items: [
        { productIdx: 5, quantity: 500, priceOverride: 25.0 },
        { productIdx: 7, quantity: 200, priceOverride: 75.0 },
        { productIdx: 2, quantity: 300, priceOverride: 8.5 },
      ],
    },
    {
      customerIdx: 1,
      status: 'SHIPPED',
      address: 'مديرية تربية الكرخ الثانية — بغداد',
      daysAgo: 7,
      items: [
        { productIdx: 13, quantity: 30, priceOverride: 720.0 },
        { productIdx: 15, quantity: 30, priceOverride: 280.0 },
      ],
    },
    {
      customerIdx: 2,
      status: 'PAID',
      address: 'وزارة الداخلية — المقر الرئيسي، بغداد',
      daysAgo: 5,
      items: [
        { productIdx: 14, quantity: 10, priceOverride: 1050.0 },
        { productIdx: 0, quantity: 80, priceOverride: 36.0 },
        { productIdx: 2, quantity: 100, priceOverride: 8.5 },
      ],
    },
    {
      customerIdx: 3,
      status: 'CREATED',
      address: 'ديوان الرقابة المالية — الكرادة، بغداد',
      daysAgo: 1,
      items: [
        { productIdx: 5, quantity: 100, priceOverride: 32.0 },
        { productIdx: 7, quantity: 50, priceOverride: 90.0 },
        { productIdx: 12, quantity: 100, priceOverride: 14.0 },
        { productIdx: 2, quantity: 50, priceOverride: 10.0 },
      ],
    },
    {
      customerIdx: 4,
      status: 'PROCESSING',
      address: 'وزارة الكهرباء — بغداد الجديدة',
      daysAgo: 10,
      items: [
        { productIdx: 14, quantity: 5, priceOverride: 1050.0 },
        { productIdx: 1, quantity: 40, priceOverride: 38.0 },
        { productIdx: 13, quantity: 10, priceOverride: 780.0 },
        { productIdx: 15, quantity: 10, priceOverride: 320.0 },
      ],
    },
    {
      customerIdx: 2,
      status: 'DELIVERED',
      address: 'مديرية شرطة بغداد — المنطقة المركزية',
      daysAgo: 60,
      items: [
        { productIdx: 9, quantity: 500, priceOverride: 65.0 },
        { productIdx: 10, quantity: 300, priceOverride: 22.0 },
      ],
    },
    {
      customerIdx: 0,
      status: 'DELIVERED',
      address: 'دائرة صحة بغداد/الكرخ',
      daysAgo: 90,
      items: [
        { productIdx: 12, quantity: 50, priceOverride: 14.0 },
        { productIdx: 5, quantity: 200, priceOverride: 32.0 },
        { productIdx: 7, quantity: 100, priceOverride: 90.0 },
      ],
    },
    {
      customerIdx: 4,
      status: 'CANCELLED',
      address: 'المحطة الحرارية الجنوبية — البصرة',
      daysAgo: 15,
      items: [
        { productIdx: 9, quantity: 100, priceOverride: 80.0 },
        { productIdx: 10, quantity: 200, priceOverride: 28.0 },
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

if (require.main === module) {
  runInstituteSeed()
    .catch((e) => {
      console.error('❌ Error seeding institute data:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prismaSingleton.$disconnect();
    });
}

module.exports = { runInstituteSeed };
