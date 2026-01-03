/**
 * Database Seed Script
 * Populates the database with initial data
 * 
 * IMPORTANT: Make sure your database is set up and DATABASE_URL is configured in .env file
 * 
 * Usage:
 *   npm run prisma:seed
 *   or
 *   node prisma/seed.js
 * 
 * Default password for all seeded users: Password123!
 */

// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Default password for all seeded users
const DEFAULT_PASSWORD = 'Password123!';
const hashedPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 12);

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (optional - comment out if you want to keep existing data)
  // await clearDatabase();

  // 1. Create Admin User
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.user.upsert({
    where: { phone: '+201234567890' },
    update: {},
    create: {
      phone: '+201234567890',
      password: hashedPassword,
      email: 'admin@studify.com',
      avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=14b8a6&color=fff',
      type: 'ADMIN',
      isActive: true,
      admin: {
        create: {},
      },
    },
    include: { admin: true },
  });
  console.log('✅ Admin created:', adminUser.email);

  // 2. Create Colleges
  console.log('\n🏛️ Creating colleges...');
  const colleges = [
    { name: 'كلية الهندسة' },
    { name: 'كلية الطب' },
    { name: 'كلية العلوم' },
    { name: 'كلية التجارة' },
    { name: 'كلية الآداب' },
    { name: 'كلية الحقوق' },
  ];

  const createdColleges = [];
  for (const college of colleges) {
    // Check if college exists
    let created = await prisma.college.findFirst({
      where: { name: college.name },
    });

    if (!created) {
      created = await prisma.college.create({
        data: college,
      });
      console.log(`✅ College created: ${college.name}`);
    } else {
      console.log(`⏭️  College already exists: ${college.name}`);
    }
    createdColleges.push(created);
  }

  // 3. Create Departments
  console.log('\n📚 Creating departments...');
  const departments = [
    { name: 'هندسة البرمجيات', collegeId: createdColleges[0].id },
    { name: 'هندسة الحاسبات', collegeId: createdColleges[0].id },
    { name: 'هندسة الاتصالات', collegeId: createdColleges[0].id },
    { name: 'الطب البشري', collegeId: createdColleges[1].id },
    { name: 'طب الأسنان', collegeId: createdColleges[1].id },
    { name: 'الصيدلة', collegeId: createdColleges[1].id },
    { name: 'الرياضيات', collegeId: createdColleges[2].id },
    { name: 'الفيزياء', collegeId: createdColleges[2].id },
    { name: 'الكيمياء', collegeId: createdColleges[2].id },
    { name: 'المحاسبة', collegeId: createdColleges[3].id },
    { name: 'إدارة الأعمال', collegeId: createdColleges[3].id },
    { name: 'الاقتصاد', collegeId: createdColleges[3].id },
  ];

  const createdDepartments = [];
  for (const dept of departments) {
      // Check if department exists
    const existing = await prisma.department.findFirst({
      where: {
        name: dept.name,
        collegeId: dept.collegeId,
      },
    });

    const created = existing || await prisma.department.create({
      data: dept,
    });
    createdDepartments.push(created);
    console.log(`✅ Department created: ${dept.name}`);
  }

  // 4. Create Students
  console.log('\n🎓 Creating students...');
  const students = [
    {
      phone: '+201111111111',
      email: 'student1@studify.com',
      name: 'أحمد محمد',
      collegeId: createdColleges[0].id,
      departmentId: createdDepartments[0].id,
    },
    {
      phone: '+201111111112',
      email: 'student2@studify.com',
      name: 'فاطمة علي',
      collegeId: createdColleges[1].id,
      departmentId: createdDepartments[3].id,
    },
    {
      phone: '+201111111113',
      email: 'student3@studify.com',
      name: 'محمد حسن',
      collegeId: createdColleges[2].id,
      departmentId: createdDepartments[6].id,
    },
  ];

  const createdStudents = [];
  for (const student of students) {
    const user = await prisma.user.upsert({
      where: { phone: student.phone },
      update: {},
      create: {
        phone: student.phone,
        password: hashedPassword,
        email: student.email,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=0d9488&color=fff`,
        type: 'STUDENT',
        isActive: true,
        student: {
          create: {
            name: student.name,
            collegeId: student.collegeId,
            departmentId: student.departmentId,
          },
        },
      },
      include: { student: true },
    });
    createdStudents.push(user);
    console.log(`✅ Student created: ${student.name}`);
  }

  // 5. Create Doctors
  console.log('\n👨‍⚕️ Creating doctors...');
  const doctors = [
    {
      phone: '+202222222221',
      email: 'doctor1@studify.com',
      name: 'د. سامي أحمد',
      specialization: 'هندسة البرمجيات',
    },
    {
      phone: '+202222222222',
      email: 'doctor2@studify.com',
      name: 'د. منى خالد',
      specialization: 'الطب البشري',
    },
    {
      phone: '+202222222223',
      email: 'doctor3@studify.com',
      name: 'د. خالد محمود',
      specialization: 'الرياضيات',
    },
  ];

  const createdDoctors = [];
  for (const doctor of doctors) {
    const user = await prisma.user.upsert({
      where: { phone: doctor.phone },
      update: {},
      create: {
        phone: doctor.phone,
        password: hashedPassword,
        email: doctor.email,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=7c3aed&color=fff`,
        type: 'DOCTOR',
        isActive: true,
        doctor: {
          create: {
            name: doctor.name,
            specialization: doctor.specialization,
            approvalStatus: 'APPROVED',
            approvedAt: new Date(),
          },
        },
      },
      include: { doctor: true },
    });
    createdDoctors.push(user);
    console.log(`✅ Doctor created: ${doctor.name}`);
  }

  // 6. Create Delivery
  console.log('\n🚚 Creating delivery personnel...');
  const deliveries = [
    {
      phone: '+203333333331',
      email: 'delivery1@studify.com',
      name: 'محمد السائق',
      vehicleType: 'Motorcycle',
    },
    {
      phone: '+203333333332',
      email: 'delivery2@studify.com',
      name: 'أحمد الناقل',
      vehicleType: 'Car',
    },
  ];

  const createdDeliveries = [];
  for (const delivery of deliveries) {
    const user = await prisma.user.upsert({
      where: { phone: delivery.phone },
      update: {},
      create: {
        phone: delivery.phone,
        password: hashedPassword,
        email: delivery.email,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(delivery.name)}&background=f59e0b&color=fff`,
        type: 'DELIVERY',
        isActive: true,
        delivery: {
          create: {
            name: delivery.name,
            vehicleType: delivery.vehicleType,
            status: 'AVAILABLE',
          },
        },
      },
      include: { delivery: true },
    });
    createdDeliveries.push(user);
    console.log(`✅ Delivery created: ${delivery.name}`);
  }

  // 7. Create Customer (Wholesale)
  console.log('\n🏢 Creating wholesale customers...');
  const customers = [
    {
      phone: '+204444444441',
      email: 'customer1@studify.com',
      entityName: 'مكتبة النور',
      contactPerson: 'علي محمد',
      phone: '+201000000001',
    },
    {
      phone: '+204444444442',
      email: 'customer2@studify.com',
      entityName: 'دار المعرفة',
      contactPerson: 'سارة أحمد',
      phone: '+201000000002',
    },
  ];

  const createdCustomers = [];
  for (const customer of customers) {
    const user = await prisma.user.upsert({
      where: { phone: customer.phone },
      update: {},
      create: {
        phone: customer.phone,
        password: hashedPassword,
        email: customer.email,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.entityName)}&background=ef4444&color=fff`,
        type: 'CUSTOMER',
        isActive: true,
        customer: {
          create: {
            entityName: customer.entityName,
            contactPerson: customer.contactPerson,
            phone: customer.phone,
          },
        },
      },
      include: { customer: true },
    });
    createdCustomers.push(user);
    console.log(`✅ Customer created: ${customer.entityName}`);
  }

  // 8. Create Book Categories
  console.log('\n📖 Creating book categories...');
  const bookCategories = [
    { name: 'هندسة البرمجيات' },
    { name: 'الطب والعلوم الصحية' },
    { name: 'الرياضيات والفيزياء' },
    { name: 'الأدب واللغة' },
    { name: 'التاريخ' },
    { name: 'الفلسفة' },
    { name: 'العلوم الطبيعية' },
  ];

  const createdBookCategories = [];
  for (const category of bookCategories) {
    // Check if category exists
    let created = await prisma.bookCategory.findFirst({
      where: { name: category.name },
    });

    if (!created) {
      created = await prisma.bookCategory.create({
        data: category,
      });
      console.log(`✅ Book category created: ${category.name}`);
    } else {
      console.log(`⏭️  Book category already exists: ${category.name}`);
    }
    createdBookCategories.push(created);
  }

  // 9. Create Product Categories
  console.log('\n🛍️ Creating product categories...');
  const productCategories = [
    { name: 'أدوات مكتبية' },
    { name: 'كتب ومراجع' },
    { name: 'أجهزة إلكترونية' },
    { name: 'ملابس جامعية' },
    { name: 'مستلزمات دراسية' },
  ];

  const createdProductCategories = [];
  for (const category of productCategories) {
    // Check if category exists
    let created = await prisma.productCategory.findFirst({
      where: { name: category.name },
    });

    if (!created) {
      created = await prisma.productCategory.create({
        data: category,
      });
      console.log(`✅ Product category created: ${category.name}`);
    } else {
      console.log(`⏭️  Product category already exists: ${category.name}`);
    }
    createdProductCategories.push(created);
  }

  // 10. Create Sample Books
  console.log('\n📚 Creating sample books...');
  const books = [
    {
      title: 'مقدمة في البرمجة',
      description: 'كتاب شامل يغطي أساسيات البرمجة والمفاهيم الأساسية',
      fileUrl: 'https://example.com/books/intro-programming.pdf',
      totalPages: 350,
      categoryId: createdBookCategories[0].id,
      doctorId: createdDoctors[0].doctor.id,
      approvalStatus: 'APPROVED',
    },
    {
      title: 'أساسيات الطب البشري',
      description: 'مرجع شامل لطلاب الطب في السنوات الأولى',
      fileUrl: 'https://example.com/books/medical-basics.pdf',
      totalPages: 500,
      categoryId: createdBookCategories[1].id,
      doctorId: createdDoctors[1].doctor.id,
      approvalStatus: 'APPROVED',
    },
    {
      title: 'الرياضيات المتقدمة',
      description: 'كتاب يغطي مواضيع متقدمة في الرياضيات',
      fileUrl: 'https://example.com/books/advanced-math.pdf',
      totalPages: 420,
      categoryId: createdBookCategories[2].id,
      doctorId: createdDoctors[2].doctor.id,
      approvalStatus: 'APPROVED',
    },
  ];

  const createdBooks = [];
  for (const book of books) {
    const created = await prisma.book.create({
      data: book,
    });
    createdBooks.push(created);
    console.log(`✅ Book created: ${book.title}`);

    // Add book pricing
    await prisma.bookPricing.createMany({
      data: [
        {
          bookId: created.id,
          accessType: 'READ',
          price: 50.0,
          approvalStatus: 'APPROVED',
        },
        {
          bookId: created.id,
          accessType: 'BUY',
          price: 200.0,
          approvalStatus: 'APPROVED',
        },
        {
          bookId: created.id,
          accessType: 'PRINT',
          price: 150.0,
          approvalStatus: 'APPROVED',
        },
      ],
    });
    console.log(`  ✅ Book pricing added`);
  }

  // 11. Create Sample Products
  console.log('\n🛒 Creating sample products...');
  const products = [
    {
      name: 'دفتر ملاحظات جامعي',
      description: 'دفتر عالي الجودة مناسب للطلاب',
      categoryId: createdProductCategories[0].id,
    },
    {
      name: 'حقيبة طلابية',
      description: 'حقيبة متينة ومريحة للطلاب',
      categoryId: createdProductCategories[4].id,
    },
    {
      name: 'أقلام جاف',
      description: 'مجموعة من الأقلام عالية الجودة',
      categoryId: createdProductCategories[0].id,
    },
  ];

  const createdProducts = [];
  for (const product of products) {
    const created = await prisma.product.create({
      data: product,
    });
    createdProducts.push(created);
    console.log(`✅ Product created: ${product.name}`);

    // Add product pricing
    await prisma.productPricing.createMany({
      data: [
        {
          productId: created.id,
          minQuantity: 1,
          price: 25.0,
        },
        {
          productId: created.id,
          minQuantity: 10,
          price: 20.0,
        },
        {
          productId: created.id,
          minQuantity: 50,
          price: 15.0,
        },
      ],
    });
    console.log(`  ✅ Product pricing added`);
  }

  // 12. Create Roles & Permissions
  console.log('\n🔐 Creating roles and permissions...');
  
  const permissions = [
    { key: 'users.read' },
    { key: 'users.create' },
    { key: 'users.update' },
    { key: 'users.delete' },
    { key: 'books.read' },
    { key: 'books.create' },
    { key: 'books.update' },
    { key: 'books.delete' },
    { key: 'books.approve' },
    { key: 'products.read' },
    { key: 'products.create' },
    { key: 'products.update' },
    { key: 'products.delete' },
    { key: 'orders.read' },
    { key: 'orders.update' },
    { key: 'admin.dashboard' },
    { key: 'admin.settings' },
  ];

  const createdPermissions = [];
  for (const permission of permissions) {
    // Check if permission exists (key is unique)
    let created = await prisma.permission.findUnique({
      where: { key: permission.key },
    });

    if (!created) {
      created = await prisma.permission.create({
        data: permission,
      });
    }
    createdPermissions.push(created);
  }
  console.log(`✅ Created/Found ${createdPermissions.length} permissions`);

  // Get or create admin role
  let adminRole = await prisma.role.findUnique({
    where: { name: 'Admin' },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { name: 'Admin' },
    });
  }

  // Connect all permissions to admin role
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log('✅ Admin role created/updated');

  // Get or create doctor role
  const doctorPermissions = createdPermissions.filter((p) => 
    p.key.startsWith('books.') || p.key === 'users.read'
  );
  
  let doctorRole = await prisma.role.findUnique({
    where: { name: 'Doctor' },
  });

  if (!doctorRole) {
    doctorRole = await prisma.role.create({
      data: { name: 'Doctor' },
    });
  }

  // Connect doctor permissions
  for (const permission of doctorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: doctorRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: doctorRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log('✅ Doctor role created/updated');

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });
  console.log('✅ Admin role assigned to admin user');

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📝 Default credentials:');
  console.log('   Admin: +201234567890 / Password123!');
  console.log('   Student: +201111111111 / Password123!');
  console.log('   Doctor: +202222222221 / Password123!');
  console.log('   Delivery: +203333333331 / Password123!');
  console.log('   Customer: +204444444441 / Password123!');
}

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  
  // Delete in correct order to respect foreign key constraints
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.wholesaleOrderItem.deleteMany();
  await prisma.wholesaleOrder.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productPricing.deleteMany();
  await prisma.product.deleteMany();
  await prisma.bookPricing.deleteMany();
  await prisma.printOption.deleteMany();
  await prisma.book.deleteMany();
  await prisma.department.deleteMany();
  await prisma.college.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.bookCategory.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aiChatMessage.deleteMany();
  await prisma.aiChatSession.deleteMany();
  await prisma.deliveryAssignment.deleteMany();
  await prisma.deliveryLocation.deleteMany();
  await prisma.deliveryWallet.deleteMany();
  await prisma.financialTransaction.deleteMany();
  await prisma.adminOperationLog.deleteMany();
  await prisma.dashboardMetric.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.student.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('✅ Database cleared');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

