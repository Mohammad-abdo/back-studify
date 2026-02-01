/**
 * Print System Test Data Seed
 * Creates comprehensive test data for print centers, orders, and assignments
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'Password123!';
const hashedPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 12);

async function seedPrintSystem() {
  console.log('🖨️ Seeding Print System Test Data...\n');

  try {
    // 1. Create additional print centers with coordinates
    console.log('🏢 Creating additional print centers...');
    
    const printCenters = [
      {
        phone: '+205555555552',
        email: 'print2@studify.com',
        name: 'Engineering Building Print Center',
        location: 'Engineering Building, 2nd Floor',
        address: 'Cairo University, Engineering Campus',
        latitude: 30.0280,
        longitude: 31.2080,
      },
      {
        phone: '+205555555553',
        email: 'print3@studify.com',
        name: 'Medicine Faculty Print Hub',
        location: 'Medical Building, Ground Floor',
        address: 'Cairo University, Medical Campus',
        latitude: 30.0350,
        longitude: 31.2200,
      },
      {
        phone: '+205555555554',
        email: 'print4@studify.com',
        name: 'Library Print Station',
        location: 'Central Library, 1st Floor',
        address: 'Cairo University, Main Library',
        latitude: 30.0400,
        longitude: 31.2300,
      },
    ];

    for (const center of printCenters) {
      const user = await prisma.user.upsert({
        where: { phone: center.phone },
        update: {},
        create: {
          phone: center.phone,
          password: hashedPassword,
          email: center.email,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(center.name)}&background=0d9488&color=fff`,
          type: 'PRINT_CENTER',
          isActive: true,
          printCenter: {
            create: {
              name: center.name,
              location: center.location,
              address: center.address,
              latitude: center.latitude,
              longitude: center.longitude,
            },
          },
        },
      });
      console.log(`✅ Print center created: ${center.name}`);
    }

    // 2. Create test students with coordinates for proximity testing
    console.log('\n👥 Creating test students with locations...');
    
    const testStudents = [
      {
        phone: '+201111111112',
        email: 'student2@test.com',
        name: 'Sara Ahmed',
        latitude: 30.0300,
        longitude: 31.2100, // Close to Engineering center
      },
      {
        phone: '+201111111113',
        email: 'student3@test.com',
        name: 'Omar Hassan',
        latitude: 30.0360,
        longitude: 31.2190, // Close to Medicine center
      },
    ];

    for (const student of testStudents) {
      await prisma.user.upsert({
        where: { phone: student.phone },
        update: {},
        create: {
          phone: student.phone,
          password: hashedPassword,
          email: student.email,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=3b82f6&color=fff`,
          type: 'STUDENT',
          isActive: true,
          student: {
            create: {
              name: student.name,
            },
          },
        },
      });
      console.log(`✅ Test student created: ${student.name}`);
    }

    // 3. Create print orders with different types and locations
    console.log('\n📋 Creating test print orders...');

    // Get some books and materials for print orders
    const books = await prisma.book.findMany({ take: 3 });
    const materials = await prisma.material.findMany({ take: 3 });
    const students = await prisma.user.findMany({ 
      where: { type: 'STUDENT' },
      include: { student: true }
    });

    if (books.length > 0 && students.length > 0) {
      // Create CONTENT orders (books/materials for printing)
      const printOrders = [
        {
          userId: students[0].id,
          items: [
            {
              referenceType: 'BOOK',
              referenceId: books[0].id,
              quantity: 2,
              price: 50.0,
            }
          ],
          address: 'Engineering Campus, Building A',
          latitude: 30.0300,
          longitude: 31.2100,
          orderType: 'CONTENT',
        },
        {
          userId: students[1]?.id || students[0].id,
          items: [
            {
              referenceType: 'MATERIAL',
              referenceId: materials[0]?.id || books[0].id,
              quantity: 1,
              price: 25.0,
            }
          ],
          address: 'Medicine Campus, Building B',
          latitude: 30.0360,
          longitude: 31.2190,
          orderType: 'CONTENT',
        },
        {
          userId: students[2]?.id || students[0].id,
          items: [
            {
              referenceType: 'BOOK',
              referenceId: books[1]?.id || books[0].id,
              quantity: 3,
              price: 75.0,
            }
          ],
          address: 'Main Library, Study Area',
          latitude: 30.0400,
          longitude: 31.2300,
          orderType: 'CONTENT',
        },
      ];

      for (let i = 0; i < printOrders.length; i++) {
        const orderData = printOrders[i];
        const total = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const order = await prisma.order.create({
          data: {
            userId: orderData.userId,
            total,
            status: i === 0 ? 'PAID' : 'CREATED', // First order is PAID for assignment testing
            orderType: orderData.orderType,
            address: orderData.address,
            latitude: orderData.latitude,
            longitude: orderData.longitude,
            items: {
              create: orderData.items,
            },
          },
          include: {
            items: true,
            user: { select: { phone: true } },
          },
        });
        
        console.log(`✅ Print order created: ${order.id.slice(0, 8)} (${order.status})`);
        
        // If order is PAID, manually assign to nearest print center for testing
        if (order.status === 'PAID') {
          const centers = await prisma.printCenter.findMany({
            where: {
              isActive: true,
              latitude: { not: null },
              longitude: { not: null },
            },
          });
          
          if (centers.length > 0) {
            // Calculate distances and find nearest
            const distances = centers.map(center => ({
              center,
              distance: Math.sqrt(
                Math.pow(center.latitude - order.latitude, 2) + 
                Math.pow(center.longitude - order.longitude, 2)
              )
            }));
            
            distances.sort((a, b) => a.distance - b.distance);
            const nearestCenter = distances[0].center;
            
            const assignment = await prisma.printOrderAssignment.create({
              data: {
                orderId: order.id,
                printCenterId: nearestCenter.id,
                status: 'PENDING',
              },
            });
            
            console.log(`  ✅ Assigned to: ${nearestCenter.name}`);
          }
        }
      }
    }

    // 4. Create additional print options for testing
    console.log('\n🖨️ Creating additional print options...');
    
    if (books.length > 0) {
      const additionalPrintOptions = [
        {
          bookId: books[0].id,
          colorType: 'COLOR',
          copies: 1,
          paperType: 'A4',
          doubleSide: true,
        },
        {
          bookId: books[1]?.id || books[0].id,
          colorType: 'BLACK_WHITE',
          copies: 1,
          paperType: 'A3',
          doubleSide: false,
        },
      ];

      for (const option of additionalPrintOptions) {
        await prisma.printOption.create({
          data: option,
        });
        console.log(`✅ Print option created: ${option.colorType} ${option.paperType}`);
      }
    }

    // 5. Create some print assignments with different statuses for dashboard testing
    console.log('\n📊 Creating print assignments with various statuses...');
    
    const assignments = await prisma.printOrderAssignment.findMany({
      include: { printCenter: true }
    });
    
    if (assignments.length > 0) {
      // Update first assignment to ACCEPTED
      await prisma.printOrderAssignment.update({
        where: { id: assignments[0].id },
        data: { 
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });
      console.log('✅ Assignment updated to ACCEPTED');
      
      // Create another order and assignment for PRINTING status
      if (students.length > 0 && books.length > 0) {
        const printingOrder = await prisma.order.create({
          data: {
            userId: students[0].id,
            total: 30.0,
            status: 'PAID',
            orderType: 'CONTENT',
            address: 'Test Location for Printing',
            latitude: 30.0320,
            longitude: 31.2120,
            items: {
              create: [{
                referenceType: 'BOOK',
                referenceId: books[0].id,
                quantity: 1,
                price: 30.0,
              }],
            },
          },
        });
        
        const printCenters = await prisma.printCenter.findMany({ take: 1 });
        if (printCenters.length > 0) {
          await prisma.printOrderAssignment.create({
            data: {
              orderId: printingOrder.id,
              printCenterId: printCenters[0].id,
              status: 'PRINTING',
              acceptedAt: new Date(),
            },
          });
          console.log('✅ Assignment created with PRINTING status');
        }
      }
    }

    console.log('\n✨ Print System Seed Complete!');
    console.log('\n📝 Test Accounts:');
    console.log('   Main Print Center: +205555555551 / Password123!');
    console.log('   Engineering Center: +205555555552 / Password123!');
    console.log('   Medicine Center: +205555555553 / Password123!');
    console.log('   Library Center: +205555555554 / Password123!');
    console.log('   Admin: +201234567890 / Password123!');
    console.log('\n🎯 Test Scenarios:');
    console.log('   1. Login to print center dashboard to see assigned orders');
    console.log('   2. Create new orders and change status to PAID to test auto-assignment');
    console.log('   3. Check Settings page for print options');
    console.log('   4. Test proximity-based assignment with different student locations');

  } catch (error) {
    console.error('❌ Print system seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedPrintSystem()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = seedPrintSystem;