const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAssignments() {
  console.log('🔧 Fixing print assignments...\n');
  
  try {
    // Get the main print center (the one our test user belongs to)
    const mainPrintCenter = await prisma.printCenter.findFirst({
      where: { name: 'Main Campus Print Center' }
    });
    
    if (!mainPrintCenter) {
      console.log('❌ Main Campus Print Center not found');
      return;
    }
    
    console.log(`Found main print center: ${mainPrintCenter.name} (${mainPrintCenter.id.slice(0, 8)})`);
    
    // Update all assignments to point to the main print center
    const updateResult = await prisma.printOrderAssignment.updateMany({
      data: {
        printCenterId: mainPrintCenter.id
      }
    });
    
    console.log(`✅ Updated ${updateResult.count} assignments to main print center`);
    
    // Verify the update
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
    
    console.log('\nUpdated assignments:');
    assignments.forEach(a => {
      console.log(`- ${a.id.slice(0,8)}: Order ${a.order.id.slice(0,8)} -> ${a.printCenter.name} (${a.status})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAssignments();