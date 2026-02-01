/**
 * Manually assign orders to print centers
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignOrders() {
  console.log('📋 Assigning orders to print centers...\n');

  try {
    // Get unassigned PAID orders
    const unassignedOrders = await prisma.order.findMany({
      where: {
        status: 'PAID',
        printAssignment: null
      },
      include: {
        items: true,
        user: {
          select: {
            phone: true,
            student: {
              select: { name: true }
            }
          }
        }
      }
    });

    console.log(`Found ${unassignedOrders.length} unassigned orders`);

    if (unassignedOrders.length === 0) {
      console.log('No orders to assign');
      return;
    }

    // Get available print centers
    const printCenters = await prisma.printCenter.findMany({
      where: { isActive: true }
    });

    console.log(`Found ${printCenters.length} active print centers`);

    if (printCenters.length === 0) {
      console.log('No active print centers found');
      return;
    }

    // Assign each order to the first available print center
    for (const order of unassignedOrders) {
      const printCenter = printCenters[0]; // Use first print center for simplicity
      
      const assignment = await prisma.printOrderAssignment.create({
        data: {
          orderId: order.id,
          printCenterId: printCenter.id,
          status: 'PENDING',
        },
        include: {
          order: {
            include: {
              user: {
                select: {
                  phone: true,
                  student: {
                    select: { name: true }
                  }
                }
              }
            }
          },
          printCenter: true
        }
      });

      console.log(`✅ Assigned order ${order.id.slice(0, 8)} to ${printCenter.name}`);
      console.log(`   Student: ${order.user.student?.name || 'Unknown'} (${order.user.phone})`);
      console.log(`   Total: ${order.total} EGP`);
      console.log(`   Assignment ID: ${assignment.id.slice(0, 8)}`);
      console.log('');
    }

    console.log('🎉 All orders assigned successfully!');

  } catch (error) {
    console.error('❌ Error assigning orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignOrders();