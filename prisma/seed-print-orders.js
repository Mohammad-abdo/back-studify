/**
 * Seed طلبات المطابع (Print Center Orders)
 * ينشئ طلبات طباعة مع تعيينات لحالات مختلفة للتأكد من عمل التتبع في لوحة المطبعة.
 *
 * التشغيل:
 *   npm run prisma:seed:print-orders
 *   أو
 *   node prisma/seed-print-orders.js
 *
 * يشترط وجود: مطابع، طلاب، كتب/مواد (شغّل seed.js ثم seed-print-system.js أولاً إن لزم).
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ASSIGNMENT_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'PRINTING',
  'READY_FOR_PICKUP',
  'COMPLETED',
];

async function seedPrintOrders() {
  console.log('🖨️ جاري seed طلبات المطابع...\n');

  try {
    const [printCenters, students, books, materials] = await Promise.all([
      prisma.printCenter.findMany({ where: { isActive: true } }),
      prisma.user.findMany({ where: { type: 'STUDENT' }, take: 5 }),
      prisma.book.findMany({ take: 5 }),
      prisma.material.findMany({ take: 3 }),
    ]);

    if (!printCenters.length) {
      console.error('❌ لا توجد مطابع. شغّل: node prisma/seed.js ثم node prisma/seed-print-system.js');
      process.exit(1);
    }
    if (!students.length) {
      console.error('❌ لا يوجد طلاب. شغّل: node prisma/seed.js');
      process.exit(1);
    }
    const hasContent = books.length > 0 || materials.length > 0;
    if (!hasContent) {
      console.error('❌ لا توجد كتب أو مواد. شغّل: node prisma/seed.js');
      process.exit(1);
    }

    const created = [];

    for (let i = 0; i < ASSIGNMENT_STATUSES.length; i++) {
      const assignmentStatus = ASSIGNMENT_STATUSES[i];
      const student = students[i % students.length];
      const center = printCenters[i % printCenters.length];
      const refType = books.length ? 'BOOK' : 'MATERIAL';
      const refId = books.length ? books[0].id : materials[0].id;
      const price = 25 + i * 10;
      const quantity = 1 + (i % 3);
      const total = price * quantity;

      const order = await prisma.order.create({
        data: {
          userId: student.id,
          total,
          status: 'PAID',
          orderType: 'CONTENT',
          address: `عنوان الطلب ${i + 1} - ${center.name}`,
          latitude: (center.latitude || 30.03) + i * 0.002,
          longitude: (center.longitude || 31.21) + i * 0.001,
          items: {
            create: [{ referenceType: refType, referenceId: refId, quantity, price }],
          },
        },
      });

      const now = new Date();
      const assignmentData = {
        orderId: order.id,
        printCenterId: center.id,
        status: assignmentStatus,
        assignedAt: now,
      };
      if (['ACCEPTED', 'PRINTING', 'READY_FOR_PICKUP', 'COMPLETED'].includes(assignmentStatus)) {
        assignmentData.acceptedAt = new Date(now.getTime() - 3600000);
      }
      if (assignmentStatus === 'COMPLETED') {
        assignmentData.completedAt = new Date(now.getTime() - 1800000);
      }

      await prisma.printOrderAssignment.create({
        data: assignmentData,
      });

      const shortId = order.id.slice(0, 8);
      created.push({ shortId, fullId: order.id, status: assignmentStatus, center: center.name });
      console.log(`✅ طلب #${shortId} — حالة التعيين: ${assignmentStatus} — ${center.name}`);
    }

    // طلب إضافي ملغى للاختبار
    const student = students[0];
    const center = printCenters[0];
    const refType = books.length ? 'BOOK' : 'MATERIAL';
    const refId = books.length ? books[0].id : materials[0].id;
    const cancelOrder = await prisma.order.create({
      data: {
        userId: student.id,
        total: 40,
        status: 'PAID',
        orderType: 'CONTENT',
        address: 'طلب ملغى للاختبار',
        latitude: center.latitude ?? 30.03,
        longitude: center.longitude ?? 31.21,
        items: {
          create: [{ referenceType: refType, referenceId: refId, quantity: 1, price: 40 }],
        },
      },
    });
    await prisma.printOrderAssignment.create({
      data: {
        orderId: cancelOrder.id,
        printCenterId: center.id,
        status: 'CANCELLED',
      },
    });
    created.push({
      shortId: cancelOrder.id.slice(0, 8),
      fullId: cancelOrder.id,
      status: 'CANCELLED',
      center: center.name,
    });
    console.log(`✅ طلب #${cancelOrder.id.slice(0, 8)} — حالة التعيين: CANCELLED — ${center.name}`);

    console.log('\n✨ انتهى seed طلبات المطابع.\n');
    console.log('📋 اختبار التتبع في لوحة المطبعة (صفحة تتبع الطلب):');
    console.log('   أدخل أحد أرقام الطلب القصيرة في حقل البحث:\n');
    created.forEach(({ shortId, status }) => {
      console.log(`   #${shortId}  →  ${status}`);
    });
    console.log('\n   الرابط (إن كان التشغيل محلياً): لوحة المطبعة → تتبع الطلب');
  } catch (error) {
    console.error('❌ فشل seed طلبات المطابع:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedPrintOrders().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = seedPrintOrders;
