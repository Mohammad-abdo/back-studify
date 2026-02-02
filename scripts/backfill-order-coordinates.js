/**
 * Backfill Order Coordinates
 * Sets latitude/longitude for all orders that have null values.
 * Run once on production (or any DB) so assignments return coords for the map.
 *
 * Usage (from backend folder):
 *   node scripts/backfill-order-coordinates.js
 *
 * Requires: .env with DATABASE_URL
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_COORDS = { latitude: 30.0444, longitude: 31.2357 };

async function backfill() {
  console.log('🔄 Finding orders with null latitude or longitude...');
  const orders = await prisma.order.findMany({
    where: {
      OR: [{ latitude: null }, { longitude: null }],
    },
    select: { id: true, address: true },
  });

  if (orders.length === 0) {
    console.log('✅ No orders need backfill. All orders already have coordinates.');
    return;
  }

  console.log(`📦 Updating ${orders.length} order(s) with default coordinates (Cairo)...`);
  for (const o of orders) {
    await prisma.order.update({
      where: { id: o.id },
      data: DEFAULT_COORDS,
    });
  }
  console.log(`✅ Backfilled latitude/longitude for ${orders.length} order(s).`);
  console.log('   Assignments API will now return latitude/longitude for these orders.');
}

backfill()
  .catch((e) => {
    console.error('❌ Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
