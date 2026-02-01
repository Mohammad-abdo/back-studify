/**
 * Create Test Order for Print System
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestOrder() {
  console.log('📋 Creating test order for print system...\n');

  try {
    // Get a student user
    const student = await prisma.user.findFirst({
      where: { type: 'STUDENT' },
      include: { student: true }
    });

    if (!student) {
      console.log('❌ No student found. Please run the seed script first.');
      return;
    }

    // Get a book to print
    const book = await prisma.book.findFirst();
    if (!book) {
      console.log('❌ No books found. Please run the seed script first.');
      return;
    }

    // Create a new order
    const order = await prisma.order.create({
      data: {
        userId: student.id,
        total: 45.0,
        status: 'PAID', // Set to PAID so it gets auto-assigned
        orderType: 'CONTENT',
        address: 'Engineering Campus, Building C, Room 201',
        latitude: 30.0285,
        longitude: 31.2090,
        items: {
          create: [{
            referenceType: 'BOOK',
            referenceId: book.id,
            quantity: 3,
            price: 15.0,
          }],
        },
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
      },
    });

    console.log('✅ Test order created successfully!');
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Student: ${order.user.student?.name || 'Unknown'} (${order.user.phone})`);
    console.log(`   Total: ${order.total} EGP`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Address: ${order.address}`);
    console.log(`   Items: ${order.items.length} item(s)`);
    
    order.items.forEach((item, i) => {
      console.log(`     ${i + 1}. ${item.referenceType} (${item.referenceId.slice(0, 8)}) - ${item.quantity} copies`);
    });

    // The order should be auto-assigned to the nearest print center
    // Wait a moment and check
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const assignment = await prisma.printOrderAssignment.findFirst({
      where: { orderId: order.id },
      include: {
        printCenter: true
      }
    });

    if (assignment) {
      console.log('\n✅ Order auto-assigned to print center!');
      console.log(`   Assignment ID: ${assignment.id}`);
      console.log(`   Print Center: ${assignment.printCenter.name}`);
      console.log(`   Status: ${assignment.status}`);
    } else {
      console.log('\n⚠️ Order was not auto-assigned. This might be normal if no print centers are available.');
    }

    console.log('\n🎯 You can now:');
    console.log('   1. Login to the print center dashboard');
    console.log('   2. See this order in the assignments');
    console.log('   3. Update its status');
    console.log('   4. Track it using the tracking page');

  } catch (error) {
    console.error('❌ Error creating test order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrder();