const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssignments() {
  console.log('📋 Checking print assignments...\n');
  
  try {
    const assignments = await prisma.printOrderAssignment.findMany({
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
    
    console.log(`Found ${assignments.length} assignments:`);
    assignments.forEach(a => {
      console.log(`- ${a.id.slice(0,8)}: Order ${a.order.id.slice(0,8)} -> ${a.printCenter.name} (${a.status})`);
      console.log(`  Student: ${a.order.user.student?.name || 'Unknown'} (${a.order.user.phone})`);
      console.log(`  Total: ${a.order.total} EGP`);
      console.log('');
    });
    
    // Check which print center the test user belongs to
    const testUser = await prisma.user.findFirst({
      where: { phone: '+205555555551' },
      include: { printCenter: true }
    });
    
    console.log('Test print center user:');
    console.log(`- Phone: ${testUser.phone}`);
    console.log(`- Print Center ID: ${testUser.printCenter?.id || 'None'}`);
    console.log(`- Print Center Name: ${testUser.printCenter?.name || 'None'}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssignments();